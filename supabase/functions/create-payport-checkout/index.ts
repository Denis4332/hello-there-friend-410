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
 * DEBUG-MODUS OPTIONEN (via Secrets):
 * ============================================================
 * 
 * PAYPORT_FORCE_RETURN_ORIGIN - Überschreibt die Return-URL Origin
 *   Beispiel: "https://test.web" für Whitelist-Test
 * 
 * PAYPORT_AMOUNT_MULTIPLIER - Multiplikator für Amount (Default: 1)
 *   Beispiel: "100" falls PayPort Rappen statt CHF erwartet
 * 
 * PAYPORT_NOTIFY_PARAM - Parameter-Name für Notify-URL (optional)
 *   Beispiel: "n" 
 * 
 * PAYPORT_CANCEL_PARAM - Parameter-Name für Cancel-URL (optional)
 *   Beispiel: "k"
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
    
    console.log('[PAYPORT] ========== CHECKOUT REQUEST ==========');
    console.log('[PAYPORT] Input:', { profile_id, listing_type, amount });

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

    /**
     * DEBUG OPTIONS - Optionale Overrides für Testing
     */
    const forceReturnOrigin = (Deno.env.get('PAYPORT_FORCE_RETURN_ORIGIN') || '').trim();
    const amountMultiplier = parseInt(Deno.env.get('PAYPORT_AMOUNT_MULTIPLIER') || '1', 10) || 1;
    const notifyParam = (Deno.env.get('PAYPORT_NOTIFY_PARAM') || '').trim();
    const cancelParam = (Deno.env.get('PAYPORT_CANCEL_PARAM') || '').trim();

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
      accessKeyPrefix: accessKey.substring(0, 8) + '...',
      accessKeyLength: accessKey.length,
      secretKeyLength: secretKey.length,
      countryCode,
      checkoutUrlHost: new URL(checkoutUrl).host,
    });
    
    console.log('[PAYPORT] Debug options:', {
      forceReturnOrigin: forceReturnOrigin || '(not set - using request origin)',
      amountMultiplier,
      notifyParam: notifyParam || '(not set)',
      cancelParam: cancelParam || '(not set)',
    });

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Generate unique reference ID
    const timestamp = Date.now();
    const referenceId = `ESC-${timestamp}-${listing_type.toUpperCase()}`;
    
    console.log('[PAYPORT] Generated Reference ID:', referenceId);

    /**
     * AMOUNT NORMALISIERUNG
     * - Multiplier erlaubt Test ob PayPort Rappen statt CHF erwartet
     */
    const rawAmount = Number(amount);
    const finalAmount = rawAmount * amountMultiplier;
    const amountStr = String(finalAmount).trim();
    
    console.log('[PAYPORT] Amount calculation:', {
      rawAmount,
      amountMultiplier,
      finalAmount,
      amountStr,
    });
    
    const currency = 'CHF';
    
    /**
     * ORIGIN HANDLING
     * - Wenn PAYPORT_FORCE_RETURN_ORIGIN gesetzt ist, wird diese verwendet
     * - Sonst wird die Origin aus dem Request Header genommen
     * - Fallback auf escoria.ch
     */
    const requestOrigin = req.headers.get('origin') || 'https://escoria.ch';
    const effectiveOrigin = forceReturnOrigin || requestOrigin;
    
    const successUrl = `${effectiveOrigin}/zahlung/erfolg?ref=${referenceId}`;
    const cancelUrl = `${effectiveOrigin}/zahlung/abgebrochen`;
    const notifyUrl = `${supabaseUrl}/functions/v1/payport-webhook`;

    console.log('[PAYPORT] URL configuration:', {
      requestOrigin,
      effectiveOrigin,
      successUrl,
      cancelUrl,
      notifyUrl,
    });

    /**
     * HASH BERECHNUNG nach PayPort Dokumentation
     * Format: accessKey + amount + currency + countryCode + secretKey
     * WICHTIG: Die successUrl ist NICHT Teil des Hashs!
     */
    const hashString = accessKey + amountStr + currency + countryCode + secretKey;
    
    console.log('[PAYPORT] Hash input components:', {
      accessKeyPrefix: accessKey.substring(0, 8) + '...',
      amountStr,
      currency,
      countryCode,
      secretKeyPrefix: secretKey.substring(0, 4) + '...',
      totalHashInputLength: hashString.length,
    });
    
    const encoder = new TextEncoder();
    const data = encoder.encode(hashString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    console.log('[PAYPORT] Hash generated:', hash.substring(0, 20) + '...');

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
     * 
     * Optionale Parameter werden nur hinzugefügt wenn konfiguriert
     */
    const params = new URLSearchParams({
      ak: accessKey,
      r: successUrl,
      a: amountStr,
      c: currency,
      cc: countryCode,
      h: hash,
    });
    
    // Optionale Notify-URL hinzufügen
    if (notifyParam) {
      params.set(notifyParam, notifyUrl);
      console.log('[PAYPORT] Added notify URL with param:', notifyParam);
    }
    
    // Optionale Cancel-URL hinzufügen
    if (cancelParam) {
      params.set(cancelParam, cancelUrl);
      console.log('[PAYPORT] Added cancel URL with param:', cancelParam);
    }

    const fullCheckoutUrl = `${checkoutUrl}?${params.toString()}`;
    
    // DEBUG: Vollständige URL loggen (mit maskierten Secrets)
    const maskedUrl = fullCheckoutUrl
      .replace(accessKey, '[ACCESS_KEY]')
      .replace(hash, '[HASH]');
    
    console.log('[PAYPORT] ========== FINAL CHECKOUT URL ==========');
    console.log('[PAYPORT] Masked URL:', maskedUrl);
    console.log('[PAYPORT] URL Length:', fullCheckoutUrl.length);
    console.log('[PAYPORT] ===========================================');

    return new Response(
      JSON.stringify({ 
        checkout_url: fullCheckoutUrl,
        reference_id: referenceId,
        debug: {
          effectiveOrigin,
          amountUsed: amountStr,
          amountMultiplier,
          forceReturnOriginActive: !!forceReturnOrigin,
        }
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
