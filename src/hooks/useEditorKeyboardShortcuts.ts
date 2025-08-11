import { useEffect, useCallback } from 'react';
import * as monaco from 'monaco-editor';

interface KeyboardShortcutHandlers {
  onSave?: () => void;
  onFind?: () => void;
  onReplace?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSelectAll?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onToggleWordWrap?: () => void;
  onToggleMinimap?: () => void;
  onFoldAll?: () => void;
  onUnfoldAll?: () => void;
  onCommandPalette?: () => void;
  onDuplicateLine?: () => void;
  onMoveLinesUp?: () => void;
  onMoveLinesDown?: () => void;
  onToggleComment?: () => void;
  onMultiCursorNext?: () => void;
  onMultiCursorAbove?: () => void;
  onMultiCursorBelow?: () => void;
  onNextTab?: () => void;
  onPreviousTab?: () => void;
}

interface UseEditorKeyboardShortcutsProps {
  editor: monaco.editor.IStandaloneCodeEditor | null;
  handlers: KeyboardShortcutHandlers;
  enabled?: boolean;
}

export const useEditorKeyboardShortcuts = ({
  editor,
  handlers,
  enabled = true,
}: UseEditorKeyboardShortcutsProps) => {
  
  const registerShortcuts = useCallback(() => {
    if (!editor || !enabled) return;

    const disposables: monaco.IDisposable[] = [];

    // File operations
    if (handlers.onSave) {
      disposables.push(
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, handlers.onSave)
      );
    }

    // Edit operations
    if (handlers.onFind) {
      disposables.push(
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, handlers.onFind)
      );
    }

    if (handlers.onReplace) {
      disposables.push(
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, handlers.onReplace)
      );
    }

    if (handlers.onCopy) {
      disposables.push(
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, handlers.onCopy)
      );
    }

    if (handlers.onCut) {
      disposables.push(
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, handlers.onCut)
      );
    }

    if (handlers.onPaste) {
      disposables.push(
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, handlers.onPaste)
      );
    }

    if (handlers.onUndo) {
      disposables.push(
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, handlers.onUndo)
      );
    }

    if (handlers.onRedo) {
      disposables.push(
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY, handlers.onRedo)
      );
    }

    if (handlers.onSelectAll) {
      disposables.push(
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA, handlers.onSelectAll)
      );
    }

    // View operations
    if (handlers.onZoomIn) {
      disposables.push(
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Equal, handlers.onZoomIn)
      );
    }

    if (handlers.onZoomOut) {
      disposables.push(
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Minus, handlers.onZoomOut)
      );
    }

    if (handlers.onResetZoom) {
      disposables.push(
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit0, handlers.onResetZoom)
      );
    }

    if (handlers.onToggleWordWrap) {
      disposables.push(
        editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyZ, handlers.onToggleWordWrap)
      );
    }

    // Code folding
    if (handlers.onFoldAll) {
      disposables.push(
        editor.addCommand(
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
          () => {
            // This is a chord command, need to handle differently
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit0, handlers.onFoldAll!);
          }
        )
      );
    }

    if (handlers.onUnfoldAll) {
      disposables.push(
        editor.addCommand(
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
          () => {
            // This is a chord command, need to handle differently
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, handlers.onUnfoldAll!);
          }
        )
      );
    }

    // Command palette
    if (handlers.onCommandPalette) {
      disposables.push(
        editor.addCommand(
          monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
          handlers.onCommandPalette
        )
      );
    }

    // Line operations
    if (handlers.onDuplicateLine) {
      disposables.push(
        editor.addCommand(
          monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyD,
          handlers.onDuplicateLine
        )
      );
    }

    if (handlers.onMoveLinesUp) {
      disposables.push(
        editor.addCommand(
          monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.UpArrow,
          handlers.onMoveLinesUp
        )
      );
    }

    if (handlers.onMoveLinesDown) {
      disposables.push(
        editor.addCommand(
          monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.DownArrow,
          handlers.onMoveLinesDown
        )
      );
    }

    if (handlers.onToggleComment) {
      disposables.push(
        editor.addCommand(
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash,
          handlers.onToggleComment
        )
      );
    }

    // Multi-cursor operations
    if (handlers.onMultiCursorNext) {
      disposables.push(
        editor.addCommand(
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD,
          handlers.onMultiCursorNext
        )
      );
    }

    if (handlers.onMultiCursorAbove) {
      disposables.push(
        editor.addCommand(
          monaco.KeyMod.Alt | monaco.KeyCode.UpArrow,
          handlers.onMultiCursorAbove
        )
      );
    }

    if (handlers.onMultiCursorBelow) {
      disposables.push(
        editor.addCommand(
          monaco.KeyMod.Alt | monaco.KeyCode.DownArrow,
          handlers.onMultiCursorBelow
        )
      );
    }

    // Tab navigation operations
    if (handlers.onNextTab) {
      disposables.push(
        editor.addCommand(
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.PageDown,
          handlers.onNextTab
        )
      );
    }

    if (handlers.onPreviousTab) {
      disposables.push(
        editor.addCommand(
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.PageUp,
          handlers.onPreviousTab
        )
      );
    }

    return () => {
      disposables.forEach(disposable => disposable.dispose());
    };
  }, [editor, handlers, enabled]);

  useEffect(() => {
    const cleanup = registerShortcuts();
    return cleanup;
  }, [registerShortcuts]);

  // Global keyboard shortcuts (outside of editor)
  useEffect(() => {
    if (!enabled) return;

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Only handle global shortcuts when editor doesn't have focus
      if (document.activeElement?.tagName === 'TEXTAREA' || 
          document.activeElement?.classList.contains('monaco-editor')) {
        return;
      }

      const isCtrlCmd = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;
      const isAlt = event.altKey;

      // Command palette
      if (isCtrlCmd && isShift && event.key === 'P' && handlers.onCommandPalette) {
        event.preventDefault();
        handlers.onCommandPalette();
        return;
      }

      // Save
      if (isCtrlCmd && event.key === 's' && handlers.onSave) {
        event.preventDefault();
        handlers.onSave();
        return;
      }

      // Find
      if (isCtrlCmd && event.key === 'f' && handlers.onFind) {
        event.preventDefault();
        handlers.onFind();
        return;
      }

      // Tab navigation
      if (isCtrlCmd && event.key === 'PageDown' && handlers.onNextTab) {
        event.preventDefault();
        handlers.onNextTab();
        return;
      }

      if (isCtrlCmd && event.key === 'PageUp' && handlers.onPreviousTab) {
        event.preventDefault();
        handlers.onPreviousTab();
        return;
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handlers, enabled]);
};

export default useEditorKeyboardShortcuts;
