import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();

    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Password is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create SHA-1 hash of the password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    // Use k-anonymity: send only first 5 characters
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    console.log(`Checking password hash prefix: ${prefix}`);

    // Call HaveIBeenPwned API
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'User-Agent': 'Lovable-Password-Check',
        'Add-Padding': 'true', // Additional privacy protection
      },
    });

    if (!response.ok) {
      console.error('HaveIBeenPwned API error:', response.status);
      // Fail open for availability
      return new Response(
        JSON.stringify({ isLeaked: false, count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const text = await response.text();
    const hashes = text.split('\n');

    // Check if our hash suffix is in the results
    for (const line of hashes) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        const leakCount = parseInt(count.trim(), 10);
        console.log(`Password found in ${leakCount} breaches`);
        return new Response(
          JSON.stringify({ isLeaked: true, count: leakCount }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Password not found in breaches');
    return new Response(
      JSON.stringify({ isLeaked: false, count: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-leaked-password function:', error);
    // Fail open for availability
    return new Response(
      JSON.stringify({ isLeaked: false, count: 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
