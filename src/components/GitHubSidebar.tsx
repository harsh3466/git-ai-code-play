import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileCode, GitBranch, RefreshCw, LogIn } from 'lucide-react';
import { GitHubFile, GitHubRepo } from '@/types/compiler';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock data for demonstration
const mockRepos: GitHubRepo[] = [
  { id: 1, name: 'my-project', fullName: 'user/my-project', owner: 'user', isPrivate: false, defaultBranch: 'main' },
  { id: 2, name: 'awesome-app', fullName: 'user/awesome-app', owner: 'user', isPrivate: true, defaultBranch: 'master' },
];

const mockFileTree: GitHubFile[] = [
  {
    name: 'src',
    path: 'src',
    type: 'dir',
    children: [
      { name: 'main.py', path: 'src/main.py', type: 'file' },
      { name: 'utils.py', path: 'src/utils.py', type: 'file' },
      {
        name: 'components',
        path: 'src/components',
        type: 'dir',
        children: [
          { name: 'app.js', path: 'src/components/app.js', type: 'file' },
        ],
      },
    ],
  },
  { name: 'README.md', path: 'README.md', type: 'file' },
  { name: 'requirements.txt', path: 'requirements.txt', type: 'file' },
];

interface FileTreeItemProps {
  file: GitHubFile;
  level: number;
  onFileClick: (file: GitHubFile) => void;
}

function FileTreeItem({ file, level, onFileClick }: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isFolder = file.type === 'dir';
  const paddingLeft = level * 12 + 8;

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      onFileClick(file);
    }
  };

  return (
    <div>
      <div
        className="file-tree-item"
        style={{ paddingLeft }}
        onClick={handleClick}
      >
        {isFolder ? (
          <>
            {isOpen ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
            {isOpen ? (
              <FolderOpen className="h-4 w-4 text-warning" />
            ) : (
              <Folder className="h-4 w-4 text-warning" />
            )}
          </>
        ) : (
          <>
            <span className="w-3" />
            <FileCode className="h-4 w-4 text-primary" />
          </>
        )}
        <span className="truncate text-sm">{file.name}</span>
      </div>
      {isFolder && isOpen && file.children && (
        <div>
          {file.children.map((child) => (
            <FileTreeItem
              key={child.path}
              file={child}
              level={level + 1}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface GitHubSidebarProps {
  onFileSelect: (path: string, content: string) => void;
}

export function GitHubSidebar({ onFileSelect }: GitHubSidebarProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [expandedSection, setExpandedSection] = useState<'repos' | 'files' | null>('repos');

  const handleConnect = () => {
    // Mock connection - in real app, this would trigger GitHub OAuth
    setIsConnected(true);
  };

  const handleRepoSelect = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setExpandedSection('files');
  };

  const handleFileClick = (file: GitHubFile) => {
    // Mock file content
    const mockContent = `// Content of ${file.name}\nconsole.log("Hello from ${file.path}");`;
    onFileSelect(file.path, mockContent);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
          <GitBranch className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-sm mb-2">Connect to GitHub</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Import files directly from your repositories
        </p>
        <Button size="sm" onClick={handleConnect} className="gap-2">
          <LogIn className="h-4 w-4" />
          Connect GitHub
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Repositories Section */}
      <div className="sidebar-section">
        <div
          className="sidebar-section-header"
          onClick={() => setExpandedSection(expandedSection === 'repos' ? null : 'repos')}
        >
          <span className="flex items-center gap-2">
            {expandedSection === 'repos' ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Repositories
          </span>
          <Button variant="ghost" size="icon" className="h-5 w-5">
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        {expandedSection === 'repos' && (
          <ScrollArea className="max-h-40">
            <div className="p-1">
              {mockRepos.map((repo) => (
                <div
                  key={repo.id}
                  className={`file-tree-item ${selectedRepo?.id === repo.id ? 'active' : ''}`}
                  onClick={() => handleRepoSelect(repo)}
                >
                  <GitBranch className="h-4 w-4" />
                  <span className="truncate">{repo.name}</span>
                  {repo.isPrivate && (
                    <span className="text-xs text-muted-foreground ml-auto">🔒</span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Files Section */}
      {selectedRepo && (
        <div className="sidebar-section flex-1">
          <div
            className="sidebar-section-header"
            onClick={() => setExpandedSection(expandedSection === 'files' ? null : 'files')}
          >
            <span className="flex items-center gap-2">
              {expandedSection === 'files' ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              {selectedRepo.name}
            </span>
            <span className="text-xs text-muted-foreground">{selectedRepo.defaultBranch}</span>
          </div>
          {expandedSection === 'files' && (
            <ScrollArea className="flex-1">
              <div className="py-1">
                {mockFileTree.map((file) => (
                  <FileTreeItem
                    key={file.path}
                    file={file}
                    level={0}
                    onFileClick={handleFileClick}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}
