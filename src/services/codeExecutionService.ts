import { pistonApi } from './pistonApi';
import { api } from './notebookApi';
import { IFile } from '../types';
import { getFileIdForApi, hasValidFileId } from '../utils/fileUtils';

export interface CodeExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime?: number;
}

export class CodeExecutionService {
  /**
   * Execute code from a file stored in MongoDB
   */
  static async executeFileById(fileId: string): Promise<CodeExecutionResult> {
    try {
      // Fetch the file content from MongoDB using the dedicated endpoint
      const fileContent = await api.files.getFileContent(fileId);

      if (!fileContent.content || !fileContent.content.trim()) {
        return {
          success: false,
          output: '',
          error: 'No code to execute - file is empty'
        };
      }

      // Check if file type is supported
      if (!this.isSupportedFileType(fileContent.type)) {
        return {
          success: false,
          output: '',
          error: `File type '${fileContent.type}' is not supported for execution`
        };
      }

      // Execute the code using Piston API
      const startTime = Date.now();
      const result = await pistonApi.executeByFileType(fileContent.content, fileContent.type);
      const executionTime = Date.now() - startTime;

      // Format the output
      const formattedOutput = pistonApi.formatOutput(result);

      return {
        success: true,
        output: formattedOutput,
        executionTime
      };
    } catch (error) {
      console.error('Error executing file:', error);
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Execute code directly (for backward compatibility)
   */
  static async executeCode(code: string, fileType: string): Promise<CodeExecutionResult> {
    try {
      if (!code.trim()) {
        return {
          success: false,
          output: '',
          error: 'No code to execute'
        };
      }

      const startTime = Date.now();
      const result = await pistonApi.executeByFileType(code, fileType);
      const executionTime = Date.now() - startTime;

      const formattedOutput = pistonApi.formatOutput(result);

      return {
        success: true,
        output: formattedOutput,
        executionTime
      };
    } catch (error) {
      console.error('Error executing code:', error);
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Execute code from a file object with auto-save
   */
  static async executeFileWithAutoSave(
    file: IFile,
    currentContent: string,
    updateFile: (params: { id: string; data: Partial<IFile> }) => Promise<IFile>
  ): Promise<CodeExecutionResult> {
    try {
      // Check if file has a valid ID
      if (!hasValidFileId(file)) {
        return {
          success: false,
          output: '',
          error: 'File does not have a valid ID. Please save the file first.'
        };
      }

      const fileId = getFileIdForApi(file);

      // If content has changed, save it first
      if (file.content !== currentContent) {
        console.log('Auto-saving file before execution...');
        await updateFile({
          id: fileId,
          data: { content: currentContent }
        });
      }

      // Execute using the file ID to ensure we're using the latest saved content
      return await this.executeFileById(fileId);
    } catch (error) {
      console.error('Error executing file with auto-save:', error);
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check if a file type is supported for execution
   */
  static isSupportedFileType(fileType: string): boolean {
    const supportedTypes = [
      'py', 'js', 'cpp', 'c', 'java', 'go', 'rs', 'rb', 'php',
      'kt', 'swift', 'scala', 'ts', 'cs', 'pl', 'lua', 'r', 'sh'
    ];
    return supportedTypes.includes(fileType);
  }

  /**
   * Get execution language label
   */
  static getLanguageLabel(fileType: string): string {
    const labels: Record<string, string> = {
      py: 'Python',
      js: 'JavaScript',
      cpp: 'C++',
      c: 'C',
      java: 'Java',
      go: 'Go',
      rs: 'Rust',
      rb: 'Ruby',
      php: 'PHP',
      kt: 'Kotlin',
      swift: 'Swift',
      scala: 'Scala',
      ts: 'TypeScript',
      cs: 'C#',
      pl: 'Perl',
      lua: 'Lua',
      r: 'R',
      sh: 'Bash',
    };
    return labels[fileType] || fileType.toUpperCase();
  }
}

export default CodeExecutionService;
