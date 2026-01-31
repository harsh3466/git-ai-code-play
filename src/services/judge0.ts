// Judge0 API Service for code compilation and execution
// API Documentation: https://ce.judge0.com/

const JUDGE0_API = 'https://judge0-ce.p.rapidapi.com';

// Language IDs for Judge0 API
export const JUDGE0_LANGUAGES: Record<string, number> = {
  python: 71,      // Python 3.8.1
  javascript: 63,  // JavaScript (Node.js 12.14.0)
  typescript: 74,  // TypeScript 3.7.4
  java: 62,        // Java (OpenJDK 13.0.1)
  cpp: 54,         // C++ (GCC 9.2.0)
  c: 50,           // C (GCC 9.2.0)
  go: 60,          // Go 1.13.5
  rust: 73,        // Rust 1.40.0
};

export interface SubmissionResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null;
  memory: number | null;
}

export interface SubmissionResponse {
  token: string;
}

// Create a submission
export const createSubmission = async (
  code: string,
  languageId: number,
  stdin: string = '',
  apiKey: string
): Promise<string> => {
  const response = await fetch(`${JUDGE0_API}/submissions?base64_encoded=true&wait=false`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
    },
    body: JSON.stringify({
      source_code: btoa(unescape(encodeURIComponent(code))),
      language_id: languageId,
      stdin: stdin ? btoa(unescape(encodeURIComponent(stdin))) : '',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create submission: ${error}`);
  }

  const data: SubmissionResponse = await response.json();
  return data.token;
};

// Get submission result
export const getSubmission = async (
  token: string,
  apiKey: string
): Promise<SubmissionResult> => {
  const response = await fetch(
    `${JUDGE0_API}/submissions/${token}?base64_encoded=true&fields=stdout,stderr,compile_output,message,status,time,memory`,
    {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get submission: ${error}`);
  }

  const data = await response.json();
  
  // Decode base64 outputs
  return {
    ...data,
    stdout: data.stdout ? decodeURIComponent(escape(atob(data.stdout))) : null,
    stderr: data.stderr ? decodeURIComponent(escape(atob(data.stderr))) : null,
    compile_output: data.compile_output ? decodeURIComponent(escape(atob(data.compile_output))) : null,
    message: data.message || null,
  };
};

// Poll for result with configurable timeout
export const waitForResult = async (
  token: string,
  apiKey: string,
  maxWaitTime: number = 60000, // 60 seconds default
  pollInterval: number = 1000
): Promise<SubmissionResult> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const result = await getSubmission(token, apiKey);
    
    // Status IDs: 1 = In Queue, 2 = Processing
    if (result.status.id !== 1 && result.status.id !== 2) {
      return result;
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error('Execution timed out');
};

// Combined function to compile and run code
export const compileAndRun = async (
  code: string,
  language: string,
  stdin: string = '',
  apiKey: string,
  maxWaitTime: number = 60000
): Promise<SubmissionResult> => {
  const languageId = JUDGE0_LANGUAGES[language];
  
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }
  
  const token = await createSubmission(code, languageId, stdin, apiKey);
  return waitForResult(token, apiKey, maxWaitTime);
};
