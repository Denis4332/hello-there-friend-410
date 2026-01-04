/**
 * PayPort Test Links - Debug Only
 * Generates 4 checkout links with different hash variants to find the correct one.
 * NO database writes, NO profile updates - pure link generation.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SHA-256 hex lowercase
const sha256HexLower = async (input: string): Promise<string> => {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// SHA-256 hex uppercase
const sha256HexUpper = async (input: string): Promise<string> => {
  return (await sha256HexLower(input)).toUpperCase();
};

// HMAC-SHA256 hex lowercase
const hmacSha256HexLower = async (key: string, message: string): Promise<string> => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessKey = (Deno.env.get("PAYPORT_ACCESS_KEY") || "").trim();
    const secretKey = (Deno.env.get("PAYPORT_SECRET_KEY") || "").trim();
    const countryCode = (Deno.env.get("PAYPORT_COUNTRY_CODE") || "TE").trim().toUpperCase();
    const checkoutBaseUrl = (Deno.env.get("PAYPORT_CHECKOUT_URL") || "").trim();

    // Validation
    if (!accessKey) throw new Error("PAYPORT_ACCESS_KEY not configured");
    if (!secretKey) throw new Error("PAYPORT_SECRET_KEY not configured");
    if (!checkoutBaseUrl) throw new Error("PAYPORT_CHECKOUT_URL not configured");

    // Fixed return URL as per mail
    const returnUrl = "https://test.web";

    console.log("[PAYPORT-TEST] Generating 4 hash variants...");
    console.log("[PAYPORT-TEST] ak length:", accessKey.length);
    console.log("[PAYPORT-TEST] secret length:", secretKey.length);
    console.log("[PAYPORT-TEST] cc:", countryCode);
    console.log("[PAYPORT-TEST] r:", returnUrl);
    console.log("[PAYPORT-TEST] baseUrl:", checkoutBaseUrl);

    // Variant A: sha256_hex_lower( ak + cc + secret )
    const hashA = await sha256HexLower(accessKey + countryCode + secretKey);
    
    // Variant B: sha256_hex_upper( ak + cc + secret )
    const hashB = await sha256HexUpper(accessKey + countryCode + secretKey);
    
    // Variant C: sha256_hex_lower( ak + cc + r + secret )
    const hashC = await sha256HexLower(accessKey + countryCode + returnUrl + secretKey);
    
    // Variant D: HMAC_SHA256_hex_lower( secret, ak + cc + r )
    const hashD = await hmacSha256HexLower(secretKey, accessKey + countryCode + returnUrl);

    // Build URLs
    const buildUrl = (hash: string) => {
      const params = new URLSearchParams({
        ak: accessKey,
        cc: countryCode,
        r: returnUrl,
        h: hash,
      });
      return `${checkoutBaseUrl}?${params.toString()}`;
    };

    const links = {
      A: {
        description: "sha256_hex_lower( ak + cc + secret )",
        url: buildUrl(hashA),
        hash_preview: hashA.substring(0, 10) + "...",
      },
      B: {
        description: "sha256_hex_upper( ak + cc + secret )",
        url: buildUrl(hashB),
        hash_preview: hashB.substring(0, 10) + "...",
      },
      C: {
        description: "sha256_hex_lower( ak + cc + r + secret )",
        url: buildUrl(hashC),
        hash_preview: hashC.substring(0, 10) + "...",
      },
      D: {
        description: "HMAC_SHA256_hex_lower( secret, ak + cc + r )",
        url: buildUrl(hashD),
        hash_preview: hashD.substring(0, 10) + "...",
      },
    };

    console.log("[PAYPORT-TEST] Links generated successfully");

    return new Response(
      JSON.stringify({
        status: "OK",
        message: "Open each link in a new tab. Report which one works (no 'Hash is not correct' error).",
        links,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("[PAYPORT-TEST] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
