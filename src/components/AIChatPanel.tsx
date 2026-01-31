import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Settings, Sparkles, Bot, User, Key, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useEditorStore } from '@/stores/editorStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function AIChatPanel() {
  const { chatMessages, addChatMessage, clearChatMessages, openAiKey, setOpenAiKey } = useEditorStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    addChatMessage({ role: 'user', content: userMessage });

    if (!openAiKey) {
      addChatMessage({
        role: 'assistant',
        content: '⚠️ Please set your OpenAI API key in settings to use AI assistance. Click the gear icon above to add your key.',
      });
      return;
    }

    setIsLoading(true);

    // Simulate AI response (in real app, this would call OpenAI API)
    setTimeout(() => {
      const responses = [
        "I'd be happy to help with your code! Could you share more details about what you're trying to accomplish?",
        "Looking at your question, here are a few suggestions:\n\n1. Consider using a try-catch block for error handling\n2. You might want to add input validation\n3. Breaking this into smaller functions would improve readability",
        "That's a great question! The best approach here would be to use a recursive algorithm. Here's a quick example:\n\n```python\ndef solve(n):\n    if n <= 1:\n        return n\n    return solve(n-1) + solve(n-2)\n```",
        "I can see a potential bug in your approach. The loop should start from index 0, not 1. Also, don't forget to handle edge cases when the array is empty.",
      ];

      addChatMessage({
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const saveApiKey = () => {
    setOpenAiKey(tempApiKey);
    setSettingsOpen(false);
    setTempApiKey('');
  };

  return (
    <div className="flex flex-col h-full bg-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="panel-title">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Settings className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>AI Settings</DialogTitle>
                <DialogDescription>
                  Enter your OpenAI API key to enable AI assistance. Your key is stored locally and never sent to our servers.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <Key className="h-4 w-4 text-warning" />
                  <span className="text-sm text-warning">Your API key is encrypted and stored locally</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">OpenAI API Key</label>
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={tempApiKey || openAiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                  />
                </div>
                <Button onClick={saveApiKey} className="w-full">
                  Save API Key
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearChatMessages}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* API Key Warning */}
      {!openAiKey && (
        <div className="mx-3 mt-3 p-2 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-warning">
            Add your OpenAI API key in settings to enable AI assistance
          </p>
        </div>
      )}

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-3">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Bot className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-medium text-sm mb-1">AI Code Assistant</h3>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              Ask questions about your code, get debugging help, or request explanations
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                )}
                <div className={`chat-bubble ${msg.role}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="h-3 w-3" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
                <div className="chat-bubble assistant">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            placeholder="Ask about your code..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] max-h-[120px] resize-none text-sm"
            rows={2}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="shrink-0 h-[60px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
