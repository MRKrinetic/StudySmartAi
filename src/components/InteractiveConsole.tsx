import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal, Copy, Trash2, Send, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ConsoleMessage {
  id: string;
  type: 'output' | 'input' | 'error' | 'system';
  content: string;
  timestamp: Date;
}

interface InteractiveConsoleProps {
  output: string;
  isRunning?: boolean;
  onClear?: () => void;
  onInput?: (input: string) => void;
  className?: string;
  allowInput?: boolean;
  onReset?: () => void;
}

const InteractiveConsole: React.FC<InteractiveConsoleProps> = ({
  output,
  isRunning = false,
  onClear,
  onInput,
  className = '',
  allowInput = true,
  onReset,
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [isMultiLineMode, setIsMultiLineMode] = useState(false);

  // Convert output to messages
  useEffect(() => {
    if (output) {
      const lines = output.split('\n');
      const newMessages: ConsoleMessage[] = lines
        .filter(line => line.trim() !== '')
        .map((line, index) => ({
          id: `output-${Date.now()}-${index}`,
          type: line.toLowerCase().includes('error') ? 'error' : 'output',
          content: line,
          timestamp: new Date(),
        }));
      
      setMessages(prev => {
        // Clear previous output messages and add new ones
        const nonOutputMessages = prev.filter(msg => msg.type !== 'output' && msg.type !== 'error');
        return [...nonOutputMessages, ...newMessages];
      });
    }
  }, [output]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Focus input when component mounts or when waiting for input
  useEffect(() => {
    if (allowInput && (isWaitingForInput || !isRunning)) {
      if (isMultiLineMode && textareaRef.current) {
        textareaRef.current.focus();
      } else if (!isMultiLineMode && inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [allowInput, isWaitingForInput, isRunning, isMultiLineMode]);

  // Sync internal waiting state with external state
  useEffect(() => {
    // If the program is running but not waiting for input, reset the internal waiting state
    if (isRunning && !isWaitingForInput) {
      setIsWaitingForInput(false);
    }
  }, [isRunning, isWaitingForInput]);

  const handleCopy = async () => {
    try {
      const allContent = messages.map(msg => 
        `[${msg.timestamp.toLocaleTimeString()}] ${msg.type.toUpperCase()}: ${msg.content}`
      ).join('\n');
      await navigator.clipboard.writeText(allContent);
      toast.success('Console content copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy console content');
    }
  };

  const resetConsoleState = useCallback(() => {
    setInputValue('');
    setInputHistory([]);
    setHistoryIndex(-1);
    setIsWaitingForInput(false);
    setIsMultiLineMode(false);
    // Don't clear messages here - let the output prop handle message updates
  }, []);

  const clearConsoleState = useCallback(() => {
    setMessages([]);
    setInputValue('');
    setInputHistory([]);
    setHistoryIndex(-1);
    setIsWaitingForInput(false);
    setIsMultiLineMode(false);
  }, []);

  const handleClearConsole = () => {
    clearConsoleState();
    if (onClear) {
      onClear();
    }
  };

  // Reset console state when onReset is called
  useEffect(() => {
    if (onReset) {
      resetConsoleState();
    }
  }, [onReset, resetConsoleState]);

  const addMessage = useCallback((type: ConsoleMessage['type'], content: string) => {
    const newMessage: ConsoleMessage = {
      id: `${type}-${Date.now()}-${Math.random()}`,
      type,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const handleInputSubmit = () => {
    if (!inputValue.trim() || isRunning) return;

    // Add input to history
    if (inputValue.trim() !== '') {
      setInputHistory(prev => {
        const newHistory = [inputValue, ...prev.filter(item => item !== inputValue)];
        return newHistory.slice(0, 50); // Keep last 50 commands
      });
    }

    // Add input message to console
    addMessage('input', `> ${inputValue}`);

    // Send input to parent component
    if (onInput) {
      onInput(inputValue);
    }

    // Clear input and reset history index
    setInputValue('');
    setHistoryIndex(-1);
    setIsWaitingForInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (isMultiLineMode && !e.ctrlKey && !e.shiftKey) {
        // In multi-line mode, Enter adds a new line unless Ctrl+Enter is pressed
        return;
      }
      e.preventDefault();
      handleInputSubmit();
    } else if (e.key === 'ArrowUp' && !isMultiLineMode) {
      e.preventDefault();
      if (inputHistory.length > 0) {
        const newIndex = Math.min(historyIndex + 1, inputHistory.length - 1);
        setHistoryIndex(newIndex);
        setInputValue(inputHistory[newIndex] || '');
      }
    } else if (e.key === 'ArrowDown' && !isMultiLineMode) {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(inputHistory[newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue('');
      }
    }
  };

  const toggleMultiLineMode = () => {
    setIsMultiLineMode(!isMultiLineMode);
    // Focus the appropriate input after mode change
    setTimeout(() => {
      if (!isMultiLineMode && textareaRef.current) {
        textareaRef.current.focus();
      } else if (isMultiLineMode && inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  const getMessageColor = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'output':
        return 'text-green-400';
      case 'input':
        return 'text-blue-400';
      case 'error':
        return 'text-red-400';
      case 'system':
        return 'text-yellow-400';
      default:
        return 'text-green-400';
    }
  };

  const getMessagePrefix = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'input':
        return '';
      case 'error':
        return '[ERROR] ';
      case 'system':
        return '[SYSTEM] ';
      default:
        return '';
    }
  };

  return (
    <div className={cn('h-full flex flex-col bg-slate-900 text-green-400', className)}>
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          <span className="text-sm font-medium text-slate-200">Interactive Console</span>
          {isRunning && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-400">Running...</span>
            </div>
          )}
          {isWaitingForInput && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-400">Waiting for input...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={messages.length === 0}
            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            title="Copy console content"
          >
            <Copy className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearConsole}
            disabled={messages.length === 0}
            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            title="Clear console"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Console Content */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-1">
          {messages.length === 0 ? (
            <div className="text-slate-500 text-sm italic">
              {isRunning 
                ? 'Executing code...' 
                : allowInput 
                  ? 'Interactive console ready. Type commands and press Enter.'
                  : 'No output yet. Run some code to see results here.'
              }
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="font-mono text-sm leading-relaxed">
                <span className={cn('whitespace-pre-wrap', getMessageColor(message.type))}>
                  {getMessagePrefix(message.type)}{message.content}
                </span>
              </div>
            ))
          )}
          
          {isRunning && (
            <div className="flex items-center gap-2 mt-4 text-slate-400">
              <div className="h-1 w-1 bg-green-400 rounded-full animate-pulse"></div>
              <div className="h-1 w-1 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="h-1 w-1 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      {allowInput && (
        <div className="border-t border-slate-700 p-3 bg-slate-800">
          <div className="flex items-start gap-2">
            <span className="text-slate-400 text-sm font-mono mt-2">$</span>
            {isMultiLineMode ? (
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRunning ? "Program is running..." : "Type your input... (Ctrl+Enter to submit)"}
                disabled={isRunning}
                className="flex-1 bg-slate-900 border-slate-600 text-green-400 font-mono text-sm placeholder:text-slate-500 focus:border-green-400 min-h-[60px] resize-none"
                rows={3}
              />
            ) : (
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRunning ? "Program is running..." : "Type a command... (Enter to submit)"}
                disabled={isRunning}
                className="flex-1 bg-slate-900 border-slate-600 text-green-400 font-mono text-sm placeholder:text-slate-500 focus:border-green-400"
              />
            )}
            <div className="flex flex-col gap-1">
              <Button
                onClick={toggleMultiLineMode}
                size="sm"
                variant="outline"
                className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white text-xs px-2 py-1 h-7"
                title={isMultiLineMode ? "Switch to single line" : "Switch to multi-line"}
              >
                {isMultiLineMode ? "Single" : "Multi"}
              </Button>
              <Button
                onClick={handleInputSubmit}
                disabled={!inputValue.trim() || isRunning}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white h-7"
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            {inputHistory.length > 0 && !isMultiLineMode && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ArrowUp className="h-3 w-3" />
                <ArrowDown className="h-3 w-3" />
                <span>Use arrow keys to navigate command history</span>
              </div>
            )}
            {isMultiLineMode && (
              <div className="text-xs text-slate-500">
                <span>Ctrl+Enter to submit • Enter for new line</span>
              </div>
            )}
            {!isMultiLineMode && inputHistory.length === 0 && (
              <div className="text-xs text-slate-500">
                <span>Enter to submit • Click "Multi" for multi-line input</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveConsole;