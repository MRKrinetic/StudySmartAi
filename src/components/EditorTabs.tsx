import React from 'react';
import { X, FileText, Code, Database, FileJson, FileSpreadsheet, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditorTab } from '@/types';
import { cn } from '@/lib/utils';

interface EditorTabsProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  className?: string;
}

// File type icons mapping
const FILE_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'txt': FileText,
  'md': FileText,
  'py': Code,
  'js': Code,
  'cpp': Code,
  'json': FileJson,
  'csv': FileSpreadsheet,
  'console': Terminal,
};

// File type colors
const FILE_TYPE_COLORS: Record<string, string> = {
  'txt': 'bg-gray-500',
  'md': 'bg-blue-500',
  'py': 'bg-yellow-500',
  'js': 'bg-green-500',
  'cpp': 'bg-purple-500',
  'json': 'bg-orange-500',
  'csv': 'bg-teal-500',
  'console': 'bg-slate-600',
};

const EditorTabs: React.FC<EditorTabsProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  className = '',
}) => {
  if (tabs.length === 0) {
    return null;
  }

  const getFileIcon = (type: string) => {
    const IconComponent = FILE_TYPE_ICONS[type] || FileText;
    return IconComponent;
  };

  const getFileColor = (type: string) => {
    return FILE_TYPE_COLORS[type] || 'bg-gray-500';
  };

  return (
    <div className={cn('flex items-center bg-card border-b border-border overflow-x-auto', className)}>
      <div className="flex items-center min-w-0">
        {tabs.map((tab) => {
          const IconComponent = getFileIcon(tab.type);
          const isActive = tab.id === activeTabId;
          
          return (
            <div
              key={tab.id}
              className={cn(
                'flex items-center gap-2 px-3 py-2 border-r border-border cursor-pointer group min-w-0 max-w-48',
                'hover:bg-muted/50 transition-colors',
                isActive && 'bg-background border-b-2 border-b-primary'
              )}
              onClick={() => onTabSelect(tab.id)}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span 
                  className={cn(
                    'text-sm truncate',
                    isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                  title={tab.name}
                >
                  {tab.name}
                </span>
                {tab.isDirty && (
                  <div className="h-2 w-2 bg-warning rounded-full flex-shrink-0" />
                )}
              </div>
              
              <Badge 
                variant="secondary" 
                className={cn(
                  'text-xs px-1.5 py-0.5 h-5 flex-shrink-0',
                  getFileColor(tab.type),
                  'text-white'
                )}
              >
                {tab.type.toUpperCase()}
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
      
      {tabs.length > 1 && (
        <div className="flex items-center gap-1 px-2 text-xs text-muted-foreground">
          <span>{tabs.length} files</span>
        </div>
      )}
    </div>
  );
};

export default EditorTabs;
