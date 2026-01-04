/**
 * PayPort Checkout (minimal nach Mail):
 * https://test-pip3.payport.ch/prepare/checkout?ak=...&cc=TE&r=https://test.web&h=sha256(ak+cc+secret)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sha256Hex = async (input: string) => {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile_id, listing_type, amount } = await req.json();

    if (!profile_id || !listing_type || amount == null) {
      throw new Error("Missing required parameters: profile_id, listing_type, amount");
    }

    const accessKey = (Deno.env.get("PAYPORT_ACCESS_KEY") || "").trim();
    const secretKey = (Deno.env.get("PAYPORT_SECRET_KEY") || "").trim();
    const countryCode = (Deno.env.get("PAYPORT_COUNTRY_CODE") || "TE").trim().toUpperCase();
    const checkoutBaseUrl = (Deno.env.get("PAYPORT_CHECKOUT_URL") || "").trim();

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!accessKey) throw new Error("PAYPORT_ACCESS_KEY not configured");
    if (!secretKey) throw new Error("PAYPORT_SECRET_KEY not configured");
    if (!checkoutBaseUrl) throw new Error("PAYPORT_CHECKOUT_URL not configured");
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Backend not configured");

    // Fix: exakt wie Mail (Domain only)
    const returnUrl = "https://test.web";

    // Fix: minimaler Hash nach Mail-Interpretation
    const hashInput = `${accessKey}${countryCode}${secretKey}`;
    const hash = await sha256Hex(hashInput);

    // Admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Reference
    const referenceId = `ESC-${Date.now()}-${String(listing_type).toUpperCase()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        payment_reference: referenceId,
        payment_status: "pending",
        payment_method: "payport",
        listing_type,
        status: "pending",
      })
      .eq("id", profile_id);

    if (updateError) {
      console.error("[PAYPORT] profile update error", updateError);
      throw new Error("Failed to update profile with payment reference");
    }

    const params = new URLSearchParams({
      ak: accessKey,
      cc: countryCode,
      r: returnUrl,
      h: hash,
    });

    const fullCheckoutUrl = `${checkoutBaseUrl}?${params.toString()}`;

    console.log("[PAYPORT] Checkout URL (masked):", fullCheckoutUrl.replace(accessKey, "[AK]").replace(hash, "[HASH]"));

    return new Response(
      JSON.stringify({
        checkout_url: fullCheckoutUrl,
        reference_id: referenceId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: unknown) {
    console.error("[PAYPORT] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
