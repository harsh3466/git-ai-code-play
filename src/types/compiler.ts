export type Language = 'python' | 'javascript' | 'typescript' | 'java' | 'cpp' | 'c';

export interface LanguageConfig {
  id: Language;
  name: string;
  extension: string;
  monacoLanguage: string;
  icon: string;
  defaultCode: string;
}

export interface FileTab {
  id: string;
  name: string;
  language: Language;
  content: string;
  isModified: boolean;
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  isPrivate: boolean;
  defaultBranch: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: GitHubFile[];
}

export interface CompileResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime?: number;
  memoryUsage?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ConsoleOutput {
  id: string;
  type: 'stdout' | 'stderr' | 'info' | 'success' | 'warning';
  content: string;
  timestamp: Date;
}
