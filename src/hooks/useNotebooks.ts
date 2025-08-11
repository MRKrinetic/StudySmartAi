import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, NotebookApiError } from '../services/notebookApi';
import { NotebookTreeData, INotebook, IFolder, IFile } from '../types/index';

// Query keys for React Query
export const QUERY_KEYS = {
  notebooks: ['notebooks'] as const,
  folders: (notebookId: string) => ['folders', notebookId] as const,
  files: (notebookId: string, folderId?: string) => ['files', notebookId, folderId] as const,
  file: (id: string) => ['file', id] as const,
};

// Hook for managing notebooks
export const useNotebooks = () => {
  const queryClient = useQueryClient();

  // Fetch all notebooks
  const {
    data: notebookData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.notebooks,
    queryFn: api.notebooks.getNotebooks,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof NotebookApiError && error.status && error.status >= 400 && error.status < 500) {
        return false;
      }
      return failureCount < 3;
    }
  });

  // Create notebook mutation
  const createNotebookMutation = useMutation({
    mutationFn: api.notebooks.createNotebook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notebooks });
    },
  });

  // Update notebook mutation
  const updateNotebookMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<INotebook> }) =>
      api.notebooks.updateNotebook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notebooks });
    },
  });

  // Delete notebook mutation
  const deleteNotebookMutation = useMutation({
    mutationFn: api.notebooks.deleteNotebook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notebooks });
    },
  });

  return {
    notebooks: notebookData?.notebooks || [],
    isLoading,
    error: error as NotebookApiError | null,
    refetch,
    createNotebook: createNotebookMutation.mutateAsync,
    updateNotebook: updateNotebookMutation.mutateAsync,
    deleteNotebook: deleteNotebookMutation.mutateAsync,
    isCreating: createNotebookMutation.isPending,
    isUpdating: updateNotebookMutation.isPending,
    isDeleting: deleteNotebookMutation.isPending,
  };
};

// Hook for managing folders
export const useFolders = (notebookId: string) => {
  const queryClient = useQueryClient();

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: api.folders.createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notebooks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.folders(notebookId) });
    },
  });

  // Update folder mutation
  const updateFolderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IFolder> }) =>
      api.folders.updateFolder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notebooks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.folders(notebookId) });
    },
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: api.folders.deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notebooks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.folders(notebookId) });
    },
  });

  return {
    createFolder: createFolderMutation.mutateAsync,
    updateFolder: updateFolderMutation.mutateAsync,
    deleteFolder: deleteFolderMutation.mutateAsync,
    isCreating: createFolderMutation.isPending,
    isUpdating: updateFolderMutation.isPending,
    isDeleting: deleteFolderMutation.isPending,
  };
};

// Hook for managing files
export const useFiles = (notebookId: string) => {
  const queryClient = useQueryClient();

  // Get single file
  const useFile = (fileId: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.file(fileId),
      queryFn: () => api.files.getFile(fileId),
      enabled: !!fileId,
    });
  };

  // Create file mutation
  const createFileMutation = useMutation({
    mutationFn: api.files.createFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notebooks });
    },
  });

  // Update file mutation
  const updateFileMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IFile> }) =>
      api.files.updateFile(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notebooks });
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: api.files.deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notebooks });
    },
  });

  return {
    useFile,
    createFile: createFileMutation.mutateAsync,
    updateFile: updateFileMutation.mutateAsync,
    deleteFile: deleteFileMutation.mutateAsync,
    isCreating: createFileMutation.isPending,
    isUpdating: updateFileMutation.isPending,
    isDeleting: deleteFileMutation.isPending,
  };
};

// Hook for error handling
export const useNotebookError = () => {
  const [error, setError] = useState<NotebookApiError | null>(null);

  const handleError = useCallback((error: unknown) => {
    if (error instanceof NotebookApiError) {
      setError(error);
    } else if (error instanceof Error) {
      setError(new NotebookApiError(error.message));
    } else {
      setError(new NotebookApiError('An unknown error occurred'));
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
    hasError: !!error,
  };
};
