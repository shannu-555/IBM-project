import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const GMAIL_CLIENT_ID = Deno.env.get('GMAIL_CLIENT_ID');
  const GMAIL_CLIENT_SECRET = Deno.env.get('GMAIL_CLIENT_SECRET');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID!,
      client_secret: GMAIL_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { threadId, messageId, replyText } = await req.json();
    
    // Input validation
    if (!threadId || typeof threadId !== 'string' || threadId.trim().length === 0) {
      throw new Error('Valid thread ID is required');
    }
    if (!replyText || typeof replyText !== 'string' || replyText.trim().length === 0) {
      throw new Error('Reply text is required');
    }
    if (replyText.length > 50000) {
      throw new Error('Reply text exceeds maximum length of 50000 characters');
    }
    
    // Sanitize reply text - remove potential email header injection attempts
    const sanitizedReplyText = replyText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();
    
    console.log('Validated inputs - threadId:', threadId, 'replyText length:', sanitizedReplyText.length);
    
    const GMAIL_REFRESH_TOKEN = Deno.env.get('GMAIL_REFRESH_TOKEN');
    if (!GMAIL_REFRESH_TOKEN) {
      throw new Error('Gmail refresh token not configured');
    }

    const accessToken = await refreshAccessToken(GMAIL_REFRESH_TOKEN);

    // Create email message in RFC 2822 format
    const messageParts = [
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      sanitizedReplyText
    ];
    const message = messageParts.join('\n');
    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    console.log('Sending Gmail reply to thread:', threadId);

    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedMessage,
          threadId: threadId
        })
      }
    );

    const data = await response.json();
    console.log('Gmail send response:', data);

    return new Response(
      JSON.stringify({ success: true, data }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error sending Gmail reply:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
