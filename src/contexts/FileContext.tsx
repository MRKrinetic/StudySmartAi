import React, { createContext, useContext, useState, ReactNode } from 'react';
import { IFile } from '@/types';

interface FileContextType {
  selectedFileId: string | null;
  selectedFile: IFile | null;
  isLoading: boolean;
  error: string | null;
  setSelectedFileId: (fileId: string | null) => void;
  setSelectedFile: (file: IFile | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearSelection: () => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const useFileContext = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFileContext must be used within a FileProvider');
  }
  return context;
};

interface FileProviderProps {
  children: ReactNode;
}

export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<IFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearSelection = () => {
    setSelectedFileId(null);
    setSelectedFile(null);
    setError(null);
  };

  const value: FileContextType = {
    selectedFileId,
    selectedFile,
    isLoading,
    error,
    setSelectedFileId,
    setSelectedFile,
    setIsLoading,
    setError,
    clearSelection,
  };

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
};
