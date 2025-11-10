import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  
  const prompt = `Generate 3 context-aware replies for this WhatsApp message${language !== 'auto' ? ` in ${language}` : ''}.
Tone 1: Formal
Tone 2: Semi-formal  
Tone 3: Friendly

Message: ${messageText}

Respond with a JSON array of 3 replies, each with: tone, text, confidence (0-1).`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    }
  );

  const data = await response.json();
  console.log('Gemini API response:', data);
  
  try {
    const responseText = data.candidates[0].content.parts[0].text;
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Error parsing Gemini response:', e);
  }
  
  return [
    { tone: 'Formal', text: 'Thank you for your message. I will respond shortly.', confidence: 0.8 },
    { tone: 'Semi-formal', text: 'Thanks for reaching out! I\'ll get back to you soon.', confidence: 0.8 },
    { tone: 'Friendly', text: 'Hey! Got your message, will reply soon! 😊', confidence: 0.8 }
  ];
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
    
    const formData = await req.formData();
    const message: TwilioMessage = {
      From: formData.get('From') as string,
      Body: formData.get('Body') as string,
      MessageSid: formData.get('MessageSid') as string,
      ProfileName: formData.get('ProfileName') as string || undefined,
    };

    console.log('Incoming message:', message);

    // Generate AI replies using Gemini
    const replies = await generateGeminiReplies(message.Body);
    console.log('Generated replies:', replies);

    // For now, we'll store the message and replies in the response
    // In a full implementation, you'd store these in the database
    // and use real-time subscriptions to update the UI

    // Optionally auto-send the first reply (you can make this configurable)
    // await sendTwilioMessage(message.From, replies[0].text);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Message received and processed',
        incomingMessage: message,
        generatedReplies: replies
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
