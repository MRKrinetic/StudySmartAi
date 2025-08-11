import React, { useState } from 'react';
import { Play, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import CodeExecutionService from '@/services/codeExecutionService';

interface RunButtonProps {
  fileType: string;
  fileName: string;
  code: string;
  onRun: (code: string, fileType: string) => Promise<void>;
  className?: string;
  disabled?: boolean;
}

const RunButton: React.FC<RunButtonProps> = ({
  fileType,
  fileName,
  code,
  onRun,
  className = '',
  disabled = false,
}) => {
  const [isRunning, setIsRunning] = useState(false);

  // Check if the file type is supported for execution
  const isSupported = CodeExecutionService.isSupportedFileType(fileType);
  const isPython = fileType === 'py';

  const getLanguageLabel = (type: string) => {
    return CodeExecutionService.getLanguageLabel(type);
  };

  const handleRun = async () => {
    if (!isSupported || isRunning || disabled) return;

    setIsRunning(true);
    try {
      await onRun(code, fileType);
    } catch (error) {
      console.error('Error running code:', error);
    } finally {
      setIsRunning(false);
    }
  };

  if (!isSupported) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-2', className)}>
        <Badge variant="secondary" className="text-xs">
          {getLanguageLabel(fileType)} - Not Executable
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        onClick={handleRun}
        disabled={isRunning || disabled || !code.trim()}
        size="sm"
        className="flex items-center gap-2 h-8"
        variant={isPython ? "default" : "secondary"}
      >
        {isRunning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Running...</span>
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            <span>Run {getLanguageLabel(fileType)}</span>
          </>
        )}
      </Button>

      {isPython && (
        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
          Python Ready
        </Badge>
      )}

      {!code.trim() && (
        <span className="text-xs text-muted-foreground">
          No code to execute
        </span>
      )}
    </div>
  );
};

export default RunButton;