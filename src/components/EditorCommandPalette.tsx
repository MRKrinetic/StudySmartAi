import React, { useState, useEffect, useCallback } from 'react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { EditorCommand } from '@/types';
import { 
  Save, 
  Search, 
  Copy, 
  Scissors, 
  ClipboardPaste, 
  Undo, 
  Redo, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  FileText,
  Code,
  Eye,
  Settings,
  Palette,
  ToggleLeft
} from 'lucide-react';

interface EditorCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: EditorCommand[];
  onCommandExecute: (command: EditorCommand) => void;
}

// Default editor commands with icons
const DEFAULT_COMMANDS: EditorCommand[] = [
  {
    id: 'save',
    label: 'Save File',
    description: 'Save the current file',
    keybinding: 'Ctrl+S',
    category: 'File',
    action: () => {},
  },
  {
    id: 'find',
    label: 'Find',
    description: 'Find text in the current file',
    keybinding: 'Ctrl+F',
    category: 'Edit',
    action: () => {},
  },
  {
    id: 'replace',
    label: 'Find and Replace',
    description: 'Find and replace text in the current file',
    keybinding: 'Ctrl+H',
    category: 'Edit',
    action: () => {},
  },
  {
    id: 'copy',
    label: 'Copy',
    description: 'Copy selected text',
    keybinding: 'Ctrl+C',
    category: 'Edit',
    action: () => {},
  },
  {
    id: 'cut',
    label: 'Cut',
    description: 'Cut selected text',
    keybinding: 'Ctrl+X',
    category: 'Edit',
    action: () => {},
  },
  {
    id: 'paste',
    label: 'Paste',
    description: 'Paste from clipboard',
    keybinding: 'Ctrl+V',
    category: 'Edit',
    action: () => {},
  },
  {
    id: 'undo',
    label: 'Undo',
    description: 'Undo last action',
    keybinding: 'Ctrl+Z',
    category: 'Edit',
    action: () => {},
  },
  {
    id: 'redo',
    label: 'Redo',
    description: 'Redo last undone action',
    keybinding: 'Ctrl+Y',
    category: 'Edit',
    action: () => {},
  },
  {
    id: 'selectAll',
    label: 'Select All',
    description: 'Select all text',
    keybinding: 'Ctrl+A',
    category: 'Edit',
    action: () => {},
  },
  {
    id: 'zoomIn',
    label: 'Zoom In',
    description: 'Increase font size',
    keybinding: 'Ctrl++',
    category: 'View',
    action: () => {},
  },
  {
    id: 'zoomOut',
    label: 'Zoom Out',
    description: 'Decrease font size',
    keybinding: 'Ctrl+-',
    category: 'View',
    action: () => {},
  },
  {
    id: 'resetZoom',
    label: 'Reset Zoom',
    description: 'Reset font size to default',
    keybinding: 'Ctrl+0',
    category: 'View',
    action: () => {},
  },
  {
    id: 'toggleWordWrap',
    label: 'Toggle Word Wrap',
    description: 'Toggle word wrapping',
    keybinding: 'Alt+Z',
    category: 'View',
    action: () => {},
  },
  {
    id: 'toggleMinimap',
    label: 'Toggle Minimap',
    description: 'Show or hide the minimap',
    category: 'View',
    action: () => {},
  },
  {
    id: 'foldAll',
    label: 'Fold All',
    description: 'Fold all code blocks',
    keybinding: 'Ctrl+K Ctrl+0',
    category: 'Folding',
    action: () => {},
  },
  {
    id: 'unfoldAll',
    label: 'Unfold All',
    description: 'Unfold all code blocks',
    keybinding: 'Ctrl+K Ctrl+J',
    category: 'Folding',
    action: () => {},
  },
];

// Command icons mapping
const COMMAND_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'save': Save,
  'find': Search,
  'replace': Search,
  'copy': Copy,
  'cut': Scissors,
  'paste': ClipboardPaste,
  'undo': Undo,
  'redo': Redo,
  'zoomIn': ZoomIn,
  'zoomOut': ZoomOut,
  'resetZoom': RotateCcw,
  'toggleWordWrap': ToggleLeft,
  'toggleMinimap': Eye,
  'foldAll': Code,
  'unfoldAll': Code,
};

const EditorCommandPalette: React.FC<EditorCommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
  onCommandExecute,
}) => {
  const [searchValue, setSearchValue] = useState('');
  
  // Merge default commands with provided commands
  const allCommands = [...DEFAULT_COMMANDS, ...commands];
  
  // Filter commands based on search
  const filteredCommands = allCommands.filter(command =>
    command.label.toLowerCase().includes(searchValue.toLowerCase()) ||
    command.description?.toLowerCase().includes(searchValue.toLowerCase()) ||
    command.category?.toLowerCase().includes(searchValue.toLowerCase())
  );
  
  // Group commands by category
  const groupedCommands = filteredCommands.reduce((groups, command) => {
    const category = command.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(command);
    return groups;
  }, {} as Record<string, EditorCommand[]>);

  const handleCommandSelect = useCallback((command: EditorCommand) => {
    onCommandExecute(command);
    onClose();
    setSearchValue('');
  }, [onCommandExecute, onClose]);

  const getCommandIcon = (commandId: string) => {
    const IconComponent = COMMAND_ICONS[commandId] || Settings;
    return IconComponent;
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput
        placeholder="Type a command or search..."
        value={searchValue}
        onValueChange={setSearchValue}
      />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        
        {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
          <CommandGroup key={category} heading={category}>
            {categoryCommands.map((command) => {
              const IconComponent = getCommandIcon(command.id);
              
              return (
                <CommandItem
                  key={command.id}
                  onSelect={() => handleCommandSelect(command)}
                  className="flex items-center gap-3 py-2"
                >
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{command.label}</div>
                    {command.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {command.description}
                      </div>
                    )}
                  </div>
                  {command.keybinding && (
                    <Badge variant="outline" className="text-xs">
                      {command.keybinding}
                    </Badge>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

export default EditorCommandPalette;
