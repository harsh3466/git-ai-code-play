import { useState } from 'react';
import { 
  PanelLeftClose, 
  PanelLeft, 
  PanelRightClose, 
  PanelRight,
  Moon,
  Sun,
  Sparkles,
  Github,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GitHubSidebar } from '@/components/GitHubSidebar';
import { AIChatPanel } from '@/components/AIChatPanel';
import { useEditorStore } from '@/stores/editorStore';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { languages } from '@/lib/languages';
import { Language } from '@/types/compiler';

export function CompilerLayout() {
  const { 
    leftSidebarOpen, 
    rightSidebarOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
    fontSize,
  } = useEditorStore();
  
  const { theme, toggleTheme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('python');

  // Build OneCompiler embed URL
  const buildEmbedUrl = () => {
    const url = new URL(`https://onecompiler.com/embed/${selectedLanguage}`);
    url.searchParams.set('theme', theme === 'dark' ? 'dark' : 'light');
    url.searchParams.set('fontSize', fontSize.toString());
    url.searchParams.set('hideTitle', 'true');
    url.searchParams.set('availableLanguages', 'python,javascript,typescript,java,cpp,c,go,rust');
    return url.toString();
  };

  const handleFileSelect = (path: string, content: string) => {
    console.log('File selected:', path, content);
    // Detect language from extension
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
      setSelectedLanguage(langMap[ext]);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Minimal Toolbar */}
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
                onClick={() => setSelectedLanguage(lang.id)}
                title={lang.name}
              >
                <span className="mr-1">{lang.icon}</span>
                <span className="hidden lg:inline">{lang.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Center - Powered by */}
        <a 
          href="https://onecompiler.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Powered by OneCompiler
          <ExternalLink className="h-3 w-3" />
        </a>

        {/* Right Section */}
        <div className="flex items-center gap-1">
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

        {/* Main Editor - OneCompiler Embed */}
        <div className="flex-1 flex flex-col min-w-0">
          <iframe
            key={`${selectedLanguage}-${theme}-${fontSize}`}
            src={buildEmbedUrl()}
            className="w-full h-full border-0"
            title="OneCompiler Editor"
            allow="clipboard-read; clipboard-write"
          />
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
