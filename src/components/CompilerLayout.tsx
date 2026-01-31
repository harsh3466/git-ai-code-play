import { useState, useEffect } from 'react';
import { Toolbar } from '@/components/Toolbar';
import { GitHubSidebar } from '@/components/GitHubSidebar';
import { AIChatPanel } from '@/components/AIChatPanel';
import { ConsolePanel } from '@/components/ConsolePanel';
import { CodeEditor } from '@/components/CodeEditor';
import { EditorTabs } from '@/components/EditorTabs';
import { useEditorStore } from '@/stores/editorStore';
import { cn } from '@/lib/utils';

export function CompilerLayout() {
  const { 
    leftSidebarOpen, 
    rightSidebarOpen,
    tabs,
    activeTabId,
    setActiveTab 
  } = useEditorStore();

  const [consoleHeight, setConsoleHeight] = useState(200);
  const [isResizing, setIsResizing] = useState(false);

  // Set initial active tab
  useEffect(() => {
    if (!activeTabId && tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
  }, [activeTabId, tabs, setActiveTab]);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const newHeight = window.innerHeight - e.clientY - 48; // 48px for toolbar
    setConsoleHeight(Math.max(100, Math.min(400, newHeight)));
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  const handleFileSelect = (path: string, content: string) => {
    console.log('File selected:', path, content);
    // In a real app, this would add the file to tabs
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Toolbar */}
      <Toolbar />

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

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor */}
          <div className="flex-1 flex flex-col min-h-0" style={{ height: `calc(100% - ${consoleHeight}px)` }}>
            <EditorTabs />
            <div className="flex-1 bg-editor">
              <CodeEditor />
            </div>
          </div>

          {/* Resize Handle */}
          <div
            className="h-1 bg-border hover:bg-primary/50 cursor-row-resize transition-colors"
            onMouseDown={handleMouseDown}
          />

          {/* Console */}
          <div style={{ height: consoleHeight }}>
            <ConsolePanel />
          </div>
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
