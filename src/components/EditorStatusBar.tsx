import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EditorPosition, EditorSelection } from '@/types';
import { cn } from '@/lib/utils';

interface EditorStatusBarProps {
  cursorPosition: EditorPosition;
  selection: EditorSelection | null;
  language: string;
  encoding?: string;
  lineEnding?: string;
  totalLines: number;
  fileSize?: number;
  isReadOnly?: boolean;
  hasUnsavedChanges?: boolean;
  onLanguageClick?: () => void;
  onEncodingClick?: () => void;
  onLineEndingClick?: () => void;
  className?: string;
}

// Language display names
const LANGUAGE_NAMES: Record<string, string> = {
  'txt': 'Plain Text',
  'md': 'Markdown',
  'py': 'Python',
  'js': 'JavaScript',
  'cpp': 'C++',
  'json': 'JSON',
  'csv': 'CSV',
};

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const EditorStatusBar: React.FC<EditorStatusBarProps> = ({
  cursorPosition,
  selection,
  language,
  encoding = 'UTF-8',
  lineEnding = 'LF',
  totalLines,
  fileSize,
  isReadOnly = false,
  hasUnsavedChanges = false,
  onLanguageClick,
  onEncodingClick,
  onLineEndingClick,
  className = '',
}) => {
  const languageName = LANGUAGE_NAMES[language] || language.toUpperCase();
  
  // Calculate selection info
  const selectionInfo = selection ? {
    lines: selection.endLineNumber - selection.startLineNumber + 1,
    characters: selection.endColumn - selection.startColumn,
  } : null;

  return (
    <div className={cn(
      'h-6 bg-card border-t border-border flex items-center justify-between px-2 text-xs text-muted-foreground',
      className
    )}>
      {/* Left side - Position and selection info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span>
            Ln {cursorPosition.lineNumber}, Col {cursorPosition.column}
          </span>
          {selectionInfo && (
            <span className="text-primary">
              ({selectionInfo.lines} lines, {selectionInfo.characters} chars selected)
            </span>
          )}
        </div>
        
        {totalLines > 0 && (
          <span>
            {totalLines} lines
          </span>
        )}
        
        {fileSize !== undefined && (
          <span>
            {formatFileSize(fileSize)}
          </span>
        )}
      </div>

      {/* Right side - File info and settings */}
      <div className="flex items-center gap-2">
        {hasUnsavedChanges && (
          <Badge variant="outline" className="h-5 text-xs">
            Unsaved
          </Badge>
        )}
        
        {isReadOnly && (
          <Badge variant="secondary" className="h-5 text-xs">
            Read Only
          </Badge>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-2 text-xs hover:bg-muted"
          onClick={onLanguageClick}
        >
          {languageName}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-2 text-xs hover:bg-muted"
          onClick={onEncodingClick}
        >
          {encoding}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-2 text-xs hover:bg-muted"
          onClick={onLineEndingClick}
        >
          {lineEnding}
        </Button>
      </div>
    </div>
  );
};

export default EditorStatusBar;
