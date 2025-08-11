import { useState } from "react";
import {
  FolderPlus,
  FilePlus,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  BookOpen,
  FileText,
  Code,
  Database,
  FileJson,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNotebooks, useFolders, useFiles } from "@/hooks/useNotebooks";
import {
  CreateNotebookDialog,
  CreateFolderDialog,
  CreateFileDialog,
  DeleteConfirmDialog
} from "@/components/dialogs";
import { useFileContext } from "@/contexts/FileContext";
import { api } from "@/services/notebookApi";
import { toast } from "sonner";
import { normalizeFileId } from "@/utils/fileUtils";

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    <span className="ml-2 text-sm text-muted-foreground">Loading notebooks...</span>
  </div>
);

// Error component
const ErrorDisplay = ({ error, onRetry }: { error: Error; onRetry: () => void }) => (
  <div className="p-4">
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="mb-2">
        {error.message || 'Failed to load notebooks'}
      </AlertDescription>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="mt-2"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </Alert>
  </div>
);

const getFileIcon = (type: string) => {
  switch (type) {
    case 'txt': return <FileText className="h-4 w-4 text-blue-500" />;
    case 'md': return <FileText className="h-4 w-4 text-purple-500" />;
    case 'py': return <Code className="h-4 w-4 text-yellow-500" />;
    case 'js': return <Code className="h-4 w-4 text-green-500" />;
    case 'cpp': return <Code className="h-4 w-4 text-blue-600" />;
    case 'json': return <FileJson className="h-4 w-4 text-orange-500" />;
    case 'csv': return <Database className="h-4 w-4 text-teal-500" />;
    default: return <FileText className="h-4 w-4 text-gray-500" />;
  }
};

