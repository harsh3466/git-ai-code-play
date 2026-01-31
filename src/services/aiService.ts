import { supabase } from '@/integrations/supabase/client';

export interface SpeechToCodeResult {
  transcript: string;
  code: string;
}

export interface CodeCompletionResult {
  completion: string;
}

export interface ErrorExplanation {
  explanation: string;
}

export interface VoiceCommandResult {
  code: string;
  matched: string | null;
}

export async function speechToCode(
  audioBlob: Blob,
  language: string
): Promise<SpeechToCodeResult> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('language', language);

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/speech-to-code`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to convert speech to code');
  }

  return response.json();
}

export async function getCodeCompletion(
  code: string,
  language: string,
  cursorPosition?: number
): Promise<CodeCompletionResult> {
  const { data, error } = await supabase.functions.invoke('code-completion', {
    body: { code, language, cursorPosition },
  });

  if (error) {
    throw new Error(error.message || 'Failed to get code completion');
  }

  return data;
}

export async function explainError(
  code: string,
  errorMessage: string,
  language: string,
  lineNumber?: number
): Promise<ErrorExplanation> {
  const { data, error } = await supabase.functions.invoke('explain-error', {
    body: { code, error: errorMessage, language, lineNumber },
  });

  if (error) {
    throw new Error(error.message || 'Failed to explain error');
  }

  return data;
}

export async function executeVoiceCommand(
  command: string,
  language: string
): Promise<VoiceCommandResult> {
  const { data, error } = await supabase.functions.invoke('voice-command', {
    body: { command, language },
  });

  if (error) {
    throw new Error(error.message || 'Failed to execute voice command');
  }

  return data;
}
