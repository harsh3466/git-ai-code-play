import { useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useTheme } from '@/hooks/useTheme';
import { Language } from '@/types/compiler';

// Map our language IDs to OneCompiler language IDs
const languageMap: Record<Language, string> = {
  python: 'python',
  javascript: 'javascript',
  typescript: 'typescript',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  go: 'go',
  rust: 'rust',
};

interface OneCompilerEmbedProps {
  language: Language;
  code?: string;
  onCodeChange?: (code: string, language: string) => void;
}

export function OneCompilerEmbed({ language, code, onCodeChange }: OneCompilerEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { theme } = useTheme();
  const { fontSize } = useEditorStore();

  const oneCompilerLang = languageMap[language] || 'python';
  
  // Build the embed URL with options
  const embedUrl = new URL(`https://onecompiler.com/embed/${oneCompilerLang}`);
  embedUrl.searchParams.set('theme', theme === 'dark' ? 'dark' : 'light');
  embedUrl.searchParams.set('fontSize', fontSize.toString());
  embedUrl.searchParams.set('hideTitle', 'true');
  embedUrl.searchParams.set('hideNewFileOption', 'true');
  embedUrl.searchParams.set('codeChangeEvent', 'true');
  embedUrl.searchParams.set('listenToEvents', 'true');

  // Handle code change events from OneCompiler
  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== 'https://onecompiler.com') return;
    
    if (event.data && event.data.language) {
      onCodeChange?.(event.data.files?.[0]?.content || '', event.data.language);
    }
  }, [onCodeChange]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  // Send code to iframe when it changes externally
  useEffect(() => {
    if (iframeRef.current && code) {
      // Wait for iframe to load before sending code
      const sendCode = () => {
        iframeRef.current?.contentWindow?.postMessage({
          eventType: 'populateCode',
          language: oneCompilerLang,
          files: [{ name: `main${getExtension(language)}`, content: code }]
        }, '*');
      };
      
      // Give iframe time to initialize
      const timer = setTimeout(sendCode, 1000);
      return () => clearTimeout(timer);
    }
  }, [code, oneCompilerLang, language]);

  return (
    <iframe
      ref={iframeRef}
      src={embedUrl.toString()}
      className="w-full h-full border-0"
      title="Code Editor"
      allow="clipboard-read; clipboard-write"
    />
  );
}

function getExtension(language: Language): string {
  const extensions: Record<Language, string> = {
    python: '.py',
    javascript: '.js',
    typescript: '.ts',
    java: '.java',
    cpp: '.cpp',
    c: '.c',
    go: '.go',
    rust: '.rs',
  };
  return extensions[language] || '.txt';
}

// Standalone full-page compiler for maximum simplicity
export function FullPageCompiler() {
  const { theme } = useTheme();
  const { fontSize, leftSidebarOpen, rightSidebarOpen, toggleLeftSidebar, toggleRightSidebar } = useEditorStore();
  
  const embedUrl = new URL('https://onecompiler.com/embed/');
  embedUrl.searchParams.set('theme', theme === 'dark' ? 'dark' : 'light');
  embedUrl.searchParams.set('fontSize', fontSize.toString());
  embedUrl.searchParams.set('availableLanguages', 'python,javascript,typescript,java,cpp,c,go,rust');

  return (
    <iframe
      src={embedUrl.toString()}
      className="w-full h-full border-0"
      title="OneCompiler Editor"
      allow="clipboard-read; clipboard-write"
    />
  );
}
