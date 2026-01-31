import { useState, useRef, useEffect } from 'react';
import { 
  PanelLeftClose, 
  PanelLeft, 
  PanelRightClose, 
  PanelRight,
  Moon,
  Sun,
  Play,
  Square,
  Settings,
  ZoomIn,
  ZoomOut,
  Mic,
  MicOff,
  Shield,
  ShieldOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { GitHubSidebar } from '@/components/GitHubSidebar';
import { AIChatPanel } from '@/components/AIChatPanel';
import { CodeEditor, CodeEditorRef } from '@/components/CodeEditor';
import { ConsolePanel } from '@/components/ConsolePanel';
import { useEditorStore } from '@/stores/editorStore';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { languages, getLanguageById } from '@/lib/languages';
import { Language } from '@/types/compiler';
import { compileAndRun, JUDGE0_LANGUAGES } from '@/services/judge0';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { speechToCode, executeVoiceCommand } from '@/services/aiService';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

export function CompilerLayout() {
  const { 
    leftSidebarOpen, 
    rightSidebarOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
    fontSize,
    setFontSize,
    tabs,
    activeTabId,
    addTab,
    setActiveTab,
    updateTabContent,
    isRunning,
    setIsRunning,
    addConsoleOutput,
    clearConsole,
  } = useEditorStore();
  
  const { theme, toggleTheme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('python');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('judge0_api_key') || '');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stdinInput, setStdinInput] = useState('');
  const [codeStopperEnabled, setCodeStopperEnabled] = useState(true);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
  
  const editorRef = useRef<CodeEditorRef>(null);
  const { isRecording, audioBlob, startRecording, stopRecording, resetRecording, error: recordingError } = useAudioRecorder();

  const activeTab = tabs.find(t => t.id === activeTabId);

  const handleLanguageChange = (lang: Language) => {
    setSelectedLanguage(lang);
    // Create a new tab with the selected language if no tabs exist
    const existingTab = tabs.find(t => t.language === lang);
    if (existingTab) {
      setActiveTab(existingTab.id);
    } else {
      addTab(lang);
    }
  };

  const handleFileSelect = (path: string, content: string) => {
    console.log('File selected:', path, content);
    const ext = path.split('.').pop();
    const langMap: Record<string, Language> = {
      py: 'python',
      js: 'javascript',
      ts: 'typescript',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      go: 'go',
      rs: 'rust',
    };
    if (ext && langMap[ext]) {
      handleLanguageChange(langMap[ext]);
      if (activeTabId) {
        updateTabContent(activeTabId, content);
      }
    }
  };

  const handleRun = async () => {
    if (isRunning || !activeTab) return;
    
    if (!apiKey) {
      setSettingsOpen(true);
      addConsoleOutput({ type: 'warning', content: '⚠️ Please set your RapidAPI key in settings' });
      return;
    }

    clearConsole();
    setIsRunning(true);
    addConsoleOutput({ type: 'info', content: `🚀 Running ${activeTab.name}...` });

    try {
      const result = await compileAndRun(
        activeTab.content,
        activeTab.language,
        stdinInput,
        apiKey,
        120000 // 2 minute timeout
      );

      // Handle compilation errors
      if (result.compile_output) {
        addConsoleOutput({ type: 'stderr', content: result.compile_output });
      }

      // Handle runtime output
      if (result.stdout) {
        addConsoleOutput({ type: 'stdout', content: result.stdout });
      }

      // Handle runtime errors
      if (result.stderr) {
        addConsoleOutput({ type: 'stderr', content: result.stderr });
      }

      // Handle status message
      if (result.message) {
        addConsoleOutput({ type: 'warning', content: result.message });
      }

      // Show execution metrics
      const status = result.status.description;
      const time = result.time ? `${result.time}s` : 'N/A';
      const memory = result.memory ? `${(result.memory / 1024).toFixed(2)} MB` : 'N/A';
      
      if (result.status.id === 3) {
        addConsoleOutput({ 
          type: 'success', 
          content: `\n✓ ${status} | Time: ${time} | Memory: ${memory}` 
        });
      } else {
        addConsoleOutput({ 
          type: 'warning', 
          content: `\n⚠ ${status} | Time: ${time} | Memory: ${memory}` 
        });
      }
    } catch (error) {
      addConsoleOutput({ 
        type: 'stderr', 
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    addConsoleOutput({ type: 'warning', content: '⚠️ Execution stopped by user' });
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('judge0_api_key', key);
  };

  // Handle audio recording for AI speech-to-code
  useEffect(() => {
    const processAudio = async () => {
      if (audioBlob && !isProcessingSpeech && activeTab) {
        setIsProcessingSpeech(true);
        try {
          const result = await speechToCode(audioBlob, activeTab.language);
          if (result.code && editorRef.current) {
            editorRef.current.insertTextAtCursor(result.code);
            toast.success('Code generated from speech!');
            addConsoleOutput({ 
              type: 'info', 
              content: `🎤 Heard: "${result.transcript}"\n📝 Generated code inserted` 
            });
          }
        } catch (error) {
          console.error('Speech to code error:', error);
          toast.error('Failed to convert speech to code');
        } finally {
          setIsProcessingSpeech(false);
          resetRecording();
        }
      }
    };
    processAudio();
  }, [audioBlob, activeTab, addConsoleOutput, isProcessingSpeech, resetRecording]);

  const toggleSpeechToCode = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
      toast.info('🎤 Listening... Speak your code command');
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border">
        {/* Left Section */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLeftSidebar}
            title={leftSidebarOpen ? 'Hide GitHub sidebar' : 'Show GitHub sidebar'}
          >
            {leftSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>

          {/* Logo */}
          <div className="flex items-center gap-2 px-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">C</span>
            </div>
            <span className="font-semibold text-sm hidden sm:block">CodeCompiler</span>
          </div>

          {/* Language Quick Select */}
          <div className="hidden md:flex items-center gap-1 ml-4">
            {languages.map((lang) => (
              <Button
                key={lang.id}
                variant={selectedLanguage === lang.id ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleLanguageChange(lang.id)}
                title={lang.name}
              >
                <span className="mr-1">{lang.icon}</span>
                <span className="hidden lg:inline">{lang.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Center - Run Button */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleRun}
            disabled={isRunning || !activeTab}
            className={isRunning ? 'animate-pulse' : ''}
          >
            <Play className={`h-4 w-4 mr-1 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running...' : 'Run'}
          </Button>
          {isRunning && (
            <Button size="sm" variant="destructive" onClick={handleStop}>
              <Square className="h-4 w-4 mr-1" />
              Stop
            </Button>
          )}

          {/* AI Speech to Code */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={isRecording || isProcessingSpeech ? 'destructive' : 'outline'}
                  onClick={toggleSpeechToCode}
                  disabled={isProcessingSpeech}
                  className={isRecording ? 'animate-pulse' : ''}
                >
                  {isRecording ? <MicOff className="h-4 w-4 mr-1" /> : <Mic className="h-4 w-4 mr-1" />}
                  {isProcessingSpeech ? 'Processing...' : isRecording ? 'Stop' : 'Voice AI'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to speak code commands - AI will convert to code</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Code Stopper Toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={codeStopperEnabled ? 'secondary' : 'outline'}
                  onClick={() => setCodeStopperEnabled(!codeStopperEnabled)}
                >
                  {codeStopperEnabled ? <Shield className="h-4 w-4 mr-1" /> : <ShieldOff className="h-4 w-4 mr-1" />}
                  Stopper
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{codeStopperEnabled ? 'Code Stopper is ON - validates syntax on Enter' : 'Code Stopper is OFF - no validation'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1">
          {/* Font Size */}
          <div className="flex items-center gap-1 mr-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setFontSize(Math.max(10, fontSize - 2))}
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <span className="text-xs text-muted-foreground w-6 text-center">{fontSize}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setFontSize(Math.min(24, fontSize + 2))}
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>

          {/* Settings Dialog */}
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" title="Settings">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Compiler Settings</DialogTitle>
                <DialogDescription>
                  Configure your Judge0 API key from RapidAPI
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">RapidAPI Key</label>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => saveApiKey(e.target.value)}
                    placeholder="Enter your RapidAPI key..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your free API key from{' '}
                    <a 
                      href="https://rapidapi.com/judge0-official/api/judge0-ce" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      RapidAPI Judge0
                    </a>
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Standard Input (stdin)</label>
                  <Input
                    value={stdinInput}
                    onChange={(e) => setStdinInput(e.target.value)}
                    placeholder="Enter input for your program..."
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRightSidebar}
            title={rightSidebarOpen ? 'Hide AI panel' : 'Show AI panel'}
          >
            {rightSidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - GitHub */}
        <div
          className={cn(
            'border-r border-border bg-sidebar transition-all duration-300 overflow-hidden',
            leftSidebarOpen ? 'w-64' : 'w-0'
          )}
        >
          {leftSidebarOpen && <GitHubSidebar onFileSelect={handleFileSelect} />}
        </div>

        {/* Main Editor + Console */}
        <div className="flex-1 flex flex-col min-w-0">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70} minSize={30}>
              <CodeEditor 
                ref={editorRef}
                codeStopperEnabled={codeStopperEnabled}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={15}>
              <ConsolePanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Right Sidebar - AI Chat */}
        <div
          className={cn(
            'border-l border-border bg-sidebar transition-all duration-300 overflow-hidden',
            rightSidebarOpen ? 'w-80' : 'w-0'
          )}
        >
          {rightSidebarOpen && <AIChatPanel />}
        </div>
      </div>
    </div>
  );
}
