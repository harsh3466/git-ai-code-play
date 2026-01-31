import { Language } from '@/types/compiler';

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export function validateLineStrictly(line: string, lang: Language): ValidationResult {
  const trimmed = line.trim();
  
  // Allow empty lines
  if (trimmed === '') return { valid: true };

  // Allow single-line comments
  if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
    return { valid: true };
  }

  switch (lang) {
    case 'java':
      return validateJava(trimmed);
    case 'python':
      return validatePython(trimmed);
    case 'javascript':
    case 'typescript':
      return validateJavaScript(trimmed);
    case 'cpp':
    case 'c':
      return validateCpp(trimmed);
    case 'go':
      return validateGo(trimmed);
    case 'rust':
      return validateRust(trimmed);
    default:
      return { valid: true };
  }
}

function validateJava(line: string): ValidationResult {
  // Check for missing curly brace on Class/Method definitions
  if ((line.includes('class ') || line.includes('void ') || line.includes('public ') || line.includes('private ') || line.includes('protected ')) 
      && !line.endsWith('{') && !line.endsWith(';') && !line.endsWith('}')) {
    return { valid: false, message: "Java structures must end with '{' or a semicolon ';'" };
  }
  
  // Check for unbalanced parentheses
  const openParens = (line.match(/\(/g) || []).length;
  const closeParens = (line.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    return { valid: false, message: "Unbalanced parentheses '()'. Close your arguments." };
  }
  
  // Check for missing semicolon on standard lines
  if (!line.endsWith('{') && !line.endsWith('}') && !line.endsWith(';') && !line.startsWith('//') && !line.startsWith('@')) {
    // Allow import, package statements in progress
    if (!line.startsWith('import') && !line.startsWith('package')) {
      return { valid: false, message: "Missing semicolon ';' at the end of the statement." };
    }
  }
  
  return { valid: true };
}

function validatePython(line: string): ValidationResult {
  // Python blocks must end with a colon
  const blockKeywords = ['def', 'if', 'else', 'elif', 'for', 'while', 'class', 'with', 'try', 'except', 'finally', 'async', 'match', 'case'];
  const firstWord = line.split(/\s+/)[0];
  
  if (blockKeywords.includes(firstWord) && !line.endsWith(':')) {
    return { valid: false, message: `Python '${firstWord}' blocks must end with a colon ':'` };
  }
  
  // Check for unclosed quotes
  const singleQuotes = (line.match(/'/g) || []).length;
  const doubleQuotes = (line.match(/"/g) || []).length;
  
  // Rough check - doesn't account for escaped quotes or triple quotes
  if (singleQuotes % 2 !== 0 && !line.includes("'''")) {
    return { valid: false, message: "Unclosed single quote detected." };
  }
  if (doubleQuotes % 2 !== 0 && !line.includes('"""')) {
    return { valid: false, message: "Unclosed double quote detected." };
  }
  
  return { valid: true };
}

function validateJavaScript(line: string): ValidationResult {
  // Check for unclosed brackets on function/control statements
  const blockKeywords = ['function', 'if', 'else', 'for', 'while', 'switch', 'try', 'catch'];
  const hasBlockKeyword = blockKeywords.some(kw => line.includes(kw));
  
  if (hasBlockKeyword && line.includes('(') && !line.endsWith('{') && !line.endsWith('}') && !line.endsWith(';')) {
    // Check if parentheses are balanced
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    if (openParens === closeParens && !line.endsWith('{')) {
      return { valid: false, message: "JS block statement missing opening brace '{'" };
    }
  }
  
  // Arrow function check
  if (line.includes('=>') && !line.endsWith('{') && !line.endsWith(';') && !line.endsWith(',') && !line.endsWith(')')) {
    return { valid: false, message: "Arrow function needs a body or expression." };
  }
  
  return { valid: true };
}

function validateCpp(line: string): ValidationResult {
  // Similar to Java - check for semicolons and braces
  if ((line.includes('class ') || line.includes('void ') || line.includes('int ') || line.includes('struct ')) 
      && line.includes('(') && !line.endsWith('{') && !line.endsWith(';') && !line.endsWith('}')) {
    return { valid: false, message: "C/C++ function/class definitions must end with '{' or ';'" };
  }
  
  // Check for unbalanced parentheses
  const openParens = (line.match(/\(/g) || []).length;
  const closeParens = (line.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    return { valid: false, message: "Unbalanced parentheses." };
  }
  
  return { valid: true };
}

function validateGo(line: string): ValidationResult {
  // Go function declarations must end with {
  if ((line.startsWith('func ') || line.includes(' func ')) && line.includes('(') && !line.endsWith('{')) {
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    if (openParens === closeParens) {
      return { valid: false, message: "Go function declarations must end with '{'" };
    }
  }
  
  // Go if/for statements
  if ((line.startsWith('if ') || line.startsWith('for ') || line.startsWith('switch ')) && !line.endsWith('{')) {
    return { valid: false, message: "Go control statements must end with '{'" };
  }
  
  return { valid: true };
}

function validateRust(line: string): ValidationResult {
  // Rust function declarations must end with {
  if (line.startsWith('fn ') && line.includes('(') && !line.endsWith('{')) {
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    if (openParens === closeParens) {
      return { valid: false, message: "Rust function declarations must end with '{'" };
    }
  }
  
  // Check for missing semicolon on let statements
  if (line.startsWith('let ') && !line.endsWith(';') && !line.endsWith('{')) {
    return { valid: false, message: "Rust let statements must end with ';'" };
  }
  
  return { valid: true };
}
