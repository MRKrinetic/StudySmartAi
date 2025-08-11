import { FileIndexResponse, IndexedFile } from '../types/index';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Custom error class for Index API errors
export class IndexApiError extends Error {
  constructor(message: string, public status?: number, public originalError?: any) {
    super(message);
    this.name = 'IndexApiError';
  }
}

// Generic API request function with error handling
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
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
      throw new IndexApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data: T = await response.json();
    return data;
  } catch (error) {
    if (error instanceof IndexApiError) {
      throw error;
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new IndexApiError('Network error: Unable to connect to server');
    }
    
    throw new IndexApiError('An unexpected error occurred', undefined, error);
  }
}

/**
 * Fetch all files for AI indexing
 * @returns Promise<FileIndexResponse> - Response containing indexed files
 */
export const fetchAllFilesForIndexing = async (): Promise<FileIndexResponse> => {
  try {
    console.log('🔍 Fetching all files for AI indexing...');
    
    const response = await apiRequest<FileIndexResponse>('/index/all-files', {
      method: 'GET'
    });

    console.log(`✅ Successfully fetched ${response.data?.length || 0} files for indexing`);
    return response;
  } catch (error) {
    console.error('❌ Error fetching files for indexing:', error);
    throw error;
  }
};

/**
 * Fetch indexing statistics
 * @returns Promise<any> - Response containing indexing statistics
 */
export const fetchIndexingStats = async (): Promise<any> => {
  try {
    console.log('📊 Fetching indexing statistics...');
    
    const response = await apiRequest<any>('/index/stats', {
      method: 'GET'
    });

    console.log('✅ Successfully fetched indexing statistics');
    return response;
  } catch (error) {
    console.error('❌ Error fetching indexing statistics:', error);
    throw error;
  }
};

/**
 * Sync files with AI index (alias for fetchAllFilesForIndexing)
 * @returns Promise<FileIndexResponse> - Response containing indexed files
 */
export const syncFilesWithAI = async (): Promise<FileIndexResponse> => {
  return fetchAllFilesForIndexing();
};

// Export all functions
export const indexApi = {
  fetchAllFilesForIndexing,
  fetchIndexingStats,
  syncFilesWithAI
};

export default indexApi;
