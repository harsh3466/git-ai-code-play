import { useState } from 'react';
import {
  Play,
  Plus,
  Moon,
  Sun,
  Download,
  AlignLeft,
  Keyboard,
  PanelLeftClose,
  PanelRightClose,
  PanelLeft,
  PanelRight,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useEditorStore } from '@/stores/editorStore';
import { useTheme } from '@/hooks/useTheme';
import { languages, getLanguageById } from '@/lib/languages';
import { Language } from '@/types/compiler';

const shortcuts = [
  { key: 'Ctrl/Cmd + Enter', action: 'Run Code' },
  { key: 'Ctrl/Cmd + S', action: 'Save File' },
  { key: 'Ctrl/Cmd + Shift + F', action: 'Format Code' },
  { key: 'Ctrl/Cmd + P', action: 'Quick Open' },
  { key: 'Ctrl/Cmd + /', action: 'Toggle Comment' },
  { key: 'Ctrl/Cmd + D', action: 'Duplicate Line' },
  { key: 'Alt + Up/Down', action: 'Move Line' },
  { key: 'Ctrl/Cmd + Shift + K', action: 'Delete Line' },
];

export function Toolbar() {
  const {
    tabs,
    activeTabId,
    addTab,
    leftSidebarOpen,
    rightSidebarOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
    isRunning,
    setIsRunning,
    addConsoleOutput,
    clearConsole,
    fontSize,
    setFontSize,
  } = useEditorStore();
  
  const { theme, toggleTheme } = useTheme();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeLang = activeTab ? getLanguageById(activeTab.language) : null;

  const handleRun = () => {
    if (isRunning) return;
    
    clearConsole();
    setIsRunning(true);
    addConsoleOutput({ type: 'info', content: `🚀 Running ${activeTab?.name || 'code'}...` });

    // Simulate execution
    setTimeout(() => {
      addConsoleOutput({ type: 'stdout', content: 'Hello, World!' });
      addConsoleOutput({ type: 'success', content: '\n✓ Execution completed successfully' });
      setIsRunning(false);
    }, 1500);
  };

  const handleNewFile = (language: Language) => {
    addTab(language);
  };

  const handleExport = () => {
    if (!activeTab) return;
    const blob = new Blob([activeTab.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFormat = () => {
    addConsoleOutput({ type: 'info', content: '✨ Code formatted' });
  };

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border">
      {/* Left Section */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLeftSidebar}
          title={leftSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
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

        {/* New File Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Select Language</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {languages.map((lang) => (
              <DropdownMenuItem key={lang.id} onClick={() => handleNewFile(lang.id)}>
                <span className="mr-2">{lang.icon}</span>
                {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Center Section - Run Button */}
      <div className="flex items-center gap-2">
        {activeLang && (
          <span className="text-xs text-muted-foreground hidden sm:block">
            {activeLang.icon} {activeLang.name}
          </span>
        )}
        <Button
          size="sm"
          onClick={handleRun}
          disabled={isRunning || !activeTab}
          className={isRunning ? 'animate-pulse-glow' : ''}
        >
          <Play className={`h-4 w-4 mr-1 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Running...' : 'Run'}
        </Button>
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

        <Button variant="ghost" size="icon" onClick={handleFormat} title="Format Code">
          <AlignLeft className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" onClick={handleExport} disabled={!activeTab} title="Export">
          <Download className="h-4 w-4" />
        </Button>

        <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" title="Keyboard Shortcuts">
              <Keyboard className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Keyboard Shortcuts</DialogTitle>
              <DialogDescription>Useful shortcuts for efficient coding</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 pt-4">
              {shortcuts.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm">{shortcut.action}</span>
                  <kbd className="px-2 py-1 rounded bg-secondary text-xs font-mono">{shortcut.key}</kbd>
                </div>
              ))}
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
  );
}
