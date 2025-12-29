/**
 * ============================================================
 * PAYPORT WEBHOOK - EMPFÄNGT ZAHLUNGSBESTÄTIGUNG
 * ============================================================
 * 
 * Diese Edge Function wird von PayPort automatisch aufgerufen
 * nachdem eine Zahlung abgeschlossen wurde.
 * 
 * WEBHOOK URL (muss in PayPort Dashboard eingetragen sein):
 * https://fwatgrgbwgtueunihbwv.supabase.co/functions/v1/payport-webhook
 * 
 * ============================================================
 * WAS PASSIERT BEI ERFOLGREICHER ZAHLUNG:
 * ============================================================
 * 
 * 1. PayPort sendet POST-Request mit Zahlungsdaten
 * 2. Wir finden das Profil anhand der payment_reference
 * 3. payment_status wird auf 'paid' gesetzt
 * 4. Profil-Status BLEIBT 'pending' → Admin aktiviert manuell!
 * 
 * ============================================================
 * BEIM PRODUKTIONSWECHSEL:
 * ============================================================
 * 
 * - KEINE Code-Änderungen nötig!
 * - PayPort sendet automatisch an dieselbe Webhook-URL
 * - Nur die Secrets in create-payport-checkout ändern
 * 
 * ============================================================
 * PAYPORT STATUS CODES:
 * ============================================================
 * 
 * Erfolg: 'success', 'SUCCESS', 'paid', 'PAID', '1', 'completed'
 * Fehlschlag: Alles andere
 * 
 * ============================================================
 * ADMIN-WORKFLOW NACH ZAHLUNG:
 * ============================================================
 * 
 * 1. Admin sieht "Bezahlt (wartet)" Karte im Dashboard
 * 2. Klick → gefilterte Profilliste
 * 3. Admin prüft Profil und aktiviert manuell
 * 
 * ============================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[PAYPORT WEBHOOK] ====== WEBHOOK RECEIVED ======');
  console.log('[PAYPORT WEBHOOK] Method:', req.method);

  try {
    // Parse webhook payload (PayPort might send different formats)
    let webhookData: Record<string, string> = {};
    const contentType = req.headers.get('content-type') || '';
    
    console.log('[PAYPORT WEBHOOK] Content-Type:', contentType);
    
    if (contentType.includes('application/json')) {
      webhookData = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        webhookData[key] = value.toString();
      });
    } else {
      // Try to parse as text and then as URL params
      const text = await req.text();
      console.log('[PAYPORT WEBHOOK] Raw body:', text);
      const params = new URLSearchParams(text);
      params.forEach((value, key) => {
        webhookData[key] = value;
      });
    }
    
    console.log('[PAYPORT WEBHOOK] Parsed payload:', JSON.stringify(webhookData, null, 2));

    /**
     * PAYLOAD EXTRAKTION
     * PayPort kann verschiedene Feldnamen verwenden
     */
    const referenceId = webhookData.referenceId || webhookData.reference_id || webhookData.ref || webhookData.orderId;
    const status = webhookData.status || webhookData.paymentStatus || webhookData.state;
    const transactionId = webhookData.transactionId || webhookData.transaction_id || webhookData.txId;
    
    console.log('[PAYPORT WEBHOOK] Extracted data:', { referenceId, status, transactionId });

    if (!referenceId) {
      console.error('[PAYPORT WEBHOOK] No reference ID in payload!');
      // Return 200 to prevent PayPort from retrying
      return new Response('Missing reference ID', { 
        headers: corsHeaders,
        status: 200 
      });
    }

    // Get Supabase credentials
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find profile by payment_reference
    const { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('id, payment_status, status, display_name')
      .eq('payment_reference', referenceId)
      .maybeSingle();

    if (findError) {
      console.error('[PAYPORT WEBHOOK] Error finding profile:', findError);
      throw findError;
    }

    if (!profile) {
      console.error('[PAYPORT WEBHOOK] No profile found for reference:', referenceId);
      return new Response('Profile not found', { 
        headers: corsHeaders,
        status: 200 
      });
    }

    console.log('[PAYPORT WEBHOOK] Found profile:', profile.display_name, '(ID:', profile.id, ')');

    /**
     * STATUS PRÜFUNG
     * Verschiedene Schreibweisen für "Erfolg" akzeptieren
     */
    const successStatuses = ['success', 'SUCCESS', 'paid', 'PAID', '1', 'completed', 'COMPLETED'];
    const isSuccess = successStatuses.includes(String(status));
    
    console.log('[PAYPORT WEBHOOK] Payment status:', status, '-> Success:', isSuccess);

    /**
     * PROFIL UPDATE
     * Bei Erfolg: payment_status = 'paid'
     * Bei Fehlschlag: payment_status = 'failed'
     * 
     * WICHTIG: Profil-Status BLEIBT 'pending'!
     * Admin aktiviert manuell nach Prüfung.
     */
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        payment_status: isSuccess ? 'paid' : 'failed',
        payment_method: 'payport',
        // Profil-Status wird NICHT geändert - Admin aktiviert manuell
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('[PAYPORT WEBHOOK] Error updating profile:', updateError);
      throw updateError;
    }

    console.log('[PAYPORT WEBHOOK] ====== PROFILE UPDATED ======');
    console.log('[PAYPORT WEBHOOK] Profile:', profile.display_name);
    console.log('[PAYPORT WEBHOOK] Payment Status:', isSuccess ? 'PAID' : 'FAILED');
    console.log('[PAYPORT WEBHOOK] Next step: Admin muss Profil manuell aktivieren');

    // Return success to PayPort
    return new Response('OK', { 
      headers: corsHeaders,
      status: 200 
    });

  } catch (error: unknown) {
    console.error('[PAYPORT WEBHOOK] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Return 200 even on error to prevent PayPort from retrying
    return new Response(errorMessage, { 
      headers: corsHeaders,
      status: 200 
    });
  }
});
