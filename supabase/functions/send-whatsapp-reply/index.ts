import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, body } = await req.json();
    
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const TWILIO_WHATSAPP_NUMBER = Deno.env.get('TWILIO_WHATSAPP_NUMBER');

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
      throw new Error('Missing Twilio credentials');
    }

    // Basic server-side validation of inputs
    if (typeof body !== 'string' || !body.trim()) {
      throw new Error('Message body is required');
    }

    const sanitizeNumber = (value: string): string => {
      if (!value) throw new Error('Phone number is required');
      // Remove zero-width and bidi control characters that can sneak in from copy-paste
      const cleaned = value.replace(/[\u200B-\u200D\uFEFF\u202A-\u202E]/g, '').trim();
      return cleaned;
    };

    const rawTo = sanitizeNumber(to);
    const rawFrom = sanitizeNumber(TWILIO_WHATSAPP_NUMBER);

    // Ensure numbers have correct whatsapp: prefix
    const formattedTo = rawTo.startsWith('whatsapp:') ? rawTo : `whatsapp:${rawTo}`;
    const formattedFrom = rawFrom.startsWith('whatsapp:') ? rawFrom : `whatsapp:${rawFrom}`;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    
    const params = new URLSearchParams({
      From: formattedFrom,
      To: formattedTo,
      Body: body.trim()
    });

    console.log('Sending WhatsApp message via Twilio:', { from: formattedFrom, to: formattedTo });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params
    });

    const data = await response.json();
    console.log('Twilio response:', data);

    if (!response.ok) {
      console.error('Twilio API error:', data);
      throw new Error(data.message || 'Failed to send WhatsApp message');
    }

    return new Response(
      JSON.stringify({ success: true, data }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
