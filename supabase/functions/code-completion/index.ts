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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { code, language, cursorPosition } = await req.json();

    if (!code) {
      throw new Error('No code provided');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a code completion assistant for ${language}. 
            
Given the code context, suggest the most likely completion.

Rules:
- Output ONLY the completion text (what comes next)
- Keep suggestions short (1-2 lines max)
- Match the coding style and indentation
- Be contextually relevant
- No explanations, just the code completion`
          },
          {
            role: 'user',
            content: `Complete this ${language} code:\n\n${code}\n\n[CURSOR HERE]`
          }
        ],
        max_tokens: 100,
        temperature: 0.2,
        stop: ['\n\n', '```'],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI error:', error);
      throw new Error('Failed to get completion');
    }

    const data = await response.json();
    const completion = data.choices[0]?.message?.content || '';

    return new Response(
      JSON.stringify({ completion: completion.trim() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Code completion error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
