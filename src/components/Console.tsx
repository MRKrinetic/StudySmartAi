import React, { useEffect, useRef } from 'react';
import { Terminal, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ConsoleProps {
  output: string;
  isRunning?: boolean;
  onClear?: () => void;
  className?: string;
}

const Console: React.FC<ConsoleProps> = ({
  output,
  isRunning = false,
  onClear,
  className = '',
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new output is added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [output]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast.success('Output copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy output');
    }
  };

  const formatOutput = (text: string) => {
    if (!text) return '';
    
    // Split by common separators and format
    return text
      .split('\n')
      .map((line, index) => (
        <div key={index} className="font-mono text-sm leading-relaxed">
          {line || '\u00A0'} {/* Non-breaking space for empty lines */}
        </div>
      ));
  };

  return (
    <div className={cn('h-full flex flex-col bg-slate-900 text-green-400', className)}>
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          <span className="text-sm font-medium text-slate-200">Console</span>
          {isRunning && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-400">Running...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={!output}
            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            title="Copy output"
          >
            <Copy className="h-3 w-3" />
          </Button>
          
          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={!output}
              className="h-7 w-7 p-0 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
              title="Clear console"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Console Content */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4">
          {output ? (
            <div className="space-y-1">
              {formatOutput(output)}
            </div>
          ) : (
            <div className="text-slate-500 text-sm italic">
              {isRunning ? 'Executing code...' : 'No output yet. Run some code to see results here.'}
            </div>
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
    </div>
  );
};

export default Console;