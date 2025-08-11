import { pistonApi } from './pistonApi';
import CodeExecutionService, { CodeExecutionResult } from './codeExecutionService';

export interface InteractiveExecutionSession {
  id: string;
  fileType: string;
  code: string;
  isRunning: boolean;
  isWaitingForInput: boolean;
  inputBuffer: string[];
  outputBuffer: string[];
}

export class InteractiveConsoleService {
  private static sessions = new Map<string, InteractiveExecutionSession>();

  /**
   * Start an interactive execution session
   */
  static async startInteractiveSession(
    sessionId: string,
    code: string,
    fileType: string
  ): Promise<{ success: boolean; output: string; error?: string; needsInput?: boolean }> {
    try {
      // Create session
      const session: InteractiveExecutionSession = {
        id: sessionId,
        fileType,
        code,
        isRunning: true,
        isWaitingForInput: false,
        inputBuffer: [],
        outputBuffer: [],
      };

      this.sessions.set(sessionId, session);

      // Check if the code might need input (simple heuristic)
      const needsInput = this.codeNeedsInput(code, fileType);

      if (needsInput) {
        session.isWaitingForInput = true;
        return {
          success: true,
          output: 'Program started. Waiting for input...',
          needsInput: true,
        };
      }

      // Execute without input first
      const result = await this.executeWithInput(code, fileType, '');
      session.isRunning = false;

      return {
        success: result.success,
        output: result.output,
        error: result.error,
      };
    } catch (error) {
      console.error('Error starting interactive session:', error);
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Send input to an interactive session
   */
  static async sendInput(
    sessionId: string,
    input: string
  ): Promise<{ success: boolean; output: string; error?: string; needsMoreInput?: boolean }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        output: '',
        error: 'Session not found',
      };
    }

