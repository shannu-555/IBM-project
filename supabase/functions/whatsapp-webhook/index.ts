import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TwilioMessage {
  From: string;
  Body: string;
  MessageSid: string;
  ProfileName?: string;
}

async function generateGeminiReplies(messageText: string, language: string = 'auto'): Promise<any[]> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  
  const prompt = `You are an expert conversational assistant. Your job is to generate natural, human-like replies that match the tone, emotion, and intent of the user's message. Avoid robotic phrases, avoid formal templates, avoid generic responses, avoid corporate language. Mimic how real people text. Keep replies short, casual, expressive when appropriate, and context-aware. Always mirror the emotional tone of the sender.

Analyze this message VERY deeply. Understand the intent, tone, context, and emotional expression:
"${messageText}"

Then create 3 completely different natural replies that sound like a human text message.

STRICT RULES YOU MUST FOLLOW:
❌ NEVER use: "Thank you for your message", "I will respond shortly", "Got your message", "I appreciate", "I'll get back to you"
❌ NEVER be formal unless the message is clearly formal/professional
❌ NEVER repeat the same reply structure or pattern
❌ NEVER use corporate or robotic language
❌ NEVER apologize unless contextually appropriate
✅ DO sound like a real person texting casually
✅ DO match the sender's emotional energy exactly
✅ DO keep replies SHORT (1-2 sentences maximum)
✅ DO use contractions and natural language
✅ DO add emojis ONLY if the message feels casual/friendly (NOT for formal messages)
✅ DO make each reply feel spontaneous and different

${language !== 'auto' ? `Reply in ${language} language.` : 'Reply in the same language as the message.'}

Return ONLY valid JSON in this format:
[
  {
    "tone": "casual/friendly/urgent/professional/etc",
    "text": "first natural conversational reply",
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

Remember: Sound human, not robotic. Be natural, not formal. Be conversational, not corporate.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
           responseSchema: {
             type: "array",
             minItems: 3,
             maxItems: 3,
             items: {
               type: "object",
               properties: {
                 tone: { type: "string" },
                 text: { type: "string" },
                 confidence: { type: "number" }
               },
               required: ["tone", "text", "confidence"],
             }
           }
        }
      })
    }
  );

  const data = await response.json();
  console.log('Gemini API response:', JSON.stringify(data, null, 2));
  
  try {
    if (data.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
      console.error('Gemini response was truncated due to MAX_TOKENS');
      throw new Error('Response too long - try a shorter message');
    }
    if ((data as any).promptFeedback?.blockReason) {
      console.error('Prompt blocked by safety:', (data as any).promptFeedback.blockReason);
      throw new Error(`Model blocked by safety: ${(data as any).promptFeedback.blockReason}`);
    }
    
    const parts = data.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts) && parts.length > 0) {
      const chunks: string[] = [];
      for (const p of parts) {
        if (typeof (p as any).text === 'string') chunks.push((p as any).text);
        const inline = (p as any).inlineData;
        if (inline?.data && (inline?.mimeType?.includes('json') || inline?.mimeType === 'application/json')) {
          try { chunks.push(atob(inline.data)); } catch {}
        }
      }
      let raw = chunks.join('').trim();
      raw = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          console.log('Parsed replies (direct):', parsed);
          return parsed;
        }
      } catch {}

      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('Parsed replies (substring):', parsed);
        return parsed;
      }
    }
    
    console.warn('Could not extract valid JSON from Gemini response');
  } catch (e) {
    console.error('Error parsing Gemini response:', e);
  }
  
  throw new Error('Gemini generation failed: Could not extract valid JSON from response');
}

async function sendTwilioMessage(to: string, body: string) {
  const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
  const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
  const TWILIO_WHATSAPP_NUMBER = Deno.env.get('TWILIO_WHATSAPP_NUMBER');

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  
  const params = new URLSearchParams({
    From: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
    To: to,
    Body: body
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params
  });

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received WhatsApp webhook request');
    
    // Get authorization header to identify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user from JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      throw new Error('Invalid authorization token');
    }
    
    const formData = await req.formData();
    const message: TwilioMessage = {
      From: formData.get('From') as string,
      Body: formData.get('Body') as string,
      MessageSid: formData.get('MessageSid') as string,
      ProfileName: formData.get('ProfileName') as string || undefined,
    };

    console.log('Incoming message:', message);

    // Store message in database
    const { data: storedMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        user_id: user.id,
        platform: 'whatsapp',
        sender: message.ProfileName || message.From,
        content: message.Body,
        message_id: message.MessageSid,
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error storing message:', messageError);
      throw messageError;
    }

    console.log('Message stored:', storedMessage);

    // Generate AI replies using Gemini
    const replies = await generateGeminiReplies(message.Body);
    console.log('Generated replies:', replies);

    // Store replies in database
    const repliesData = replies.map(reply => ({
      message_id: storedMessage.id,
      tone: reply.tone,
      content: reply.text,
      confidence: reply.confidence,
      is_sent: false,
    }));

    const { error: repliesError } = await supabase
      .from('replies')
      .insert(repliesData);

    if (repliesError) {
      console.error('Error storing replies:', repliesError);
      throw repliesError;
    }

    console.log('Replies stored successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Message received and processed',
        messageId: storedMessage.id
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
