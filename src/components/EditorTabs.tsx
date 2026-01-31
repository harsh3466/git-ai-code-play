import { X, Circle } from 'lucide-react';
import { useEditorStore } from '@/stores/editorStore';
import { getLanguageById } from '@/lib/languages';
import { cn } from '@/lib/utils';

export function EditorTabs() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useEditorStore();

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5 bg-secondary/30 px-1 py-1 overflow-x-auto scrollbar-thin">
      {tabs.map((tab) => {
        const langConfig = getLanguageById(tab.language);
        const isActive = tab.id === activeTabId;

        return (
          <div
            key={tab.id}
            className={cn(
              'group flex items-center gap-2 px-3 py-1.5 rounded-t text-sm cursor-pointer transition-colors',
              isActive
                ? 'bg-editor text-foreground'
                : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="text-xs">{langConfig?.icon}</span>
            <span className="whitespace-nowrap">{tab.name}</span>
            {tab.isModified && (
              <Circle className="h-2 w-2 fill-primary text-primary" />
            )}
            <button
              className={cn(
                'p-0.5 rounded hover:bg-secondary transition-colors',
                isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
