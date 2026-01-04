/**
 * ============================================================
 * PAYPORT ZAHLUNGSINTEGRATION - CHECKOUT ERSTELLEN
 * ============================================================
 * 
 * Diese Edge Function erstellt PayPort Checkout-Sessions.
 * 
 * AKTUELLER MODUS: TEST (Sandbox)
 * 
 * ============================================================
 * PAYPORT INTEGRATION - VOLLSTÄNDIGE DATEIEN-LISTE:
 * ============================================================
 * 
 * BACKEND (Edge Functions):
 * 1. supabase/functions/create-payport-checkout/index.ts - Checkout erstellen (DIESE DATEI)
 * 2. supabase/functions/payport-webhook/index.ts - Zahlungsbestätigung empfangen
 * 
 * FRONTEND (React Seiten die Checkout aufrufen):
 * 3. src/pages/UserDashboard.tsx - "Jetzt bezahlen" Button (handlePayNow)
 * 4. src/pages/ProfileCreate.tsx - Checkout nach Profilerstellung (startPaymentCheckout)
 * 5. src/pages/ProfileUpgrade.tsx - Upgrade Zahlungen (handleUpgrade)
 * 
 * FRONTEND (Ergebnis-Seiten):
 * 6. src/pages/ZahlungErfolg.tsx - Erfolgsseite nach Zahlung
 * 7. src/pages/ZahlungAbgebrochen.tsx - Abbruch-Seite
 * 
 * ADMIN:
 * 8. src/pages/admin/AdminPendingPayments.tsx - Manuelle Zahlungsverwaltung
 * 9. src/pages/admin/AdminDashboard.tsx - "Bezahlt (wartet)" Karte
 * 10. src/pages/admin/AdminProfile.tsx - Payment-Filter in Profilliste
 * 
 * ============================================================
 * CHECKLISTE FÜR PRODUKTIONSWECHSEL:
 * ============================================================
 * 
 * Ändere diese 4 Secrets in Lovable Cloud > Secrets:
 * 
 * [ ] 1. PAYPORT_ACCESS_KEY
 *     - Test: [dein aktueller Test-Key]
 *     - Produktion: [echter Access Key von PayPort]
 * 
 * [ ] 2. PAYPORT_SECRET_KEY
 *     - Test: [dein aktueller Test-Key]
 *     - Produktion: [echter Secret Key von PayPort]
 * 
 * [ ] 3. PAYPORT_CHECKOUT_URL
 *     - Test: https://test-pip3.payport.ch/prepare/checkout
 *     - Produktion: https://pip3.payport.ch/prepare/checkout
 *     WICHTIG: Das "test-" Präfix MUSS entfernt werden!
 * 
 * [ ] 4. PAYPORT_COUNTRY_CODE
 *     - Test: TE
 *     - Produktion: CH
 * 
 * ============================================================
 * NACH DEM WECHSEL - TESTSCHRITTE:
 * ============================================================
 * 
 * [ ] 1. Testzahlung mit echtem Kleinbetrag durchführen
 * [ ] 2. Prüfen: PayPort Webhook wird aufgerufen
 * [ ] 3. Prüfen: Profile payment_status = 'paid' gesetzt
 * [ ] 4. Prüfen: Admin-Dashboard zeigt "Bezahlt (wartet)"
 * [ ] 5. Prüfen: Admin kann Profil manuell aktivieren
 * 
 * ============================================================
 * WICHTIG: KEIN CODE MUSS GEÄNDERT WERDEN!
 * Nur die 4 Secrets oben anpassen = fertig!
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

  try {
    const { profile_id, listing_type, amount } = await req.json();
    
    console.log('[PAYPORT] Checkout Request:', { profile_id, listing_type, amount });

    if (!profile_id || !listing_type || !amount) {
      throw new Error('Missing required parameters: profile_id, listing_type, amount');
    }

    /**
     * PAYPORT SECRETS - Defensiv trimmen gegen Copy/Paste Fehler
     */
    const accessKey = (Deno.env.get('PAYPORT_ACCESS_KEY') || '').trim();
    const secretKey = (Deno.env.get('PAYPORT_SECRET_KEY') || '').trim();
    const countryCode = (Deno.env.get('PAYPORT_COUNTRY_CODE') || 'TE').trim().toUpperCase();
    const checkoutUrl = (Deno.env.get('PAYPORT_CHECKOUT_URL') || 'https://test-pip3.payport.ch/prepare/checkout').trim().replace(/\/+$/, '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Detaillierte Fehlerprüfung
    if (!accessKey) {
      console.error('[PAYPORT] PAYPORT_ACCESS_KEY nicht konfiguriert!');
      throw new Error('PAYPORT_ACCESS_KEY not configured');
    }
    if (!secretKey) {
      console.error('[PAYPORT] PAYPORT_SECRET_KEY nicht konfiguriert!');
      throw new Error('PAYPORT_SECRET_KEY not configured');
    }

    console.log('[PAYPORT] Config loaded:', {
      accessKeyPrefix: accessKey.substring(0, 6) + '...',
      accessKeyLength: accessKey.length,
      secretKeyLength: secretKey.length,
      countryCode,
      checkoutUrlHost: new URL(checkoutUrl).host,
    });

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Generate unique reference ID
    const timestamp = Date.now();
    const referenceId = `ESC-${timestamp}-${listing_type.toUpperCase()}`;
    
    console.log('[PAYPORT] Generated Reference ID:', referenceId);

    /**
     * AMOUNT NORMALISIERUNG - Sicherstellen dass es ein sauberer String ist
     */
    const amountStr = String(amount).trim();
    
    const currency = 'CHF';
    const origin = req.headers.get('origin') || 'https://escoria.ch';
    const successUrl = `${origin}/zahlung/erfolg?ref=${referenceId}`;
    const cancelUrl = `${origin}/zahlung/abgebrochen`;
    const notifyUrl = `${supabaseUrl}/functions/v1/payport-webhook`;

    console.log('[PAYPORT] Payment params:', {
      amountStr,
      currency,
      countryCode,
      origin,
      successUrl,
    });

    /**
     * HASH BERECHNUNG nach PayPort Dokumentation
     * Format: accessKey + amount + currency + countryCode + successUrl + secretKey
     */
    const hashString = accessKey + amountStr + currency + countryCode + successUrl + secretKey;
    
    console.log('[PAYPORT] Hash input (ohne secrets):', {
      accessKeyPrefix: accessKey.substring(0, 6),
      amountStr,
      currency,
      countryCode,
      successUrl,
      secretKeyLength: secretKey.length,
      totalHashInputLength: hashString.length,
    });
    
    const encoder = new TextEncoder();
    const data = encoder.encode(hashString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    console.log('[PAYPORT] Hash generated:', hash.substring(0, 16) + '...');

    /**
     * PROFIL UPDATE - Setzt payment_reference für späteren Webhook-Abgleich
     * payment_status bleibt 'pending' bis Webhook 'paid' setzt
     */
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        payment_reference: referenceId,
        payment_status: 'pending',
        payment_method: 'payport',
        listing_type: listing_type,
        status: 'pending'
      })
      .eq('id', profile_id);

    if (updateError) {
      console.error('[PAYPORT] Error updating profile:', updateError);
      throw new Error('Failed to update profile with payment reference');
    }

    console.log('[PAYPORT] Profile updated with payment reference');

    /**
     * CHECKOUT URL ZUSAMMENBAUEN
     * PayPort erwartet Kurzkeys laut Dokumentation:
     * ak = Access Key, cc = Country Code, r = Return URL, h = Hash
     */
    const params = new URLSearchParams({
      ak: accessKey,
      r: successUrl,
      a: amountStr,
      c: currency,
      cc: countryCode,
      h: hash,
    });
    
    console.log('[PAYPORT] Final URL params:', params.toString().replace(accessKey, '[AK]').replace(hash, hash.substring(0, 12) + '...'));

    const fullCheckoutUrl = `${checkoutUrl}?${params.toString()}`;
    
    console.log('[PAYPORT] Checkout URL generated successfully');

    return new Response(
      JSON.stringify({ 
        checkout_url: fullCheckoutUrl,
        reference_id: referenceId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    console.error('[PAYPORT] Error creating checkout:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
