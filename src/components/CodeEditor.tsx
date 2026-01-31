import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useEditorStore } from '@/stores/editorStore';
import { getLanguageById } from '@/lib/languages';
import { useTheme } from '@/hooks/useTheme';
import { validateLineStrictly, ValidationResult } from '@/lib/codeValidator';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  onValidationError?: (error: ValidationResult) => void;
  codeStopperEnabled?: boolean;
}

export interface CodeEditorRef {
  insertTextAtCursor: (text: string) => void;
}

export const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(
  ({ onValidationError, codeStopperEnabled = true }, ref) => {
    const { tabs, activeTabId, updateTabContent, fontSize } = useEditorStore();
    const { theme } = useTheme();
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);
    const [validationError, setValidationError] = useState<ValidationResult | null>(null);
    const [showError, setShowError] = useState(false);

    const activeTab = tabs.find((t) => t.id === activeTabId);

    // Expose insertTextAtCursor to parent via ref
    useImperativeHandle(ref, () => ({
      insertTextAtCursor: (text: string) => {
        if (editorRef.current && monacoRef.current) {
          const position = editorRef.current.getPosition();
          if (position) {
            const range = new monacoRef.current.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column
            );
            
            editorRef.current.executeEdits('speech-to-text', [{
              range,
              text,
              forceMoveMarkers: true
            }]);
            editorRef.current.focus();
          }
        }
      }
    }), []);

    const handleEditorDidMount: OnMount = (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      editor.focus();

      // Code Stopper - Intercept Enter key
      if (codeStopperEnabled) {
        editor.onKeyDown((e: any) => {
          if (e.keyCode === monaco.KeyCode.Enter) {
            const position = editor.getPosition();
            const model = editor.getModel();
            
            if (position && model && activeTab) {
              const lineContent = model.getLineContent(position.lineNumber);
              const validation = validateLineStrictly(lineContent, activeTab.language);

              if (!validation.valid) {
                e.preventDefault();
                e.stopPropagation();
                setValidationError(validation);
                setShowError(true);
                onValidationError?.(validation);
                
                // Auto-hide error after 3 seconds
                setTimeout(() => setShowError(false), 3000);
              } else {
                setValidationError(null);
                setShowError(false);
              }
            }
          }
        });
      }
    };

    const handleChange = (value: string | undefined) => {
      if (activeTabId && value !== undefined) {
        updateTabContent(activeTabId, value);
      }
      // Clear error when user types
      if (showError) {
        setShowError(false);
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
      <div className="h-full w-full relative">
        {/* Validation Error Banner */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 z-10 transition-all duration-300',
            showError ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
          )}
        >
          <div className="mx-4 mt-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            <span className="text-sm text-destructive font-medium">
              {validationError?.message || 'Syntax error detected'}
            </span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="absolute top-2 right-4 z-10 flex items-center gap-2">
          {codeStopperEnabled && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-card/80 backdrop-blur text-xs">
              {showError ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  <span className="text-destructive">Syntax Error</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">Code Stopper Active</span>
                </>
              )}
            </div>
          )}
        </div>

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
          className={cn(
            'transition-all duration-200',
            showError && 'ring-2 ring-destructive/50 rounded-lg'
          )}
        />
      </div>
    );
  }
);

CodeEditor.displayName = 'CodeEditor';
