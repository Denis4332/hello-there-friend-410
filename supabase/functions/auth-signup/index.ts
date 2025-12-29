import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    const { email, password, redirect_url } = await req.json();

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

    // Create user with admin API - email_confirm: true means user is already confirmed (no system mail)
    console.log("[auth-signup] Creating user with admin API...");
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // User is immediately confirmed - no system confirmation email
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

    // Use canonical domain for redirect - ensures correct domain in all environments
    // Default to escoria.ch as the production domain
    const canonicalBase = "https://escoria.ch";
    const targetUrl = `${canonicalBase}/auth/callback?next=/profil/erstellen`;
    console.log("[auth-signup] Generating magic link with redirect to:", targetUrl);

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: email,
      options: {
        redirectTo: targetUrl,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("[auth-signup] Generate link error:", linkError?.message);
      return new Response(
        JSON.stringify({ error: "Bestätigungslink konnte nicht erstellt werden" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const confirmationUrl = linkData.properties.action_link;
    console.log("[auth-signup] Magic link generated successfully");

    // Send email via Resend - ESCORIA Red Style
    console.log("[auth-signup] Sending confirmation email via Resend...");
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "ESCORIA <noreply@escoria.ch>",
      to: [email],
      subject: "Willkommen bei ESCORIA - Bestätige deine E-Mail",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #e5e5e5; max-width: 600px; margin: 0 auto; padding: 0; background-color: #0a0a0a;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #141414 0%, #1a1a1a 100%); padding: 40px 20px; text-align: center; border-bottom: 3px solid #B91C1C;">
            <h1 style="color: #B91C1C; margin: 0; font-size: 36px; font-weight: 700; letter-spacing: 2px;">ESCORIA</h1>
            <p style="color: #888; margin: 8px 0 0 0; font-size: 14px;">Schweizer Dating-Plattform</p>
          </div>
          
          <!-- Content -->
          <div style="background-color: #141414; padding: 40px 30px;">
            <h2 style="color: #ffffff; margin: 0 0 20px 0; font-size: 24px;">Willkommen bei ESCORIA!</h2>
            
            <p style="color: #b0b0b0; font-size: 16px; margin-bottom: 30px;">
              Vielen Dank für deine Registrierung. Klicke auf den Button unten, um dich einzuloggen und dein Profil zu erstellen:
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${confirmationUrl}" 
                 style="display: inline-block; background-color: #B91C1C; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(185, 28, 28, 0.4);">
                Profil erstellen
              </a>
            </div>
            
            <p style="color: #666; font-size: 13px; margin-top: 30px;">
              Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
              <a href="${confirmationUrl}" style="color: #B91C1C; word-break: break-all; text-decoration: none;">${confirmationUrl}</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #0a0a0a; padding: 25px 30px; text-align: center; border-top: 1px solid #222;">
            <p style="color: #555; font-size: 12px; margin: 0;">
              Falls du dich nicht bei ESCORIA registriert hast, kannst du diese E-Mail ignorieren.
            </p>
            <p style="color: #444; font-size: 11px; margin: 10px 0 0 0;">
              © ${new Date().getFullYear()} ESCORIA - Alle Rechte vorbehalten
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("[auth-signup] Resend email error:", emailError);
      // User was created but email failed - we should still return success
      // but log the issue
      return new Response(
        JSON.stringify({ 
          success: true, 
          warning: "Konto erstellt, aber E-Mail konnte nicht gesendet werden" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[auth-signup] Email sent successfully:", emailData?.id);

    return new Response(
      JSON.stringify({ success: true }),
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
