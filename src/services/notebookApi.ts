import { 
  ApiResponse, 
  NotebookTreeData, 
  INotebook, 
  IFolder, 
  IFile,
  DatabaseError 
} from '../types/index';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Custom error class for API errors
export class NotebookApiError extends Error {
  constructor(message: string, public status?: number, public originalError?: any) {
    super(message);
    this.name = 'NotebookApiError';
  }
}

// Generic API request function with error handling
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new NotebookApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data: ApiResponse<T> = await response.json();
    return data;
  } catch (error) {
    if (error instanceof NotebookApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new NotebookApiError(
      'Network error or server unavailable',
      0,
      error
    );
  }
}

// Notebook API functions
export const notebookApi = {
  // Get all notebooks with their structure
  async getNotebooks(): Promise<NotebookTreeData> {
    const response = await apiRequest<NotebookTreeData>('/notebooks');
    if (!response.success || !response.data) {
      throw new NotebookApiError('Failed to fetch notebooks');
    }
    return response.data;
  },

  // Create a new notebook
  async createNotebook(data: { name: string; description?: string }): Promise<INotebook> {
    const response = await apiRequest<INotebook>('/notebooks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.success || !response.data) {
      throw new NotebookApiError('Failed to create notebook');
    }
    return response.data;
  },

  // Update a notebook
  async updateNotebook(id: string, data: Partial<INotebook>): Promise<INotebook> {
    const response = await apiRequest<INotebook>(`/notebooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.success || !response.data) {
      throw new NotebookApiError('Failed to update notebook');
    }
    return response.data;
  },

  // Delete a notebook
  async deleteNotebook(id: string): Promise<void> {
    const response = await apiRequest<null>(`/notebooks/${id}`, {
      method: 'DELETE',
    });
    if (!response.success) {
      throw new NotebookApiError('Failed to delete notebook');
    }
  },
};

// Folder API functions
export const folderApi = {
  // Get folders for a notebook
  async getFolders(notebookId: string): Promise<IFolder[]> {
    const response = await apiRequest<IFolder[]>(`/folders/${notebookId}`);
    if (!response.success || !response.data) {
      throw new NotebookApiError('Failed to fetch folders');
    }
    return response.data;
  },

  // Create a new folder
  async createFolder(data: {
    name: string;
    notebookId: string;
    parentFolderId?: string
  }): Promise<IFolder> {
    // Clean the data to remove undefined parentFolderId
    const cleanData = { ...data };
    if (cleanData.parentFolderId === undefined) {
      delete cleanData.parentFolderId;
    }
    
    const response = await apiRequest<IFolder>('/folders', {
      method: 'POST',
      body: JSON.stringify(cleanData),
    });
    if (!response.success || !response.data) {
      throw new NotebookApiError('Failed to create folder');
    }
    return response.data;
  },

  // Update a folder
  async updateFolder(id: string, data: Partial<IFolder>): Promise<IFolder> {
    const response = await apiRequest<IFolder>(`/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.success || !response.data) {
      throw new NotebookApiError('Failed to update folder');
    }
    return response.data;
  },

  // Delete a folder
  async deleteFolder(id: string): Promise<void> {
    const response = await apiRequest<null>(`/folders/${id}`, {
      method: 'DELETE',
    });
    if (!response.success) {
      throw new NotebookApiError('Failed to delete folder');
    }
  },
};

// File API functions
export const fileApi = {
  // Get files for a notebook/folder
  async getFiles(notebookId: string, folderId?: string): Promise<IFile[]> {
    const queryParam = folderId ? `?folderId=${folderId}` : '';
    const response = await apiRequest<IFile[]>(`/files/notebook/${notebookId}${queryParam}`);
    if (!response.success || !response.data) {
      throw new NotebookApiError('Failed to fetch files');
    }
    return response.data;
  },

  // Get a single file
  async getFile(id: string): Promise<IFile> {
    const response = await apiRequest<IFile>(`/files/single/${id}`);
    if (!response.success || !response.data) {
      throw new NotebookApiError('Failed to fetch file');
    }
    return response.data;
  },

  // Create a new file
  async createFile(data: {
    name: string;
    content?: string;
    type: 'txt' | 'md' | 'py' | 'js' | 'cpp' | 'json' | 'csv';
    notebookId: string;
    folderId?: string
  }): Promise<IFile> {
    // Clean the data to remove undefined, null, or empty folderId
    const cleanData = { ...data };
    if (cleanData.folderId === undefined || cleanData.folderId === null || cleanData.folderId === '') {
      delete cleanData.folderId;
    }
    
    const response = await apiRequest<IFile>('/files', {
      method: 'POST',
      body: JSON.stringify(cleanData),
    });
    if (!response.success || !response.data) {
      throw new NotebookApiError('Failed to create file');
    }
    return response.data;
  },

  // Update a file
  async updateFile(id: string, data: Partial<IFile>): Promise<IFile> {
    const response = await apiRequest<IFile>(`/files/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.success || !response.data) {
      throw new NotebookApiError('Failed to update file');
    }
    return response.data;
  },

  // Delete a file
  async deleteFile(id: string): Promise<void> {
    const response = await apiRequest<null>(`/files/${id}`, {
      method: 'DELETE',
    });
    if (!response.success) {
      throw new NotebookApiError('Failed to delete file');
    }
  },

  // Get file content for execution
  async getFileContent(id: string): Promise<{
    id: string;
    name: string;
    type: string;
    content: string;
    size: number;
  }> {
    const response = await apiRequest<{
      id: string;
      name: string;
      type: string;
      content: string;
      size: number;
    }>(`/files/${id}/content`);
    if (!response.success || !response.data) {
      throw new NotebookApiError('Failed to fetch file content');
    }
    return response.data;
  },
};

// Combined API object for easier imports
export const api = {
  notebooks: notebookApi,
  folders: folderApi,
  files: fileApi,
};
