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

async function generateGeminiReplies(emailBody: string, subject: string, language: string = 'auto'): Promise<any[]> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  
  const prompt = `You are an expert conversational assistant. Your job is to generate natural, human-like email replies that match the tone, emotion, and intent of the sender's email. Avoid robotic phrases, avoid formal templates, avoid generic responses, avoid corporate language. Keep replies natural and context-aware. Always mirror the emotional tone of the sender.

Analyze this email VERY deeply. Understand the intent, tone, context, and emotional expression:

Subject: "${subject}"
Email Body: "${emailBody}"

Then create 3 completely different natural email replies that sound human and genuine.

STRICT RULES YOU MUST FOLLOW:
❌ NEVER use: "Thank you for your message", "I will respond shortly", "Got your email", "I appreciate", "I'll get back to you"
❌ NEVER be overly formal unless the email is clearly professional/corporate
❌ NEVER repeat the same reply structure or pattern
❌ NEVER use robotic or templated language
❌ NEVER apologize unless contextually appropriate
✅ DO sound like a real person writing naturally
✅ DO match the sender's tone (casual→casual, professional→professional, friendly→friendly)
✅ DO keep replies concise and to the point
✅ DO use natural language and proper email etiquette
✅ DO make each reply feel genuine and different

${language !== 'auto' ? `Reply in ${language} language.` : 'Reply in the same language as the email.'}

Return ONLY valid JSON in this format:
[
  {
    "tone": "casual/friendly/professional/etc",
    "text": "first natural email reply",
    "confidence": 0.9
  },
  {
    "tone": "same tone as detected",
    "text": "second completely different reply",
    "confidence": 0.85
  },
  {
    "tone": "same tone as detected",
    "text": "third unique reply with different angle",
    "confidence": 0.8
  }
]

Remember: Sound human, not robotic. Be natural and genuine, not templated.`;

   const response = await fetch(
     `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    }
  );

  const data = await response.json();
  console.log('Gemini API response:', JSON.stringify(data, null, 2));
  
  try {
    if (data.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
      console.error('Gemini response was truncated due to MAX_TOKENS');
      throw new Error('Email too long - response truncated');
    }
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const responseText = data.candidates[0].content.parts[0].text;
      console.log('Gemini response text:', responseText);
      
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const replies = JSON.parse(jsonMatch[0]);
        console.log('Parsed replies:', replies);
        return replies;
      }
    }
    
    console.warn('Could not extract valid JSON from Gemini response');
  } catch (e) {
    console.error('Error parsing Gemini response:', e);
  }
  
  throw new Error('Gemini generation failed: Could not extract valid JSON from response');
}

async function fetchUnreadEmails(accessToken: string) {
  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=10',
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  const data = await response.json();
  
  if (!data.messages) return [];

  const emails = await Promise.all(
    data.messages.slice(0, 5).map(async (msg: any) => {
      const msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      return await msgResponse.json();
    })
  );

  return emails.map(email => {
    const headers = email.payload.headers;
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
    const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
    const body = email.snippet || '';

    return {
      id: email.id,
      subject,
      from,
      body,
      timestamp: new Date(parseInt(email.internalDate))
    };
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching Gmail messages...');
    
    const GMAIL_REFRESH_TOKEN = Deno.env.get('GMAIL_REFRESH_TOKEN');
    if (!GMAIL_REFRESH_TOKEN) {
      throw new Error('Gmail refresh token not configured');
    }

    // Get fresh access token
    const accessToken = await refreshAccessToken(GMAIL_REFRESH_TOKEN);
    
    // Fetch unread emails
    const emails = await fetchUnreadEmails(accessToken);
    console.log(`Found ${emails.length} unread emails`);

    // Generate replies for each email
    const emailsWithReplies = await Promise.all(
      emails.map(async (email) => {
        const replies = await generateGeminiReplies(email.body, email.subject);
        return { ...email, replies };
      })
    );

    return new Response(
      JSON.stringify({ 
        success: true,
        emails: emailsWithReplies
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
