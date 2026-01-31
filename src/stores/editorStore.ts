import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FileTab, Language, ConsoleOutput, ChatMessage, CompileResult } from '@/types/compiler';
import { languages, getLanguageById } from '@/lib/languages';

interface EditorState {
  // Tabs
  tabs: FileTab[];
  activeTabId: string | null;
  
  // Console
  consoleOutputs: ConsoleOutput[];
  isRunning: boolean;
  
  // Sidebar states
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  
  // AI Chat
  chatMessages: ChatMessage[];
  openAiKey: string;
  
  // Settings
  fontSize: number;
  
  // Actions
  addTab: (language: Language) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  updateTabName: (id: string, name: string) => void;
  
  addConsoleOutput: (output: Omit<ConsoleOutput, 'id' | 'timestamp'>) => void;
  clearConsole: () => void;
  setIsRunning: (running: boolean) => void;
  
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChatMessages: () => void;
  setOpenAiKey: (key: string) => void;
  
  setFontSize: (size: number) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const createDefaultTab = (): FileTab => {
  const python = languages.find(l => l.id === 'python')!;
  return {
    id: generateId(),
    name: 'main.py',
    language: 'python',
    content: python.defaultCode,
    isModified: false,
  };
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      tabs: [createDefaultTab()],
      activeTabId: null,
      consoleOutputs: [],
      isRunning: false,
      leftSidebarOpen: true,
      rightSidebarOpen: true,
      chatMessages: [],
      openAiKey: '',
      fontSize: 14,

      addTab: (language: Language) => {
        const langConfig = getLanguageById(language);
        if (!langConfig) return;
        
        const existingTabs = get().tabs.filter(t => t.language === language);
        const name = existingTabs.length === 0 
          ? `main${langConfig.extension}`
          : `file${existingTabs.length + 1}${langConfig.extension}`;
        
        const newTab: FileTab = {
          id: generateId(),
          name,
          language,
          content: langConfig.defaultCode,
          isModified: false,
        };
        
        set(state => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
        }));
      },

      closeTab: (id: string) => {
        set(state => {
          const newTabs = state.tabs.filter(t => t.id !== id);
          let newActiveId = state.activeTabId;
          
          if (state.activeTabId === id) {
            const closedIndex = state.tabs.findIndex(t => t.id === id);
            newActiveId = newTabs[closedIndex]?.id || newTabs[closedIndex - 1]?.id || null;
          }
          
          return { tabs: newTabs, activeTabId: newActiveId };
        });
      },

      setActiveTab: (id: string) => set({ activeTabId: id }),

      updateTabContent: (id: string, content: string) => {
        set(state => ({
          tabs: state.tabs.map(t => 
            t.id === id ? { ...t, content, isModified: true } : t
          ),
        }));
      },

      updateTabName: (id: string, name: string) => {
        set(state => ({
          tabs: state.tabs.map(t => 
            t.id === id ? { ...t, name } : t
          ),
        }));
      },

      addConsoleOutput: (output) => {
        const newOutput: ConsoleOutput = {
          ...output,
          id: generateId(),
          timestamp: new Date(),
        };
        set(state => ({
          consoleOutputs: [...state.consoleOutputs, newOutput],
        }));
      },

      clearConsole: () => set({ consoleOutputs: [] }),

      setIsRunning: (running: boolean) => set({ isRunning: running }),

      toggleLeftSidebar: () => set(state => ({ leftSidebarOpen: !state.leftSidebarOpen })),
      toggleRightSidebar: () => set(state => ({ rightSidebarOpen: !state.rightSidebarOpen })),

      addChatMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: generateId(),
          timestamp: new Date(),
        };
        set(state => ({
          chatMessages: [...state.chatMessages, newMessage],
        }));
      },

      clearChatMessages: () => set({ chatMessages: [] }),
      
      setOpenAiKey: (key: string) => set({ openAiKey: key }),

      setFontSize: (size: number) => set({ fontSize: size }),
    }),
    {
      name: 'compiler-storage',
      partialize: (state) => ({
        tabs: state.tabs,
        openAiKey: state.openAiKey,
        fontSize: state.fontSize,
      }),
    }
  )
);