const NotebookSidebar = () => {
  const { selectedFileId, setSelectedFileId, setSelectedFile, setIsLoading, setError } = useFileContext();

  // Dialog states
  const [createNotebookOpen, setCreateNotebookOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createFileOpen, setCreateFileOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Context for dialogs
  const [dialogContext, setDialogContext] = useState<{
    notebookId?: string;
    folderId?: string;
    deleteType?: 'notebook' | 'folder' | 'file';
    deleteId?: string;
    deleteName?: string;
  }>({});

  // Use the notebooks hook to get data and operations
  const {
    notebooks,
    isLoading,
    error,
    refetch,
    updateNotebook,
    deleteNotebook
  } = useNotebooks();

  // Initialize hooks for folders and files operations
  // We'll use the first notebook's ID as default, or empty string if no notebooks
  const defaultNotebookId = notebooks.length > 0 ? notebooks[0].id : '';
  const {
    createFolder,
    updateFolder,
    deleteFolder,
    isCreating: isFolderCreating,
    isUpdating: isFolderUpdating,
    isDeleting: isFolderDeleting
  } = useFolders(defaultNotebookId);
  const {
    createFile,
    deleteFile,
    isCreating: isFileCreating,
    isDeleting: isFileDeleting
  } = useFiles(defaultNotebookId);

  // Track loading states for UI feedback
  const isAnyOperationLoading = isFolderCreating || isFolderUpdating || isFolderDeleting || isFileCreating || isFileDeleting;

  // Handle notebook expansion toggle
  const toggleNotebook = async (notebookId: string) => {
    const notebook = notebooks.find(nb => nb.id === notebookId);
    if (!notebook) {
      toast.error('Notebook not found');
      return;
    }

    try {
      await updateNotebook({
        id: notebookId,
        data: { isExpanded: !notebook.isExpanded }
      });
    } catch (error) {
      console.error('Failed to toggle notebook:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to toggle notebook');
    }
  };

  // Handle section (folder) expansion toggle
  const toggleSection = async (notebookId: string, sectionId: string) => {
    try {
      // Find the current section to get its current expanded state
      const notebook = notebooks.find(nb => nb.id === notebookId);
      const section = notebook?.sections.find(s => s.id === sectionId);

      if (!section) {
        toast.error('Folder not found');
        return;
      }

      // Use the updateFolder function to toggle the expansion state
      await updateFolder({
        id: sectionId,
        data: { isExpanded: !section.isExpanded }
      });
    } catch (error) {
      console.error('Failed to toggle section:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to toggle folder');
    }
  };

  // Dialog handlers
  const handleCreateNotebook = () => {
    setCreateNotebookOpen(true);
  };

  const handleCreateFolder = (notebookId: string, parentFolderId?: string) => {
    setDialogContext({ notebookId, folderId: parentFolderId });
    setCreateFolderOpen(true);
  };

  const handleCreateFile = (notebookId: string, folderId?: string) => {
    setDialogContext({ notebookId, folderId });
    setCreateFileOpen(true);
  };

  const handleDelete = (type: 'notebook' | 'folder' | 'file', id: string, name: string) => {
    setDialogContext({ deleteType: type, deleteId: id, deleteName: name });
    setDeleteDialogOpen(true);
  };

  const handleFileSelect = async (fileId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedFileId(fileId);

      // Fetch the file data from the API
      const fileData = await api.files.getFile(fileId);

      // Normalize the file to ensure consistent ID fields
      const normalizedFile = normalizeFileId(fileData);

      setSelectedFile(normalizedFile);
      toast.success(`Opened ${normalizedFile.name}`);
    } catch (error) {
      console.error('Error loading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load file';
      setError(errorMessage);
      toast.error(errorMessage);
      // Clear selection on error
      setSelectedFileId(null);
      setSelectedFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!dialogContext.deleteType || !dialogContext.deleteId) return;

    try {
      switch (dialogContext.deleteType) {
        case 'notebook':
          await deleteNotebook(dialogContext.deleteId);
          toast.success('Notebook deleted successfully');
          break;
        case 'folder':
          await deleteFolder(dialogContext.deleteId);
          toast.success('Folder deleted successfully');
          break;
        case 'file':
          await deleteFile(dialogContext.deleteId);
          toast.success('File deleted successfully');
          break;
      }
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete item');
    }
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="w-full h-full bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <h2 className="text-sm font-semibold text-sidebar-foreground">Notebooks</h2>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="w-full h-full bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <h2 className="text-sm font-semibold text-sidebar-foreground">Notebooks</h2>
        </div>
        <ErrorDisplay error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-sidebar-foreground">
            Notebooks
            {isAnyOperationLoading && (
              <Loader2 className="h-3 w-3 ml-2 animate-spin inline" />
            )}
          </h2>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={handleCreateNotebook}
            title="Create new notebook"
            disabled={isAnyOperationLoading}
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notebook Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {notebooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notebooks yet</p>
              <p className="text-xs mb-4">Create your first notebook to get started</p>
              <Button
                size="sm"
                onClick={handleCreateNotebook}
                disabled={isAnyOperationLoading}
                className="mx-auto"
              >
                {isAnyOperationLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FolderPlus className="h-4 w-4 mr-2" />
                )}
                Create Notebook
              </Button>
            </div>
          ) : (
            notebooks.map((notebook) => (
            <div key={notebook.id} className="mb-1">
              {/* Notebook Level */}
              <div className="flex items-center gap-1 p-2 rounded-md hover:bg-sidebar-accent transition-colors group">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => toggleNotebook(notebook.id)}
                  disabled={isAnyOperationLoading}
                >
                  {notebook.isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium flex-1 text-sidebar-foreground">
                  {notebook.name}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isAnyOperationLoading}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleCreateFolder(notebook.id)}
                      disabled={isAnyOperationLoading}
                    >
                      <FolderPlus className="h-4 w-4 mr-2" />
                      New Folder
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleCreateFile(notebook.id)}
                      disabled={isAnyOperationLoading}
                    >
                      <FilePlus className="h-4 w-4 mr-2" />
                      New File
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete('notebook', notebook.id, notebook.name)}
                      className="text-destructive"
                      disabled={isAnyOperationLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Notebook
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Sections */}
              {notebook.isExpanded && (
                <div className="ml-4">
                  {notebook.sections.map((section) => (
                    <div key={section.id} className="mb-1">
                      {/* Section Level */}
                      <div className="flex items-center gap-1 p-2 rounded-md hover:bg-sidebar-accent transition-colors group">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => toggleSection(notebook.id, section.id)}
                          disabled={isAnyOperationLoading}
                        >
                          {section.isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </Button>
                        <span className="text-sm flex-1 text-sidebar-foreground">
                          {section.name}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              disabled={isAnyOperationLoading}
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleCreateFile(notebook.id, section.id)}
                              disabled={isAnyOperationLoading}
                            >
                              <FilePlus className="h-4 w-4 mr-2" />
                              New File
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete('folder', section.id, section.name)}
                              className="text-destructive"
                              disabled={isAnyOperationLoading}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Folder
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Files */}
                      {section.isExpanded && (
                        <div className="ml-4">
                          {section.files.map((file) => (
                            <div
                              key={file.id}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-md transition-colors cursor-pointer group",
                                selectedFileId === file.id
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                  : "hover:bg-sidebar-accent"
                              )}
                              onClick={() => handleFileSelect(file.id)}
                            >
                              {getFileIcon(file.type)}
                              <span className="text-sm flex-1">
                                {file.name}
                              </span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                    disabled={isAnyOperationLoading}
                                  >
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleDelete('file', file.id, file.name)}
                                    className="text-destructive"
                                    disabled={isAnyOperationLoading}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete File
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
          )}
        </div>
      </ScrollArea>

      {/* Dialogs */}
      <CreateNotebookDialog
        open={createNotebookOpen}
        onOpenChange={setCreateNotebookOpen}
      />

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        notebookId={dialogContext.notebookId || ''}
        parentFolderId={dialogContext.folderId}
      />

      <CreateFileDialog
        open={createFileOpen}
        onOpenChange={setCreateFileOpen}
        notebookId={dialogContext.notebookId || ''}
        folderId={dialogContext.folderId}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Delete ${dialogContext.deleteType || 'item'}`}
        description={`Are you sure you want to delete "${dialogContext.deleteName}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default NotebookSidebar;