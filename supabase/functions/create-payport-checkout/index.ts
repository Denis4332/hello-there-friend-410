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
     * PAYPORT SECRETS - Bei Produktionswechsel hier anpassen:
     * Gehe zu Lovable Cloud > Secrets und ändere diese Werte
     */
    const accessKey = Deno.env.get('PAYPORT_ACCESS_KEY');
    const secretKey = Deno.env.get('PAYPORT_SECRET_KEY');
    // PRODUKTION: Ändere zu 'CH'
    const countryCode = Deno.env.get('PAYPORT_COUNTRY_CODE') || 'TE';
    // PRODUKTION: Ändere zu 'https://pip3.payport.ch/prepare/checkout' (OHNE test-)
    const checkoutUrl = Deno.env.get('PAYPORT_CHECKOUT_URL') || 'https://test-pip3.payport.ch/prepare/checkout';
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!accessKey || !secretKey) {
      console.error('[PAYPORT] Secrets nicht konfiguriert!');
      throw new Error('PayPort credentials not configured');
    }

    console.log('[PAYPORT] Using checkout URL:', checkoutUrl);
    console.log('[PAYPORT] Country code:', countryCode);

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Generate unique reference ID
    const timestamp = Date.now();
    const referenceId = `ESC-${timestamp}-${listing_type.toUpperCase()}`;
    
    console.log('[PAYPORT] Generated Reference ID:', referenceId);

    /**
     * PAYPORT PARAMETER - Diese bleiben bei Produktionswechsel gleich
     */
    const currency = 'CHF';
    const successUrl = `${req.headers.get('origin') || 'https://escoria.ch'}/zahlung/erfolg?ref=${referenceId}`;
    const cancelUrl = `${req.headers.get('origin') || 'https://escoria.ch'}/zahlung/abgebrochen`;
    // Webhook URL - bleibt immer gleich (Supabase Edge Function)
    const notifyUrl = `${supabaseUrl}/functions/v1/payport-webhook`;
    
    console.log('[PAYPORT] Success URL:', successUrl);
    console.log('[PAYPORT] Webhook URL:', notifyUrl);

    /**
     * HASH BERECHNUNG nach PayPort Dokumentation
     * WICHTIG: Hash muss GENAU die Parameter enthalten die an PayPort gesendet werden!
     * Gesendete Parameter: ak (accessKey), a (amount), c (currency), cc (countryCode), r (successUrl)
     * Format: accessKey + amount + currency + countryCode + successUrl + secretKey
     */
    const hashString = accessKey + amount + currency + countryCode + successUrl + secretKey;
    
    console.log('[PAYPORT] Hash input parameters:', {
      accessKey: accessKey?.substring(0, 8) + '...',
      amount,
      currency,
      countryCode,
      successUrl,
      secretKeyLength: secretKey?.length
    });
    
    const encoder = new TextEncoder();
    const data = encoder.encode(hashString);
    
    // SHA-256 Hash (nicht HMAC, sondern einfacher Hash)
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
      a: amount.toString(),
      c: currency,
      cc: countryCode,
      h: hash,
    });
    
    console.log('[PAYPORT] Using short parameter keys: ak, r, a, c, cc, h');

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
