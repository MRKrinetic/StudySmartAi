interface PistonExecuteRequest {
  language: string;
  version: string;
  files: Array<{
    name?: string;
    content: string;
  }>;
  stdin?: string;
  args?: string[];
  compile_timeout?: number;
  run_timeout?: number;
}

interface PistonExecuteResponse {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
  compile?: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
}

interface PistonLanguage {
  language: string;
  version: string;
  aliases: string[];
}

class PistonApiService {
  private readonly baseUrl = 'https://emkc.org/api/v2/piston';

  /**
   * Get available languages from Piston API
   */
  async getLanguages(): Promise<PistonLanguage[]> {
    try {
      const response = await fetch(`${this.baseUrl}/runtimes`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Piston languages:', error);
      throw new Error('Failed to fetch available languages');
    }
  }

  /**
   * Execute code using Piston API
   */
  async executeCode(request: PistonExecuteRequest): Promise<PistonExecuteResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error executing code:', error);
      throw new Error('Failed to execute code');
    }
  }

  /**
   * Execute Python code specifically
   */
  async executePython(code: string, stdin?: string): Promise<PistonExecuteResponse> {
    return this.executeCode({
      language: 'python',
      version: '3.10.0',
      files: [
        {
          name: 'main.py',
          content: code,
        },
      ],
      stdin,
      compile_timeout: 10000,
      run_timeout: 3000,
    });
  }

  /**
   * Get language configuration for a file type
   */
  getLanguageConfig(fileType: string): { language: string; version: string } | null {
    const languageMap: Record<string, { language: string; version: string }> = {
      // Python
      py: { language: 'python', version: '3.10.0' },
      // JavaScript/Node.js
      js: { language: 'javascript', version: '18.15.0' },
      // C++
      cpp: { language: 'cpp', version: '10.2.0' },
      // C
      c: { language: 'c', version: '10.2.0' },
      // Java
      java: { language: 'java', version: '15.0.2' },
      // Go
      go: { language: 'go', version: '1.16.2' },
      // Rust
      rs: { language: 'rust', version: '1.68.2' },
      // Ruby
      rb: { language: 'ruby', version: '3.0.1' },
      // PHP
      php: { language: 'php', version: '8.2.3' },
      // Kotlin
      kt: { language: 'kotlin', version: '1.8.20' },
      // Swift
      swift: { language: 'swift', version: '5.3.3' },
      // Scala
      scala: { language: 'scala', version: '3.2.2' },
      // TypeScript
      ts: { language: 'typescript', version: '5.0.3' },
      // C#
      cs: { language: 'csharp', version: '6.12.0' },
      // Perl
      pl: { language: 'perl', version: '5.36.0' },
      // Lua
      lua: { language: 'lua', version: '5.4.4' },
      // R
      r: { language: 'r', version: '4.1.1' },
      // Bash
      sh: { language: 'bash', version: '5.2.0' },
    };

    return languageMap[fileType] || null;
  }

  /**
   * Execute code based on file type
   */
  async executeByFileType(code: string, fileType: string, stdin?: string): Promise<PistonExecuteResponse> {
    const config = this.getLanguageConfig(fileType);
    if (!config) {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    return this.executeCode({
      language: config.language,
      version: config.version,
      files: [
        {
          name: `main.${fileType}`,
          content: code,
        },
      ],
      stdin,
      compile_timeout: 10000,
      run_timeout: 3000,
    });
  }

  /**
   * Format execution output for display
   */
  formatOutput(response: PistonExecuteResponse): string {
    let output = '';

    // Add compile output if present
    if (response.compile) {
      if (response.compile.stdout) {
        output += `Compile Output:\n${response.compile.stdout}\n\n`;
      }
      if (response.compile.stderr) {
        output += `Compile Errors:\n${response.compile.stderr}\n\n`;
      }
    }

    // Add run output
    if (response.run.stdout) {
      output += `Output:\n${response.run.stdout}\n`;
    }
    if (response.run.stderr) {
      output += `Errors:\n${response.run.stderr}\n`;
    }

    // Add exit code if non-zero
    if (response.run.code !== 0) {
      output += `\nExit code: ${response.run.code}`;
    }

    return output || 'No output';
  }
}

export const pistonApi = new PistonApiService();
export type { PistonExecuteRequest, PistonExecuteResponse, PistonLanguage };