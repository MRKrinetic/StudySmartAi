import React, { useState, useEffect, useCallback, useRef } from "react";
import { FileText, Code, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import * as monaco from 'monaco-editor';

import { useFileContext } from "@/contexts/FileContext";
import { useFiles } from "@/hooks/useNotebooks";
import { toast } from "sonner";
import { EditorTab, EditorPosition, EditorSelection, EditorCommand, EditorSettings } from "@/types";
import { getFileTypeFromName } from "@/utils/editorLanguages";
import { pistonApi } from "@/services/pistonApi";
import CodeExecutionService from "@/services/codeExecutionService";
import { getFileId, hasValidFileId, normalizeFileId, getFileIdForApi } from "@/utils/fileUtils";

import AdvancedCodeEditor from "./AdvancedCodeEditor";
import EditorTabs from "./EditorTabs";
import EditorStatusBar from "./EditorStatusBar";
import EditorCommandPalette from "./EditorCommandPalette";
import RunButton from "./RunButton";
import Console from "./Console";
import InteractiveConsole from "./InteractiveConsole";
import InteractiveConsoleService from "@/services/interactiveConsoleService";
import useEditorKeyboardShortcuts from "@/hooks/useEditorKeyboardShortcuts";

const EnhancedFileEditor = () => {
  const { selectedFile, selectedFileId, isLoading, error, setSelectedFileId, clearSelection } = useFileContext();
  const [content, setContent] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Editor state
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState<EditorPosition>({ lineNumber: 1, column: 1 });
  const [selection, setSelection] = useState<EditorSelection | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [editorSettings, setEditorSettings] = useState<Partial<EditorSettings>>({});
  
  // Console state
  const [consoleOutput, setConsoleOutput] = useState('');
  const [isCodeRunning, setIsCodeRunning] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [useInteractiveConsole, setUseInteractiveConsole] = useState(false);
  
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // Handle editor mount to get reference
  const handleEditorMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  };

  // Get the updateFile function from the useFiles hook
  const { updateFile } = useFiles(selectedFile?.notebookId || "");

  // File type information
  const getFileInfo = (type: string) => {
    const fileTypes = {
      'txt': { label: 'TXT', color: 'bg-gray-500' },
      'md': { label: 'MD', color: 'bg-blue-500' },
      'py': { label: 'PY', color: 'bg-yellow-500' },
      'js': { label: 'JS', color: 'bg-green-500' },
      'cpp': { label: 'CPP', color: 'bg-purple-500' },
      'json': { label: 'JSON', color: 'bg-orange-500' },
      'csv': { label: 'CSV', color: 'bg-teal-500' },
    };
    return fileTypes[type as keyof typeof fileTypes] || { label: 'FILE', color: 'bg-gray-500' };
  };

  // Update content and tabs when selectedFile changes
  useEffect(() => {
    if (selectedFile) {
      // Ensure file has a valid ID from MongoDB
      if (!hasValidFileId(selectedFile)) {
        console.error('Selected file does not have a valid ID:', selectedFile);
        toast.error('Invalid file: File must be saved to database first');
        return;
      }

      // Normalize the file to ensure consistent ID fields
      const normalizedFile = normalizeFileId(selectedFile);

      // Use the file ID as the primary identifier
      const fileId = getFileId(normalizedFile)!;

      // Check if tab already exists
      const existingTabIndex = tabs.findIndex(tab => tab.id === fileId);

      if (existingTabIndex >= 0) {
        // Tab exists, just switch to it
        setActiveTabId(fileId);
        const existingTab = tabs[existingTabIndex];
        setContent(existingTab.content);
        setHasUnsavedChanges(existingTab.isDirty);
      } else {
        // Create new tab
        const newTab: EditorTab = {
          id: fileId,
          name: normalizedFile.name,
          type: normalizedFile.type,
          content: normalizedFile.content || "",
          isDirty: false,
          isActive: true,
          notebookId: normalizedFile.notebookId,
          folderId: normalizedFile.folderId,
        };

        setContent(normalizedFile.content || "");
        setHasUnsavedChanges(false);

        // Add new tab to existing tabs
        setTabs(prevTabs => [...prevTabs, newTab]);
        setActiveTabId(newTab.id);
      }
    }
    // Don't clear tabs when selectedFile is null - keep existing tabs open
  }, [selectedFile, tabs.length]); // Added tabs.length to dependencies

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!hasUnsavedChanges || !selectedFile) return;

    // If file doesn't have a valid ID, we need to create it first
    if (!hasValidFileId(selectedFile)) {
      console.warn('Cannot auto-save file without valid ID. File should be created in MongoDB first.');
      return;
    }

    setIsAutoSaving(true);
    try {
      await updateFile({
        id: getFileIdForApi(selectedFile),
        data: { content }
      });
      setHasUnsavedChanges(false);

      // Update tab dirty state
      setTabs(prev => prev.map(tab =>
        tab.id === activeTabId ? { ...tab, isDirty: false } : tab
      ));
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [hasUnsavedChanges, selectedFile, content, updateFile, activeTabId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasUnsavedChanges && selectedFile) {
        autoSave();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [content, hasUnsavedChanges, autoSave, selectedFile]);

  // Save functionality
  const saveFile = useCallback(async () => {
    if (!selectedFile || !hasUnsavedChanges) return;

    // If file doesn't have a valid ID, we need to create it first
    if (!hasValidFileId(selectedFile)) {
      toast.error('Cannot save file without valid ID. Please create the file first.');
      return;
    }

    try {
      setIsSaving(true);
      await updateFile({
        id: getFileIdForApi(selectedFile),
        data: { content }
      });
      setHasUnsavedChanges(false);

      // Update tab dirty state
      setTabs(prev => prev.map(tab =>
        tab.id === activeTabId ? { ...tab, isDirty: false } : tab
      ));

      toast.success('File saved successfully');
    } catch (error) {
      console.error('Error saving file:', error);
      toast.error('Failed to save file');
    } finally {
      setIsSaving(false);
    }
  }, [selectedFile, hasUnsavedChanges, content, updateFile, activeTabId]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
    
    // Update tab content and dirty state
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, content: newContent, isDirty: true }
        : tab
    ));
  };

  const handleSave = () => {
    saveFile();
  };



  // Tab management
  const handleTabSelect = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      // Save current tab state before switching
      if (activeTabId) {
        setTabs(prev => prev.map(t =>
          t.id === activeTabId
            ? { ...t, content, isDirty: hasUnsavedChanges }
            : t
        ));
      }

      setActiveTabId(tabId);
      setContent(tab.content);
      setHasUnsavedChanges(tab.isDirty);

      // Update file context to reflect the selected tab
      // Only update if it's not a console tab
      if (tab.type !== 'console') {
        setSelectedFileId(tabId);
      }
    }
  };

  const handleTabClose = (tabId: string) => {
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);

    if (tabId === activeTabId) {
      if (newTabs.length > 0) {
        const newActiveTab = newTabs[0];
        setActiveTabId(newActiveTab.id);
        setContent(newActiveTab.content);
        setHasUnsavedChanges(newActiveTab.isDirty);
        setSelectedFileId(newActiveTab.id);
      } else {
        setActiveTabId(null);
        setContent("");
        setHasUnsavedChanges(false);
        clearSelection();
      }
    }
  };

  // Tab navigation functions
  const handleNextTab = () => {
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    handleTabSelect(tabs[nextIndex].id);
  };

  const handlePreviousTab = () => {
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
    const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
    handleTabSelect(tabs[prevIndex].id);
  };

  // Console management functions
  const createConsoleTab = () => {
    const consoleTabId = 'console';
    const existingConsoleTab = tabs.find(tab => tab.id === consoleTabId);
    
    if (existingConsoleTab) {
      // Switch to existing console tab
      handleTabSelect(consoleTabId);
      return;
    }

    // Create new console tab
    const consoleTab: EditorTab = {
      id: consoleTabId,
      name: 'Console',
      type: 'console',
      content: consoleOutput,
      isDirty: false,
      isActive: false,
      notebookId: selectedFile?.notebookId || '',
      folderId: selectedFile?.folderId,
      isReadOnly: true,
    };

    setTabs(prevTabs => [...prevTabs, consoleTab]);
    setActiveTabId(consoleTabId);
  };

  const updateConsoleTab = (output: string) => {
    setConsoleOutput(output);
    
    // Update console tab content if it exists
    setTabs(prev => prev.map(tab =>
      tab.type === 'console'
        ? { ...tab, content: output }
        : tab
    ));
  };

  const clearConsole = () => {
    updateConsoleTab('');
  };

  const resetConsole = () => {
    setIsCodeRunning(false);
    setCurrentSessionId(null);
    setIsWaitingForInput(false);
    setUseInteractiveConsole(false);
    // Don't clear output here - let the execution process handle output updates
  };

  const resetConsoleForNewExecution = () => {
    setIsCodeRunning(false);
    setCurrentSessionId(null);
    setIsWaitingForInput(false);
    setUseInteractiveConsole(false);
    // Keep output clearing separate from state reset
  };

  // Code execution function
  const handleRunCode = async (code: string, fileType: string) => {
    if (!selectedFile) {
      toast.error('No file selected');
      return;
    }

    if (!CodeExecutionService.isSupportedFileType(fileType)) {
      toast.error(`${fileType.toUpperCase()} files are not executable`);
      return;
    }

    // Reset execution environment to ensure clean state
    InteractiveConsoleService.resetExecutionEnvironment();
    resetConsoleForNewExecution();
    setIsCodeRunning(true);

    try {
      // Create or switch to console tab
      createConsoleTab();

      // Check if code might need input and decide console type
      const needsInput = InteractiveConsoleService.codeNeedsInput(code, fileType);
      
      setUseInteractiveConsole(needsInput);

      if (needsInput) {
        // Use interactive execution
        updateConsoleTab('Starting interactive execution...\n');
        
        const sessionId = await InteractiveConsoleService.executeInteractive(
          code,
          fileType,
          (output) => {
            updateConsoleTab(output);
          },
          () => {
            setIsWaitingForInput(true);
            updateConsoleTab(consoleOutput + '\nWaiting for input...');
          },
          () => {
            setIsCodeRunning(false);
            setIsWaitingForInput(false);
            setCurrentSessionId(null);
          }
        );

        if (typeof sessionId === 'string' && sessionId.startsWith('session-')) {
          setCurrentSessionId(sessionId);
          setIsWaitingForInput(true);
        }
      } else {
        // Use regular execution
        updateConsoleTab('Executing code...\n');

        const result = await CodeExecutionService.executeFileWithAutoSave(
          selectedFile,
          content,
          updateFile
        );

        if (result.success) {
          updateConsoleTab(result.output);
          const languageLabel = CodeExecutionService.getLanguageLabel(fileType);
          const timeInfo = result.executionTime ? ` (${result.executionTime}ms)` : '';
          toast.success(`${languageLabel} code executed successfully${timeInfo}`);
        } else {
          const errorOutput = result.error ? `Error: ${result.error}\n` : 'Execution failed\n';
          updateConsoleTab(errorOutput);
          toast.error(result.error || 'Failed to execute code');
        }
      }
    } catch (error) {
      console.error('Code execution error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      updateConsoleTab(`Error: ${errorMessage}`);
      toast.error('Code execution failed');
    } finally {
      if (!useInteractiveConsole) {
        setIsCodeRunning(false);
      }
    }
  };

  // Handle input from interactive console
  const handleConsoleInput = async (input: string) => {
    if (!currentSessionId) {
      toast.error('No active session for input');
      return;
    }

    try {
      const result = await InteractiveConsoleService.sendInput(currentSessionId, input);
      
      if (result.success) {
        updateConsoleTab(consoleOutput + `\n${result.output}`);
        
        if (result.needsMoreInput) {
          setIsWaitingForInput(true);
          updateConsoleTab(consoleOutput + `\n${result.output}` + '\nWaiting for more input...');
        } else {
          // Complete session cleanup
          setIsWaitingForInput(false);
          setIsCodeRunning(false);
          setUseInteractiveConsole(false);
          InteractiveConsoleService.endSession(currentSessionId);
          setCurrentSessionId(null);
          toast.success('Program completed successfully');
        }
      } else {
        // Error cleanup
        updateConsoleTab(consoleOutput + `\nError: ${result.error}`);
        setIsWaitingForInput(false);
        setIsCodeRunning(false);
        setUseInteractiveConsole(false);
        InteractiveConsoleService.endSession(currentSessionId);
        setCurrentSessionId(null);
        toast.error(result.error || 'Failed to process input');
      }
    } catch (error) {
      console.error('Error handling console input:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      updateConsoleTab(consoleOutput + `\nError: ${errorMessage}`);
      
      // Complete error cleanup
      setIsWaitingForInput(false);
      setIsCodeRunning(false);
      setUseInteractiveConsole(false);
      if (currentSessionId) {
        InteractiveConsoleService.endSession(currentSessionId);
      }
      setCurrentSessionId(null);
      toast.error('Failed to process input');
    }
  };

  // Editor commands
  const editorCommands: EditorCommand[] = [
    {
      id: 'save-file',
      label: 'Save File',
      description: 'Save the current file',
      keybinding: 'Ctrl+S',
      category: 'File',
      action: handleSave,
    },
    {
      id: 'next-tab',
      label: 'Next Tab',
      description: 'Switch to the next tab',
      keybinding: 'Ctrl+PageDown',
      category: 'Navigation',
      action: handleNextTab,
    },
    {
      id: 'previous-tab',
      label: 'Previous Tab',
      description: 'Switch to the previous tab',
      keybinding: 'Ctrl+PageUp',
      category: 'Navigation',
      action: handlePreviousTab,
    },
  ];

  // Keyboard shortcut handlers
  const keyboardHandlers = {
    onSave: handleSave,
    onCommandPalette: () => setIsCommandPaletteOpen(true),
    onFind: () => {
      if (editorRef.current) {
        editorRef.current.getAction('actions.find')?.run();
      }
    },
    onReplace: () => {
      if (editorRef.current) {
        editorRef.current.getAction('editor.action.startFindReplaceAction')?.run();
      }
    },
    onNextTab: handleNextTab,
    onPreviousTab: handlePreviousTab,
  };

  useEditorKeyboardShortcuts({
    editor: editorRef.current,
    handlers: keyboardHandlers,
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className="h-full bg-editor-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-editor-background flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!selectedFile) {
    return (
      <div className="h-full bg-editor-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select a file to start editing</p>
        </div>
      </div>
    );
  }

  const fileInfo = getFileInfo(selectedFile.type);
  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <div className="h-full bg-editor-background flex flex-col">
      
      {/* Tabs */}
      {tabs.length > 0 && (
        <EditorTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={handleTabSelect}
          onTabClose={handleTabClose}
        />
      )}

      {/* Run Button - Above editor, below tabs */}
      {activeTab && !['txt', 'md', 'console'].includes(activeTab.type) && (
        <div className="px-4 py-2 bg-card border-b border-border">
          <RunButton
            fileType={activeTab.type}
            fileName={activeTab.name}
            code={content}
            onRun={handleRunCode}
            disabled={isCodeRunning}
          />
        </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab?.type === 'console' ? (
          useInteractiveConsole ? (
            <InteractiveConsole
              output={consoleOutput}
              isRunning={isCodeRunning}
              onClear={clearConsole}
              onInput={handleConsoleInput}
              onReset={resetConsole}
              allowInput={true}
              className="h-full"
            />
          ) : (
            <Console
              output={consoleOutput}
              isRunning={isCodeRunning}
              onClear={clearConsole}
              className="h-full"
            />
          )
        ) : selectedFile.type === 'md' ? (
          <Tabs defaultValue="edit" className="flex-1 flex flex-col">
            <TabsContent value="edit" className="flex-1">
              <AdvancedCodeEditor
                value={content}
                onChange={handleContentChange}
                language={selectedFile.type}
                onCursorPositionChange={setCursorPosition}
                onSelectionChange={setSelection}
                onSave={handleSave}
                settings={editorSettings}
                className="h-full"
              />
            </TabsContent>
            
            <TabsContent value="preview" className="flex-1 p-4">
              <div className="h-full bg-card rounded-lg border p-4 overflow-auto">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-md"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <AdvancedCodeEditor
            value={content}
            onChange={handleContentChange}
            language={selectedFile.type}
            onCursorPositionChange={setCursorPosition}
            onSelectionChange={setSelection}
            onSave={handleSave}
            settings={editorSettings}
            className="h-full"
          />
        )}
      </div>

      {/* Status Bar */}
      {activeTab && (
        <EditorStatusBar
          cursorPosition={cursorPosition}
          selection={selection}
          language={activeTab.type}
          totalLines={content.split('\n').length}
          fileSize={new Blob([content]).size}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      )}

      {/* Command Palette */}
      <EditorCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={editorCommands}
        onCommandExecute={(command) => command.action()}
      />
    </div>
  );
};

export default EnhancedFileEditor;
