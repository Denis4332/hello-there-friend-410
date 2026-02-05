import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Password validation (same rules as frontend)
function validatePassword(password: string): string | null {
  if (password.length < 8) return "Passwort muss mindestens 8 Zeichen lang sein";
  if (!/[A-Z]/.test(password)) return "Passwort muss mindestens einen Großbuchstaben enthalten";
  if (!/[a-z]/.test(password)) return "Passwort muss mindestens einen Kleinbuchstaben enthalten";
  if (!/[0-9]/.test(password)) return "Passwort muss mindestens eine Zahl enthalten";
  if (!/[^A-Za-z0-9]/.test(password)) return "Passwort muss mindestens ein Sonderzeichen enthalten";
  return null;
}

// Email validation
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    console.log("[auth-signup] Starting signup for:", email);

    // Validate inputs
    if (!email || !password) {
      console.log("[auth-signup] Missing email or password");
      return new Response(
        JSON.stringify({ error: "Email und Passwort sind erforderlich" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!validateEmail(email)) {
      console.log("[auth-signup] Invalid email format");
      return new Response(
        JSON.stringify({ error: "Ungültiges E-Mail-Format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      console.log("[auth-signup] Password validation failed:", passwordError);
      return new Response(
        JSON.stringify({ error: passwordError }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Create user with admin API - email_confirm: true means user is already confirmed
    // NO email will be sent - user can login immediately with credentials
    console.log("[auth-signup] Creating user with admin API (no email verification)...");
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // User is immediately confirmed - no verification needed
    });

    if (createError) {
      console.error("[auth-signup] Create user error:", createError.message);
      
      // Handle "already registered" case
      if (createError.message.includes("already been registered") || createError.message.includes("already exists")) {
        return new Response(
          JSON.stringify({ error: "Diese E-Mail-Adresse ist bereits registriert" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userData.user) {
      console.error("[auth-signup] No user returned after creation");
      return new Response(
        JSON.stringify({ error: "Benutzer konnte nicht erstellt werden" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[auth-signup] User created successfully:", userData.user.id);
    console.log("[auth-signup] No email sent - user can login immediately with credentials");

    return new Response(
      JSON.stringify({ success: true, user_id: userData.user.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[auth-signup] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Ein unerwarteter Fehler ist aufgetreten" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
