import { IFile } from '@/types';

/**
 * Get the file ID consistently, handling both _id and id fields
 * This ensures compatibility between backend responses and frontend expectations
 */
export function getFileId(file: IFile): string | undefined {
  // Prefer id (from API response) over _id (MongoDB field)
  return file.id || file._id;
}

/**
 * Check if a file has a valid ID
 */
export function hasValidFileId(file: IFile): boolean {
  const fileId = getFileId(file);
  return !!fileId && fileId.length > 0;
}

/**
 * Ensure file has a consistent ID field for frontend use
 * This normalizes the file object to always have both id and _id
 */
export function normalizeFileId(file: IFile): IFile {
  const fileId = getFileId(file);
  return {
    ...file,
    id: fileId,
    _id: fileId
  };
}

/**
 * Get file ID for API calls (always use the primary ID)
 */
export function getFileIdForApi(file: IFile): string {
  const fileId = getFileId(file);
  if (!fileId) {
    throw new Error('File does not have a valid ID');
  }
  return fileId;
}
