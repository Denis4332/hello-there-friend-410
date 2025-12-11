import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "contact_notification" | "welcome";
  data: {
    name?: string;
    email?: string;
    message?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data }: EmailRequest = await req.json();
    console.log(`Processing email request: type=${type}`, data);

    let emailPayload: {
      from: string;
      to: string[];
      subject: string;
      html: string;
    };

    if (type === "contact_notification") {
      emailPayload = {
        from: "ESCORIA <noreply@escoria.ch>",
        to: ["admin@escoria.ch"],
        subject: `Neue Kontaktanfrage von ${data.name}`,
        html: `
          <h2>Neue Kontaktanfrage</h2>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>E-Mail:</strong> ${data.email}</p>
          <p><strong>Nachricht:</strong></p>
          <p style="white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 5px;">${data.message}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">Diese E-Mail wurde automatisch von escoria.ch gesendet.</p>
        `,
      };
    } else if (type === "welcome") {
      emailPayload = {
        from: "ESCORIA <noreply@escoria.ch>",
        to: [data.email!],
        subject: "Willkommen bei ESCORIA",
        html: `
          <h2>Willkommen bei ESCORIA!</h2>
          <p>Hallo ${data.name || ""},</p>
          <p>Vielen Dank für deine Registrierung bei ESCORIA.</p>
          <p>Du kannst jetzt dein Profil erstellen und dein Inserat aufgeben.</p>
          <p><a href="https://escoria.ch/profil/erstellen" style="background: #e91e63; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Profil erstellen</a></p>
          <hr>
          <p style="color: #666; font-size: 12px;">Bei Fragen erreichst du uns unter admin@escoria.ch</p>
        `,
      };
    } else {
      throw new Error(`Unknown email type: ${type}`);
    }

    // Send email via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error("Resend API error:", result);
      throw new Error(result.message || "Failed to send email");
    }

    console.log(`Email sent successfully: type=${type}`, result);

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
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