    try {
      // Preserve newlines within the input and add to buffer
      session.inputBuffer.push(input);
      session.isWaitingForInput = false;

      // Combine all inputs with newlines, ensuring each input ends with a newline
      const stdin = session.inputBuffer.map(inp => inp.endsWith('\n') ? inp : inp + '\n').join('');

      // Execute with accumulated input
      const result = await this.executeWithInput(session.code, session.fileType, stdin);

      if (result.success) {
        session.outputBuffer.push(result.output);
        
        // Check if program might need more input
        const needsMoreInput = this.outputIndicatesMoreInputNeeded(result.output);
        
        if (needsMoreInput) {
          session.isWaitingForInput = true;
          return {
            success: true,
            output: result.output,
            needsMoreInput: true,
          };
        } else {
          session.isRunning = false;
          return {
            success: true,
            output: result.output,
          };
        }
      } else {
        session.isRunning = false;
        return {
          success: false,
          output: result.output,
          error: result.error,
        };
      }
    } catch (error) {
      console.error('Error sending input to session:', error);
      session.isRunning = false;
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Execute code with stdin input
   */
  private static async executeWithInput(
    code: string,
    fileType: string,
    stdin: string
  ): Promise<CodeExecutionResult> {
    try {
      if (!CodeExecutionService.isSupportedFileType(fileType)) {
        return {
          success: false,
          output: '',
          error: `File type '${fileType}' is not supported for execution`,
        };
      }

      const startTime = Date.now();
      const result = await pistonApi.executeByFileType(code, fileType, stdin);
      const executionTime = Date.now() - startTime;

      const formattedOutput = pistonApi.formatOutput(result);

      return {
        success: true,
        output: formattedOutput,
        executionTime,
      };
    } catch (error) {
      console.error('Error executing code with input:', error);
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if code likely needs input (simple heuristic)
   */
  static codeNeedsInput(code: string, fileType: string): boolean {
    const inputPatterns = {
      // Python
      py: [
        /input\s*\(/,
        /sys\.stdin\.read/,
        /raw_input\s*\(/,
        /sys\.stdin\.readline/,
      ],
      // JavaScript/Node.js
      js: [
        /prompt\s*\(/,
        /readline/,
        /process\.stdin/,
        /require\s*\(\s*['"]readline['"]/,
        /\.question\s*\(/,
      ],
      // C++
      cpp: [
        /cin\s*>>/,
        /scanf\s*\(/,
        /getline\s*\(/,
        /getchar\s*\(/,
        /gets\s*\(/,
      ],
      // C
      c: [
        /scanf\s*\(/,
        /getchar\s*\(/,
        /gets\s*\(/,
        /fgets\s*\(/,
        /getline\s*\(/,
      ],
      // Java
      java: [
        /Scanner\s*\(/,
        /\.next\s*\(/,
        /\.nextLine\s*\(/,
        /\.nextInt\s*\(/,
        /\.nextDouble\s*\(/,
        /System\.in/,
        /BufferedReader/,
        /InputStreamReader/,
      ],
      // Go
      go: [
        /fmt\.Scan/,
        /fmt\.Scanf/,
        /fmt\.Scanln/,
        /bufio\.NewScanner/,
        /os\.Stdin/,
      ],
      // Rust
      rs: [
        /std::io::stdin/,
        /stdin\(\)\.read_line/,
        /io::stdin/,
      ],
      // Ruby
      rb: [
        /gets/,
        /STDIN\.gets/,
        /readline/,
        /STDIN\.readline/,
      ],
      // PHP
      php: [
        /fgets\s*\(\s*STDIN/,
        /readline\s*\(/,
        /stream_get_line/,
      ],
      // Kotlin
      kt: [
        /readLine\s*\(/,
        /Scanner\s*\(/,
        /System\.`in`/,
      ],
      // Swift
      swift: [
        /readLine\s*\(/,
        /FileHandle\.standardInput/,
      ],
      // Scala
      scala: [
        /readLine\s*\(/,
        /StdIn\.readLine/,
        /scala\.io\.StdIn/,
      ],
    };

    const patterns = inputPatterns[fileType as keyof typeof inputPatterns] || [];
    return patterns.some(pattern => pattern.test(code));
  }

  /**
   * Check if output indicates more input is needed
   */
  private static outputIndicatesMoreInputNeeded(output: string): boolean {
    const waitingPatterns = [
      /waiting for input/i,
      /enter.*:/i,
      /input.*:/i,
      /please enter/i,
      /type.*:/i,
    ];

    return waitingPatterns.some(pattern => pattern.test(output));
  }

  /**
   * End an interactive session
   */
  static endSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Clear all sessions (useful for cleanup)
   */
  static clearAllSessions(): void {
    this.sessions.clear();
  }

  /**
   * Reset session state for a clean execution environment
   */
  static resetExecutionEnvironment(): void {
    this.sessions.clear();
  }

  /**
   * Get session status
   */
  static getSessionStatus(sessionId: string): {
    exists: boolean;
    isRunning: boolean;
    isWaitingForInput: boolean;
  } {
    const session = this.sessions.get(sessionId);
    return {
      exists: !!session,
      isRunning: session?.isRunning || false,
      isWaitingForInput: session?.isWaitingForInput || false,
    };
  }

  /**
   * Execute code with interactive support
   */
  static async executeInteractive(
    code: string,
    fileType: string,
    onOutput: (output: string) => void,
    onInputNeeded: () => void,
    onComplete: () => void
  ): Promise<string> {
    const sessionId = `session-${Date.now()}-${Math.random()}`;
    
    try {
      const result = await this.startInteractiveSession(sessionId, code, fileType);
      
      if (result.needsInput) {
        onInputNeeded();
        return sessionId; // Return session ID for continued interaction
      } else {
        onOutput(result.output);
        onComplete();
        this.endSession(sessionId);
        return result.output;
      }
    } catch (error) {
      console.error('Error in interactive execution:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onOutput(`Error: ${errorMessage}`);
      onComplete();
      this.endSession(sessionId);
      return errorMessage;
    }
  }
}

export default InteractiveConsoleService;