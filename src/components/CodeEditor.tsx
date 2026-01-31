import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useEditorStore } from '@/stores/editorStore';
import { getLanguageById } from '@/lib/languages';
import { useTheme } from '@/hooks/useTheme';
import { validateLineStrictly, ValidationResult } from '@/lib/codeValidator';
import { explainError, getCodeCompletion } from '@/services/aiService';
import { AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CodeEditorProps {
  onValidationError?: (error: ValidationResult) => void;
  codeStopperEnabled?: boolean;
}

export interface CodeEditorRef {
  insertTextAtCursor: (text: string) => void;
  getCode: () => string;
}

function CodeEditorComponent(
  { onValidationError, codeStopperEnabled = true }: CodeEditorProps,
  ref: React.ForwardedRef<CodeEditorRef>
) {
  const { tabs, activeTabId, updateTabContent, fontSize } = useEditorStore();
  const { theme } = useTheme();
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const [validationError, setValidationError] = useState<ValidationResult | null>(null);
  const [showError, setShowError] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [completion, setCompletion] = useState<string | null>(null);
  const [isLoadingCompletion, setIsLoadingCompletion] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Expose methods to parent via ref
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
    },
    getCode: () => {
      return editorRef.current?.getValue() || '';
    }
  }), []);

  const handleGetAIExplanation = useCallback(async () => {
    if (!validationError?.message || !activeTab) return;
    
    setIsExplaining(true);
    setAiExplanation(null);
    
    try {
      const currentLine = editorRef.current?.getPosition()?.lineNumber;
      const lineContent = editorRef.current?.getModel()?.getLineContent(currentLine) || '';
      
      const result = await explainError(
        lineContent,
        validationError.message,
        activeTab.language,
        currentLine
      );
      setAiExplanation(result.explanation);
    } catch (error) {
      console.error('Failed to get AI explanation:', error);
      setAiExplanation('Failed to get AI explanation. Please try again.');
    } finally {
      setIsExplaining(false);
    }
  }, [validationError, activeTab]);

  const handleGetCompletion = useCallback(async () => {
    if (!activeTab || !editorRef.current) return;
    
    setIsLoadingCompletion(true);
    setCompletion(null);
    
    try {
      const code = editorRef.current.getValue();
      const result = await getCodeCompletion(code, activeTab.language);
      setCompletion(result.completion);
    } catch (error) {
      console.error('Failed to get completion:', error);
    } finally {
      setIsLoadingCompletion(false);
    }
  }, [activeTab]);

  const acceptCompletion = useCallback(() => {
    if (completion && editorRef.current && monacoRef.current) {
      const position = editorRef.current.getPosition();
      const range = new monacoRef.current.Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column
      );
      
      editorRef.current.executeEdits('completion', [{
        range,
        text: completion,
        forceMoveMarkers: true
      }]);
      setCompletion(null);
      editorRef.current.focus();
    }
  }, [completion]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.focus();

    // Code Stopper - Intercept Enter key only if enabled
    editor.onKeyDown((e: any) => {
      // Tab to accept completion
      if (e.keyCode === monaco.KeyCode.Tab && completion) {
        e.preventDefault();
        acceptCompletion();
        return;
      }
      
      // Escape to dismiss completion
      if (e.keyCode === monaco.KeyCode.Escape && completion) {
        setCompletion(null);
        return;
      }
      
      if (codeStopperEnabled && e.keyCode === monaco.KeyCode.Enter) {
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
            setAiExplanation(null);
            onValidationError?.(validation);
          } else {
            setValidationError(null);
            setShowError(false);
            setAiExplanation(null);
          }
        }
      }
    });

    // Add keyboard shortcut for completion (Ctrl+Space)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      handleGetCompletion();
    });
  };

  const handleChange = (value: string | undefined) => {
    if (activeTabId && value !== undefined) {
      updateTabContent(activeTabId, value);
    }
    // Clear error and completion when user types
    if (showError) {
      setShowError(false);
    }
    if (completion) {
      setCompletion(null);
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
        <div className="mx-4 mt-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            <span className="text-sm text-destructive font-medium flex-1">
              {validationError?.message || 'Syntax error detected'}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={handleGetAIExplanation}
              disabled={isExplaining}
            >
              {isExplaining ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              Explain with AI
            </Button>
          </div>
          
          {/* AI Explanation */}
          {(aiExplanation || isExplaining) && (
            <div className="mt-2 p-2 bg-card/50 rounded border border-border text-sm">
              {isExplaining ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Getting AI explanation...
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {aiExplanation}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Completion Popup */}
      {completion && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 max-w-lg">
          <div className="bg-card border border-border rounded-lg shadow-lg p-3">
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              AI Suggestion (Tab to accept, Esc to dismiss)
            </div>
            <pre className="text-sm bg-muted/50 p-2 rounded overflow-x-auto">
              <code>{completion}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      {codeStopperEnabled && (
        <div className="absolute top-2 right-4 z-10 flex items-center gap-2">
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
        </div>
      )}

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

export const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(CodeEditorComponent);
CodeEditor.displayName = 'CodeEditor';
