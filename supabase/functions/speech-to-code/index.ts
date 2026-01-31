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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string || 'python';
    
    if (!audioFile) {
      throw new Error('No audio file provided');
    }

    // Transcribe audio using OpenAI Whisper
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile);
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('response_format', 'text');
    whisperFormData.append('prompt', `Programming code in ${language}. Variables, functions, loops, classes.`);

    const transcribeResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: whisperFormData,
    });

    if (!transcribeResponse.ok) {
      const error = await transcribeResponse.text();
      console.error('Whisper error:', error);
      throw new Error('Failed to transcribe audio');
    }

    const transcript = await transcribeResponse.text();

    // Convert spoken words to code using GPT
    const codeResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are a code translator. Convert spoken instructions to ${language} code.
            
Rules:
- Output ONLY the code, no explanations
- Handle programming terms: "print" → print(), "for loop" → for statement, etc.
- Interpret "variable X equals Y" → appropriate assignment
- "function named X" → function definition
- Keep it syntactically correct for ${language}
- If unclear, output what makes most sense as code`
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!codeResponse.ok) {
      const error = await codeResponse.text();
      console.error('GPT error:', error);
      throw new Error('Failed to generate code');
    }

    const codeData = await codeResponse.json();
    const generatedCode = codeData.choices[0]?.message?.content || transcript;

    return new Response(
      JSON.stringify({ 
        transcript, 
        code: generatedCode.trim() 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Speech-to-code error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
