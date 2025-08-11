import React, { useRef, useEffect, useState, useCallback } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useTheme } from 'next-themes';
import { EditorSettings, EditorPosition, EditorSelection } from '@/types';
import { registerLanguagesAndThemes, getMonacoLanguage } from '@/utils/editorLanguages';

interface AdvancedCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  theme?: string;
  readOnly?: boolean;
  onCursorPositionChange?: (position: EditorPosition) => void;
  onSelectionChange?: (selection: EditorSelection | null) => void;
  onSave?: () => void;
  onFind?: () => void;
  className?: string;
  settings?: Partial<EditorSettings>;
}



// Default editor settings
const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 14,
  fontFamily: 'Consolas, "Courier New", monospace',
  lineHeight: 1.5,
  tabSize: 2,
  insertSpaces: true,
  wordWrap: 'on',
  minimap: {
    enabled: true,
    side: 'right',
    size: 'proportional',
  },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  lineNumbers: 'on',
  renderWhitespace: 'boundary',
  bracketPairColorization: true,
  codeLens: false,
  folding: true,
  foldingStrategy: 'auto',
  showFoldingControls: 'mouseover',
};

const AdvancedCodeEditor: React.FC<AdvancedCodeEditorProps> = ({
  value,
  onChange,
  language,
  theme, // Optional theme override
  readOnly = false,
  onCursorPositionChange,
  onSelectionChange,
  onSave,
  onFind,
  className = '',
  settings = {},
}) => {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isThemeReady, setIsThemeReady] = useState(false);

  // Wait for theme to be resolved before rendering editor
  useEffect(() => {
    if (resolvedTheme !== undefined) {
      setIsThemeReady(true);
    }
  }, [resolvedTheme]);

  // Determine the Monaco theme based on the current theme
  const getMonacoTheme = () => {
    if (theme) return theme; // Use provided theme if specified
    // Default to dark theme if resolvedTheme is not available or is dark
    return resolvedTheme === 'light' ? 'custom-light' : 'custom-dark';
  };

  // Merge default settings with provided settings
  const editorSettings = { ...DEFAULT_SETTINGS, ...settings };

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register languages and themes
    registerLanguagesAndThemes(monaco);

    setIsEditorReady(true);

    // Set up cursor position change listener
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorPositionChange) {
        onCursorPositionChange({
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        });
      }
    });

    // Set up selection change listener
    editor.onDidChangeCursorSelection((e) => {
      if (onSelectionChange) {
        const selection = e.selection;
        if (selection.isEmpty()) {
          onSelectionChange(null);
        } else {
          onSelectionChange({
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn,
            endLineNumber: selection.endLineNumber,
            endColumn: selection.endColumn,
          });
        }
      }
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) {
        onSave();
      }
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      if (onFind) {
        onFind();
      } else {
        // Fallback to Monaco's built-in find
        editor.getAction('actions.find')?.run();
      }
    });

    // Add command palette shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => {
      editor.getAction('editor.action.quickCommand')?.run();
    });

    // Add multi-cursor shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      editor.getAction('editor.action.addSelectionToNextFindMatch')?.run();
    });

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, () => {
      editor.getAction('editor.action.insertCursorAbove')?.run();
    });

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {
      editor.getAction('editor.action.insertCursorBelow')?.run();
    });

    // Add code folding shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.BracketLeft, () => {
      editor.getAction('editor.fold')?.run();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.BracketRight, () => {
      editor.getAction('editor.unfold')?.run();
    });

    // Add line manipulation shortcuts
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.UpArrow, () => {
      editor.getAction('editor.action.moveLinesUpAction')?.run();
    });

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.DownArrow, () => {
      editor.getAction('editor.action.moveLinesDownAction')?.run();
    });

    // Add duplicate line shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyD, () => {
      editor.getAction('editor.action.copyLinesDownAction')?.run();
    });

    // Add comment toggle shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
      editor.getAction('editor.action.commentLine')?.run();
    });

    // Focus the editor
    editor.focus();
  }, [onCursorPositionChange, onSelectionChange, onSave, onFind]);

  // Handle editor value change
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  }, [onChange]);

  // Performance optimizations for large files
  const isLargeFile = value.split('\n').length > 1000;
  const fileSize = new Blob([value]).size;
  const isVeryLargeFile = fileSize > 1024 * 1024; // 1MB

  // Configure editor options
  const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    fontSize: editorSettings.fontSize,
    fontFamily: editorSettings.fontFamily,
    lineHeight: editorSettings.lineHeight,
    tabSize: editorSettings.tabSize,
    insertSpaces: editorSettings.insertSpaces,
    wordWrap: editorSettings.wordWrap,
    minimap: isLargeFile ? { enabled: false } : editorSettings.minimap,
    scrollBeyondLastLine: editorSettings.scrollBeyondLastLine,
    automaticLayout: editorSettings.automaticLayout,
    lineNumbers: editorSettings.lineNumbers,
    renderWhitespace: editorSettings.renderWhitespace,
    bracketPairColorization: { enabled: editorSettings.bracketPairColorization },
    codeLens: isLargeFile ? false : editorSettings.codeLens,
    folding: editorSettings.folding,
    foldingStrategy: editorSettings.foldingStrategy,
    showFoldingControls: editorSettings.showFoldingControls,
    readOnly,
    selectOnLineNumbers: true,
    roundedSelection: false,
    cursorStyle: 'line',
    glyphMargin: true,
    useTabStops: false,
    // Enhanced editor features
    multiCursorModifier: 'ctrlCmd',
    multiCursorMergeOverlapping: true,
    multiCursorPaste: 'spread',
    autoIndent: 'full',
    formatOnPaste: true,
    formatOnType: true,
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    autoSurround: 'languageDefined',
    matchBrackets: 'always',
    renderLineHighlight: 'line',
    renderLineHighlightOnlyWhenFocus: false,
    showUnused: !isVeryLargeFile,
    occurrencesHighlight: isLargeFile ? 'off' : 'singleFile',
    selectionHighlight: !isLargeFile,
    scrollbar: {
      useShadows: false,
      verticalHasArrows: true,
      horizontalHasArrows: true,
      vertical: 'visible',
      horizontal: 'visible',
      verticalScrollbarSize: 17,
      horizontalScrollbarSize: 17,
      arrowSize: 30,
    },
    find: {
      addExtraSpaceOnTop: false,
      autoFindInSelection: 'never',
      seedSearchStringFromSelection: 'always',
    },
    suggest: isVeryLargeFile ? {
      // Minimal suggestions for very large files
      showKeywords: false,
      showSnippets: false,
      showFunctions: false,
      showConstructors: false,
      showFields: false,
      showVariables: false,
      showClasses: false,
      showStructs: false,
      showInterfaces: false,
      showModules: false,
      showProperties: false,
      showEvents: false,
      showOperators: false,
      showUnits: false,
      showValues: false,
      showConstants: false,
      showEnums: false,
      showEnumMembers: false,
      showColors: false,
      showFiles: false,
      showReferences: false,
      showFolders: false,
      showTypeParameters: false,
      showIssues: false,
      showUsers: false,
    } : {
      showKeywords: true,
      showSnippets: true,
      showFunctions: true,
      showConstructors: true,
      showFields: true,
      showVariables: true,
      showClasses: true,
      showStructs: true,
      showInterfaces: true,
      showModules: true,
      showProperties: true,
      showEvents: true,
      showOperators: true,
      showUnits: true,
      showValues: true,
      showConstants: true,
      showEnums: true,
      showEnumMembers: true,
      showColors: true,
      showFiles: true,
      showReferences: true,
      showFolders: true,
      showTypeParameters: true,
      showIssues: true,
      showUsers: true,
    },
  };

  // Show dark loading state while theme is being resolved
  if (!isThemeReady) {
    return (
      <div className={`h-full w-full bg-editor-background ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full bg-editor-background ${className}`}>
      <Editor
        height="100%"
        language={getMonacoLanguage(language)}
        value={value}
        theme={getMonacoTheme()}
        options={editorOptions}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
        loading={
          <div className="flex items-center justify-center h-full bg-editor-background">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      />
    </div>
  );
};

export default AdvancedCodeEditor;
