import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailRequest {
  type: "signup_confirmation" | "password_reset";
  email: string;
  user_id?: string;
  redirect_url?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, redirect_url }: AuthEmailRequest = await req.json();
    console.log(`Processing auth email: type=${type}, email=${email}`);

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    // Create admin client to generate links
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let emailSubject: string;
    let emailHtml: string;
    let confirmationUrl: string;

    if (type === "signup_confirmation") {
      // Generate magic link - confirms email AND logs user in
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: email,
        options: {
          redirectTo: redirect_url || "https://escoria.ch/profil/erstellen",
        },
      });

      if (error) {
        console.error("Error generating confirmation link:", error);
        throw new Error(`Failed to generate confirmation link: ${error.message}`);
      }

      confirmationUrl = data.properties.action_link;
      console.log("Generated magiclink confirmation URL for:", email);

      emailSubject = "Bestätige deine E-Mail-Adresse - ESCORIA";
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e91e63; margin: 0;">ESCORIA</h1>
            <p style="color: #666; margin: 5px 0;">Schweizer Dating-Plattform</p>
          </div>
          
          <h2 style="color: #333;">Willkommen bei ESCORIA!</h2>
          
          <p>Vielen Dank für deine Registrierung. Bitte bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%); 
                      color: white; 
                      padding: 15px 40px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);">
              E-Mail bestätigen
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Oder kopiere diesen Link in deinen Browser:<br>
            <a href="${confirmationUrl}" style="color: #e91e63; word-break: break-all;">${confirmationUrl}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Falls du dich nicht bei ESCORIA registriert hast, kannst du diese E-Mail ignorieren.<br>
            © ${new Date().getFullYear()} ESCORIA - Alle Rechte vorbehalten.
          </p>
        </body>
        </html>
      `;
    } else if (type === "password_reset") {
      // Generate password reset link
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: email,
        options: {
          redirectTo: redirect_url || "https://escoria.ch/reset-password",
        },
      });

      if (error) {
        console.error("Error generating reset link:", error);
        throw new Error(`Failed to generate reset link: ${error.message}`);
      }

      confirmationUrl = data.properties.action_link;

      emailSubject = "Passwort zurücksetzen - ESCORIA";
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e91e63; margin: 0;">ESCORIA</h1>
            <p style="color: #666; margin: 5px 0;">Schweizer Dating-Plattform</p>
          </div>
          
          <h2 style="color: #333;">Passwort zurücksetzen</h2>
          
          <p>Du hast angefordert, dein Passwort zurückzusetzen. Klicke auf den Button unten, um ein neues Passwort zu erstellen.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%); 
                      color: white; 
                      padding: 15px 40px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);">
              Neues Passwort erstellen
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Oder kopiere diesen Link in deinen Browser:<br>
            <a href="${confirmationUrl}" style="color: #e91e63; word-break: break-all;">${confirmationUrl}</a>
          </p>
          
          <p style="color: #999; font-size: 13px; margin-top: 20px;">
            <strong>Hinweis:</strong> Dieser Link ist nur 24 Stunden gültig.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Falls du kein neues Passwort angefordert hast, kannst du diese E-Mail ignorieren.<br>
            © ${new Date().getFullYear()} ESCORIA - Alle Rechte vorbehalten.
          </p>
        </body>
        </html>
      `;
    } else {
      throw new Error(`Unknown email type: ${type}`);
    }

    // Send email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ESCORIA <noreply@escoria.ch>",
        to: [email],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", result);
      throw new Error(result.message || "Failed to send email");
    }

    console.log(`Auth email sent successfully: type=${type}, email=${email}`, result);

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-auth-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
