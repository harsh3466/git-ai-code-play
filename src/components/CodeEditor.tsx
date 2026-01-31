import { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useEditorStore } from '@/stores/editorStore';
import { getLanguageById } from '@/lib/languages';
import { useTheme } from '@/hooks/useTheme';

export function CodeEditor() {
  const { tabs, activeTabId, updateTabContent, fontSize } = useEditorStore();
  const { theme } = useTheme();
  const editorRef = useRef<any>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const handleChange = (value: string | undefined) => {
    if (activeTabId && value !== undefined) {
      updateTabContent(activeTabId, value);
    }
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ fontSize });
    }
  }, [fontSize]);

  if (!activeTab) {
    return (
      <div className="h-full flex items-center justify-center bg-editor text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">No file open</p>
          <p className="text-sm">Select a file or create a new tab to start coding</p>
        </div>
      </div>
    );
  }

  const langConfig = getLanguageById(activeTab.language);

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={langConfig?.monacoLanguage || 'plaintext'}
        value={activeTab.content}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize,
          fontFamily: "'JetBrains Mono', monospace",
          minimap: { enabled: true, scale: 1 },
          lineNumbers: 'on',
          folding: true,
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          renderLineHighlight: 'all',
          bracketPairColorization: { enabled: true },
          tabSize: 2,
        }}
      />
    </div>
  );
}
