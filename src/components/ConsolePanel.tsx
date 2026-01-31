import { useState } from 'react';
import { Play, Square, Trash2, Clock, HardDrive, Terminal, AlertTriangle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEditorStore } from '@/stores/editorStore';
import { cn } from '@/lib/utils';

type ConsoleTab = 'output' | 'errors' | 'metrics';

export function ConsolePanel() {
  const { consoleOutputs, isRunning, clearConsole, setIsRunning, addConsoleOutput } = useEditorStore();
  const [activeTab, setActiveTab] = useState<ConsoleTab>('output');
  const [stdinInput, setStdinInput] = useState('');

  const outputs = consoleOutputs.filter((o) => o.type === 'stdout' || o.type === 'info' || o.type === 'success');
  const errors = consoleOutputs.filter((o) => o.type === 'stderr' || o.type === 'warning');

  const handleStop = () => {
    setIsRunning(false);
    addConsoleOutput({ type: 'warning', content: '⚠️ Execution stopped by user' });
  };

  const handleStdinSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && stdinInput.trim()) {
      addConsoleOutput({ type: 'info', content: `> ${stdinInput}` });
      setStdinInput('');
    }
  };

  const tabs: { id: ConsoleTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'output', label: 'Output', icon: <Terminal className="h-3 w-3" />, count: outputs.length },
    { id: 'errors', label: 'Errors', icon: <AlertTriangle className="h-3 w-3" />, count: errors.length },
    { id: 'metrics', label: 'Metrics', icon: <BarChart3 className="h-3 w-3" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-panel border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-border">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={cn('tab-button flex items-center gap-1.5', activeTab === tab.id && 'active')}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  'px-1.5 py-0.5 text-xs rounded-full',
                  tab.id === 'errors' ? 'bg-error/20 text-error' : 'bg-muted text-muted-foreground'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {isRunning && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleStop}>
              <Square className="h-3 w-3 text-error" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearConsole}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'output' && (
          <ScrollArea className="flex-1 p-3">
            {outputs.length === 0 ? (
              <div className="text-xs text-muted-foreground italic">
                Output will appear here when you run your code...
              </div>
            ) : (
              <div className="console-output space-y-1">
                {outputs.map((output) => (
                  <div
                    key={output.id}
                    className={cn(
                      output.type === 'success' && 'console-success',
                      output.type === 'info' && 'console-info'
                    )}
                  >
                    {output.content}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}

        {activeTab === 'errors' && (
          <ScrollArea className="flex-1 p-3">
            {errors.length === 0 ? (
              <div className="text-xs text-muted-foreground italic">
                No errors to display
              </div>
            ) : (
              <div className="console-output space-y-1">
                {errors.map((error) => (
                  <div
                    key={error.id}
                    className={cn(
                      error.type === 'stderr' && 'console-error',
                      error.type === 'warning' && 'console-warning'
                    )}
                  >
                    {error.content}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}

        {activeTab === 'metrics' && (
          <div className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Clock className="h-3 w-3" />
                  <span>Execution Time</span>
                </div>
                <div className="text-lg font-mono font-semibold">
                  {isRunning ? '...' : '0.00s'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <HardDrive className="h-3 w-3" />
                  <span>Memory Usage</span>
                </div>
                <div className="text-lg font-mono font-semibold">
                  {isRunning ? '...' : '0.00 MB'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stdin Input */}
        {isRunning && (
          <div className="p-2 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">stdin:</span>
              <Input
                value={stdinInput}
                onChange={(e) => setStdinInput(e.target.value)}
                onKeyDown={handleStdinSubmit}
                placeholder="Enter input..."
                className="h-7 text-xs font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
