import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Common voice command templates
const COMMAND_TEMPLATES: Record<string, Record<string, string>> = {
  python: {
    'hello world': 'print("Hello, World!")',
    'for loop': 'for i in range(10):\n    print(i)',
    'while loop': 'i = 0\nwhile i < 10:\n    print(i)\n    i += 1',
    'function': 'def my_function():\n    pass',
    'class': 'class MyClass:\n    def __init__(self):\n        pass',
    'if statement': 'if condition:\n    pass',
    'try catch': 'try:\n    pass\nexcept Exception as e:\n    print(e)',
    'import': 'import ',
    'list': 'my_list = []',
    'dictionary': 'my_dict = {}',
  },
  javascript: {
    'hello world': 'console.log("Hello, World!");',
    'for loop': 'for (let i = 0; i < 10; i++) {\n    console.log(i);\n}',
    'while loop': 'let i = 0;\nwhile (i < 10) {\n    console.log(i);\n    i++;\n}',
    'function': 'function myFunction() {\n    \n}',
    'arrow function': 'const myFunction = () => {\n    \n};',
    'class': 'class MyClass {\n    constructor() {\n        \n    }\n}',
    'if statement': 'if (condition) {\n    \n}',
    'try catch': 'try {\n    \n} catch (error) {\n    console.error(error);\n}',
    'async function': 'async function myFunction() {\n    \n}',
    'array': 'const myArray = [];',
    'object': 'const myObject = {};',
  },
  typescript: {
    'hello world': 'console.log("Hello, World!");',
    'for loop': 'for (let i = 0; i < 10; i++) {\n    console.log(i);\n}',
    'function': 'function myFunction(): void {\n    \n}',
    'arrow function': 'const myFunction = (): void => {\n    \n};',
    'interface': 'interface MyInterface {\n    \n}',
    'type': 'type MyType = {\n    \n};',
    'class': 'class MyClass {\n    constructor() {\n        \n    }\n}',
    'async function': 'async function myFunction(): Promise<void> {\n    \n}',
  },
  java: {
    'hello world': 'System.out.println("Hello, World!");',
    'for loop': 'for (int i = 0; i < 10; i++) {\n    System.out.println(i);\n}',
    'while loop': 'int i = 0;\nwhile (i < 10) {\n    System.out.println(i);\n    i++;\n}',
    'function': 'public void myMethod() {\n    \n}',
    'class': 'public class MyClass {\n    \n}',
    'if statement': 'if (condition) {\n    \n}',
    'try catch': 'try {\n    \n} catch (Exception e) {\n    e.printStackTrace();\n}',
    'main method': 'public static void main(String[] args) {\n    \n}',
  },
  cpp: {
    'hello world': 'std::cout << "Hello, World!" << std::endl;',
    'for loop': 'for (int i = 0; i < 10; i++) {\n    std::cout << i << std::endl;\n}',
    'while loop': 'int i = 0;\nwhile (i < 10) {\n    std::cout << i << std::endl;\n    i++;\n}',
    'function': 'void myFunction() {\n    \n}',
    'class': 'class MyClass {\npublic:\n    \n};',
    'if statement': 'if (condition) {\n    \n}',
    'include': '#include <iostream>',
  },
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

    const { command, language } = await req.json();

    if (!command) {
      throw new Error('No command provided');
    }

    const normalizedCommand = command.toLowerCase().trim();
    const langTemplates = COMMAND_TEMPLATES[language] || COMMAND_TEMPLATES.python;
    
    // Check for exact or partial template match first
    for (const [key, template] of Object.entries(langTemplates)) {
      if (normalizedCommand.includes(key)) {
        return new Response(
          JSON.stringify({ code: template, matched: key }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // If no template match, use GPT to interpret the command
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
            content: `You are a voice command interpreter for a code editor. Convert natural language commands into ${language} code.

Examples:
- "create a function called add that takes two numbers" → function definition
- "make a loop from 1 to 10" → for loop
- "add a comment saying hello" → // hello

Output ONLY the code, no explanations. Keep it simple and practical.`
          },
          {
            role: 'user',
            content: command
          }
        ],
        max_tokens: 200,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to interpret command');
    }

    const data = await response.json();
    const code = data.choices[0]?.message?.content || '';

    return new Response(
      JSON.stringify({ code: code.trim(), matched: null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Voice command error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
