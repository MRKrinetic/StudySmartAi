import fs from 'fs/promises';
import path from 'path';
import { File } from '../models';

export interface ProcessedFileContent {
  fileId: string;
  fileName: string;
  fileType: string;
  content: string;
  preview: string;
  wordCount: number;
  lineCount: number;
  extractedSections?: {
    title: string;
    content: string;
    type: 'heading' | 'code' | 'paragraph' | 'list';
  }[];
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileSize?: number;
  fileType?: string;
}

export class FileProcessingService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly SUPPORTED_EXTENSIONS = [
    '.txt', '.md', '.py', '.js', '.ts', '.jsx', '.tsx', 
    '.cpp', '.c', '.h', '.hpp', '.java', '.cs', '.php',
    '.rb', '.go', '.rs', '.swift', '.kt', '.scala',
    '.json', '.xml', '.yaml', '.yml', '.csv', '.sql',
    '.html', '.css', '.scss', '.less'
  ];

  /**
   * Validate uploaded file
   */
  static async validateFile(filePath: string): Promise<FileValidationResult> {
    try {
      const stats = await fs.stat(filePath);
      const fileSize = stats.size;
      const fileExtension = path.extname(filePath).toLowerCase();

      if (fileSize > this.MAX_FILE_SIZE) {
        return {
          isValid: false,
          error: `File size (${Math.round(fileSize / 1024 / 1024)}MB) exceeds maximum allowed size (10MB)`,
          fileSize,
          fileType: fileExtension
        };
      }

      if (!this.SUPPORTED_EXTENSIONS.includes(fileExtension)) {
        return {
          isValid: false,
          error: `File type '${fileExtension}' is not supported. Supported types: ${this.SUPPORTED_EXTENSIONS.join(', ')}`,
          fileSize,
          fileType: fileExtension
        };
      }

      return {
        isValid: true,
        fileSize,
        fileType: fileExtension
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Failed to access file: ${(error as Error).message}`
      };
    }
  }

  /**
   * Process file from database by ID
   */
  static async processFileById(fileId: string): Promise<ProcessedFileContent> {
    try {
      const file = await File.findById(fileId);
      if (!file) {
        throw new Error(`File with ID ${fileId} not found`);
      }

      return this.processFileContent(
        file._id.toString(),
        file.name,
        file.type,
        file.content
      );
    } catch (error) {
      throw new Error(`Failed to process file: ${(error as Error).message}`);
    }
  }

  /**
   * Process multiple files by IDs
   */
  static async processMultipleFiles(fileIds: string[]): Promise<ProcessedFileContent[]> {
    const results: ProcessedFileContent[] = [];
    
    for (const fileId of fileIds) {
      try {
        const processed = await this.processFileById(fileId);
        results.push(processed);
      } catch (error) {
        console.error(`Failed to process file ${fileId}:`, error);
        // Continue processing other files
      }
    }

    return results;
  }

  /**
   * Process file content directly
   */
  static async processFileContent(
    fileId: string,
    fileName: string,
    fileType: string,
    content: string
  ): Promise<ProcessedFileContent> {
    const wordCount = this.countWords(content);
    const lineCount = this.countLines(content);
    const preview = this.generatePreview(content);
    const extractedSections = this.extractSections(content, fileType);

    return {
      fileId,
      fileName,
      fileType,
      content,
      preview,
      wordCount,
      lineCount,
      extractedSections
    };
  }

  /**
   * Extract structured sections from content based on file type
   */
  private static extractSections(content: string, fileType: string) {
    const sections: ProcessedFileContent['extractedSections'] = [];

    switch (fileType.toLowerCase()) {
      case 'md':
        return this.extractMarkdownSections(content);
      case 'py':
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return this.extractCodeSections(content);
      case 'txt':
        return this.extractTextSections(content);
      default:
        return this.extractGenericSections(content);
    }
  }

  /**
   * Extract sections from Markdown content
   */
  private static extractMarkdownSections(content: string) {
    const sections: ProcessedFileContent['extractedSections'] = [];
    const lines = content.split('\n');
    let currentSection: { title: string; content: string; type: any } | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for headings
      if (trimmedLine.startsWith('#')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: trimmedLine.replace(/^#+\s*/, ''),
          content: '',
          type: 'heading'
        };
      }
      // Check for code blocks
      else if (trimmedLine.startsWith('```')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: 'Code Block',
          content: line,
          type: 'code'
        };
      }
      // Add content to current section
      else if (currentSection) {
        currentSection.content += line + '\n';
      }
      // Create paragraph section for content without heading
      else if (trimmedLine.length > 0) {
        sections.push({
          title: 'Content',
          content: line,
          type: 'paragraph'
        });
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Extract sections from code files
   */
  private static extractCodeSections(content: string) {
    const sections: ProcessedFileContent['extractedSections'] = [];
    const lines = content.split('\n');
    let currentSection: { title: string; content: string; type: any } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Check for function/class definitions
      if (this.isCodeDefinition(trimmedLine)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: this.extractCodeTitle(trimmedLine),
          content: line + '\n',
          type: 'code'
        };
      }
      // Add content to current section
      else if (currentSection) {
        currentSection.content += line + '\n';
        
        // End section on empty line or new definition
        if (trimmedLine === '' && i < lines.length - 1) {
          const nextLine = lines[i + 1]?.trim();
          if (nextLine && this.isCodeDefinition(nextLine)) {
            sections.push(currentSection);
            currentSection = null;
          }
        }
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Extract sections from plain text
   */
  private static extractTextSections(content: string) {
    const sections: ProcessedFileContent['extractedSections'] = [];
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);

    paragraphs.forEach((paragraph, index) => {
      sections.push({
        title: `Paragraph ${index + 1}`,
        content: paragraph.trim(),
        type: 'paragraph'
      });
    });

    return sections;
  }

  /**
   * Extract generic sections
   */
  private static extractGenericSections(content: string) {
    const sections: ProcessedFileContent['extractedSections'] = [];
    const lines = content.split('\n');
    const chunkSize = 10; // Group lines into chunks

    for (let i = 0; i < lines.length; i += chunkSize) {
      const chunk = lines.slice(i, i + chunkSize).join('\n').trim();
      if (chunk.length > 0) {
        sections.push({
          title: `Section ${Math.floor(i / chunkSize) + 1}`,
          content: chunk,
          type: 'paragraph'
        });
      }
    }

    return sections;
  }

  /**
   * Check if line is a code definition (function, class, etc.)
   */
  private static isCodeDefinition(line: string): boolean {
    const patterns = [
      /^(function|const|let|var)\s+\w+/,  // JavaScript/TypeScript
      /^(def|class)\s+\w+/,               // Python
      /^(public|private|protected)?\s*(static)?\s*(class|interface|function)/,  // General OOP
      /^(export\s+)?(default\s+)?(function|class|interface|const|let)/  // ES6 exports
    ];

    return patterns.some(pattern => pattern.test(line));
  }

  /**
   * Extract title from code definition line
   */
  private static extractCodeTitle(line: string): string {
    const match = line.match(/(?:function|class|interface|const|let|var|def)\s+(\w+)/);
    return match ? match[1] : 'Code Block';
  }

  /**
   * Count words in content
   */
  private static countWords(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Count lines in content
   */
  private static countLines(content: string): number {
    return content.split('\n').length;
  }

  /**
   * Generate preview of content (first 200 characters)
   */
  private static generatePreview(content: string): string {
    const preview = content.trim().substring(0, 200);
    return preview.length < content.trim().length ? preview + '...' : preview;
  }
}
