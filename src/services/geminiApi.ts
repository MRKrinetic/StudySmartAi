import { GoogleGenerativeAI } from '@google/generative-ai';
import { IndexCacheData, IndexedFile } from '../types/index';
import queryAnalysisService, { QueryAnalysisResult } from './queryAnalysisService';

// Query embedding cache for faster repeated searches
interface QueryCacheEntry {
  query: string;
  embedding: number[];
  timestamp: number;
}

// Simple in-memory cache for query embeddings (5 minute TTL)
const queryEmbeddingCache = new Map<string, QueryCacheEntry>();
const QUERY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Semantic search result interface
export interface SemanticSearchResult {
  fileId: string;
  filePath: string;
  notebook: string;
  fileType: string;
  preview: string;
  similarity: number;
  content?: string;
}

// Initialize the Gemini API client
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error('VITE_GEMINI_API_KEY is not configured. Please add it to your .env file.');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

// Get the Gemini 1.5 Flash model
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface GeminiResponse {
  success: boolean;
  content?: string;
  error?: string;
  contextFiles?: SemanticSearchResult[];
  searchPerformed?: boolean;
  queryAnalysis?: QueryAnalysisResult;
  responseTime?: number;
}

export class GeminiApiError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'GeminiApiError';
  }
}

/**
 * Get cached query embedding if available and not expired
 */
function getCachedQueryEmbedding(query: string): number[] | null {
  const cacheKey = query.toLowerCase().trim();
  const cached = queryEmbeddingCache.get(cacheKey);

  if (!cached) return null;

  // Check if cache entry is expired
  if (Date.now() - cached.timestamp > QUERY_CACHE_TTL) {
    queryEmbeddingCache.delete(cacheKey);
    return null;
  }

  return cached.embedding;
}

/**
 * Cache query embedding for future use
 */
function cacheQueryEmbedding(query: string, embedding: number[]): void {
  const cacheKey = query.toLowerCase().trim();
  queryEmbeddingCache.set(cacheKey, {
    query: cacheKey,
    embedding,
    timestamp: Date.now()
  });

  // Clean up expired entries periodically
  if (queryEmbeddingCache.size > 50) {
    const now = Date.now();
    for (const [key, entry] of queryEmbeddingCache.entries()) {
      if (now - entry.timestamp > QUERY_CACHE_TTL) {
        queryEmbeddingCache.delete(key);
      }
    }
  }
}

/**
 * Fetch file index from API for AI context
 * @returns Promise<IndexCacheData | null> - The file index or null if not available
 */
async function fetchFileIndexForContext(): Promise<IndexCacheData | null> {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    const response = await fetch(`${API_BASE_URL}/index/all-files`);

    if (!response.ok) {
      console.warn('Could not fetch file index for context:', response.statusText);
      return null;
    }

    const data = await response.json();
    if (data.success && data.data) {
      return {
        files: data.data,
        lastUpdated: new Date().toISOString(),
        totalFiles: data.totalFiles || data.data.length
      };
    }

    return null;
  } catch (error) {
    console.warn('Could not fetch file index for context:', error);
    return null;
  }
}

/**
 * Construct enhanced prompt with file context
 * @param userQuery - The user's original query
 * @param fileContext - Optional file context data
 * @returns string - Enhanced prompt with context
 */
function constructGeminiPrompt(userQuery: string, fileContext?: IndexCacheData): string {
  if (!fileContext || !fileContext.files.length) {
    return userQuery;
  }

  // Limit context size to prevent token overflow
  const maxFiles = 50;
  const limitedFiles = fileContext.files.slice(0, maxFiles);

  // Create a summary of the user's files
  const filesSummary = limitedFiles.map(file => ({
    notebook: file.notebook,
    filename: file.filename,
    extension: file.extension,
    preview: file.preview.substring(0, 200) + (file.preview.length > 200 ? '...' : '')
  }));

  const contextPrompt = `
You are an AI assistant for Code Notes Buddy, helping users search and summarize their programming files.

User's File Index (${fileContext.totalFiles} total files, showing ${limitedFiles.length}):
${JSON.stringify(filesSummary, null, 2)}

User Query: "${userQuery}"

Instructions:
- Reference specific files from the index when relevant
- Provide file counts and summaries by notebook/folder
- Mention file extensions and preview content when helpful
- If no relevant files found, suggest creating or organizing files
- Be specific about which files contain relevant information
- Help the user understand their codebase structure
`;

  return contextPrompt;
}

/**
 * Send a message to Gemini API and get a response with file context
 * @param message - The user's message
 * @param context - Optional context about the user's notebooks/code
 * @param includeFileContext - Whether to include file index context
 * @returns Promise with the AI response
 */
export async function sendMessageToGemini(
  message: string,
  context?: string,
  includeFileContext: boolean = true
): Promise<GeminiResponse> {
  try {
    if (!apiKey) {
      throw new GeminiApiError('API key is not configured');
    }

    // Get file context if requested
    let fileContext: IndexCacheData | null = null;
    if (includeFileContext) {
      fileContext = await fetchFileIndexForContext();
    }

    // Prepare the prompt with context
    let prompt = message;

    // Add file context if available
    if (includeFileContext && fileContext) {
      prompt = constructGeminiPrompt(message, fileContext);
    } else if (context) {
      prompt = `Context: ${context}\n\nUser question: ${message}`;
    }

    // Add system instructions to make the AI more helpful for code notes
    const systemPrompt = `You are an AI assistant helping with code notes and programming concepts.
You should provide clear, concise, and helpful responses. When explaining code concepts, use examples when appropriate.
Be encouraging and educational in your responses.

IMPORTANT: Always structure your responses using the following format:
- Use clear headings (##) to organize different sections
- Use bullet points or numbered lists for key information
- When explaining code, use proper code blocks with syntax highlighting
- For file analysis, organize information into logical sections like:
  ## Purpose
  ## Key Components
  ## Main Functions/Classes
  ## Structure
- Present information in a conversational, readable way
- Focus on the actual content and functionality rather than technical metadata

${prompt}`;

    // Generate content using Gemini
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new GeminiApiError('Empty response from Gemini API');
    }

    return {
      success: true,
      content: text
    };

  } catch (error: any) {
    console.error('Gemini API Error:', error);

    // Handle different types of errors
    let errorMessage = 'Failed to get response from AI assistant';

    if (error.name === 'GeminiApiError') {
      errorMessage = error.message;
    } else if (error.message?.includes('API_KEY')) {
      errorMessage = 'Invalid API key. Please check your configuration.';
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      errorMessage = 'API quota exceeded. Please try again later.';
    } else if (error.message?.includes('RATE_LIMIT')) {
      errorMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error.message?.includes('SAFETY')) {
      errorMessage = 'Content was blocked for safety reasons. Please rephrase your question.';
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Send a message to Gemini API with intelligent context inclusion
 * Uses query analysis to determine if semantic search is needed
 * @param message - The user's message
 * @returns Promise with the AI response including file context when needed
 */
export async function sendMessageWithFileContext(message: string): Promise<GeminiResponse> {
  // Use intelligent semantic search with query analysis
  return sendMessageWithSemanticSearch(message, true, 3, 0.7);
}

/**
 * Send a message to Gemini API with optimized performance
 * Completely bypasses ChromaDB for general programming questions
 * @param message - The user's message
 * @returns Promise with the AI response
 */
export async function sendMessageOptimized(message: string): Promise<GeminiResponse> {
  const startTime = Date.now();

  try {
    if (!apiKey) {
      throw new GeminiApiError('API key is not configured');
    }

    // Analyze query to determine if context is needed
    const queryAnalysis = queryAnalysisService.analyzeQueryEnhanced(message);
    console.log(`🧠 Query analysis: ${queryAnalysis.reasoning}`);

    let contextFiles: SemanticSearchResult[] = [];
    let searchPerformed = false;

    // Only perform semantic search if analysis indicates it's absolutely necessary
    if (queryAnalysis.requiresContext && queryAnalysis.confidence > 0.8) {
      try {
        console.log(`🔍 High-confidence context requirement - performing semantic search...`);
        contextFiles = await performSemanticSearch(message, 3, 0.7);
        searchPerformed = true;
        console.log(`📄 Semantic search found ${contextFiles.length} relevant files`);
      } catch (error) {
        console.warn('Semantic search failed, continuing without context:', error);
      }
    } else {
      console.log(`⚡ Using general knowledge - no context retrieval needed`);
    }

    // Construct prompt based on whether we have context
    let prompt: string;
    if (contextFiles.length > 0) {
      prompt = constructSemanticPrompt(message, contextFiles);
    } else {
      // Use the message directly for general programming questions
      prompt = message;
    }

    // Add system instructions optimized for general vs specific queries
    const systemPrompt = queryAnalysis.requiresContext
      ? `You are an AI assistant helping with code notes and programming concepts.
You should provide clear, concise, and helpful responses. When explaining code concepts, use examples when appropriate.
Be encouraging and educational in your responses.

RESPONSE FORMATTING:
- Use clear headings (##) to organize different sections
- Use bullet points or numbered lists for key information
- When explaining code, use proper code blocks with syntax highlighting
- For file analysis, organize information into logical sections like:
  ## Purpose
  ## Key Components
  ## Main Functions/Classes
  ## Structure
- Present information in a conversational, readable way
- Focus on the actual content and functionality rather than technical metadata

${prompt}`
      : `You are an AI assistant helping with programming concepts and general coding questions.
Provide clear, concise, and educational responses. Use examples when appropriate to illustrate concepts.
Be encouraging and focus on helping the user learn and understand programming concepts.

RESPONSE FORMATTING:
- Use clear headings (##) to organize different sections
- Use bullet points or numbered lists for key information
- When explaining code, use proper code blocks with syntax highlighting
- Provide practical examples and best practices
- Keep explanations accessible and educational

User question: ${prompt}`;

    // Generate content using Gemini
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new GeminiApiError('Empty response from Gemini API');
    }

    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Prepare the response object
    const geminiResponse: GeminiResponse = {
      success: true,
      content: text,
      contextFiles,
      searchPerformed,
      queryAnalysis,
      responseTime
    };

    console.log(`✅ Optimized response generated in ${responseTime}ms (search: ${searchPerformed ? 'yes' : 'no'})`);
    return geminiResponse;

  } catch (error: any) {
    console.error('Gemini API Error:', error);

    // Handle different types of errors
    let errorMessage = 'Failed to get response from AI assistant';
    if (error.message?.includes('API_KEY_INVALID')) {
      errorMessage = 'Invalid API key configuration';
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      errorMessage = 'API quota exceeded. Please try again later.';
    } else if (error.message?.includes('SAFETY')) {
      errorMessage = 'Content was blocked by safety filters. Please rephrase your question.';
    } else if (error instanceof GeminiApiError) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      contextFiles: [],
      searchPerformed: false,
      queryAnalysis: undefined,
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Perform semantic search for relevant files
 * @param query - The search query
 * @param maxResults - Maximum number of results to return
 * @param threshold - Similarity threshold for results
 * @returns Promise with semantic search results
 */
async function performSemanticSearch(
  query: string,
  maxResults: number = 5,
  threshold: number = 0.7
): Promise<SemanticSearchResult[]> {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

    const response = await fetch(`${apiBaseUrl}/semantic/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        userId: 'default', // For now, using default user ID
        maxResults,
        threshold
      })
    });

    if (!response.ok) {
      console.warn('Semantic search API request failed:', response.status);
      return [];
    }

    const data = await response.json();

    if (data.success && data.data?.results) {
      return data.data.results;
    }

    return [];
  } catch (error) {
    console.warn('Semantic search failed:', error);
    return [];
  }
}

/**
 * Optimize context files for token limits
 * @param contextFiles - Array of context files
 * @param maxTokens - Maximum tokens to use for context
 * @returns Optimized array of context files
 */
function optimizeContextForTokens(contextFiles: SemanticSearchResult[], maxTokens: number = 4000): SemanticSearchResult[] {
  let totalTokens = 0;
  const optimizedFiles: SemanticSearchResult[] = [];
  const estimatedTokensPerChar = 0.25; // Rough estimate

  // Sort by similarity score (highest first)
  const sortedFiles = [...contextFiles].sort((a, b) => b.similarity - a.similarity);

  for (const file of sortedFiles) {
    const contentLength = file.content?.length || file.preview?.length || 0;
    const estimatedTokens = contentLength * estimatedTokensPerChar;

    if (totalTokens + estimatedTokens <= maxTokens) {
      optimizedFiles.push(file);
      totalTokens += estimatedTokens;
    } else {
      // Try to include a truncated version
      const remainingTokens = maxTokens - totalTokens;
      const maxChars = Math.floor(remainingTokens / estimatedTokensPerChar);

      if (maxChars > 200) { // Only include if we can fit at least 200 characters
        const truncatedFile = {
          ...file,
          content: file.content ? file.content.substring(0, maxChars) + '...[truncated]' : file.preview,
          preview: file.preview.substring(0, Math.min(100, maxChars)) + '...'
        };
        optimizedFiles.push(truncatedFile);
      }
      break;
    }
  }

  console.log(`🔧 Optimized context: ${contextFiles.length} → ${optimizedFiles.length} files, ~${Math.round(totalTokens)} tokens`);
  return optimizedFiles;
}

/**
 * Construct enhanced prompt with semantic search context
 * @param userQuery - The user's original query
 * @param contextFiles - Relevant files from semantic search
 * @returns Enhanced prompt with context
 */
function constructSemanticPrompt(userQuery: string, contextFiles: SemanticSearchResult[]): string {
  if (contextFiles.length === 0) {
    return userQuery;
  }

  // Optimize context files for token limits
  const optimizedFiles = optimizeContextForTokens(contextFiles, 3500); // Leave room for instructions and response

  const contextSummary = optimizedFiles.map((file, index) => {
    const contentPreview = file.content
      ? file.content.substring(0, 800) + (file.content.length > 800 ? '...' : '')
      : file.preview;

    return `File ${index + 1}: ${file.filePath}
Type: ${file.fileType} | Notebook: ${file.notebook} | Match: ${(file.similarity * 100).toFixed(1)}%
Content:
${contentPreview}
---`;
  }).join('\n\n');

  const enhancedPrompt = `You are an AI assistant for Code Notes Buddy, helping users with their programming files and notes.

RELEVANT FILES (${optimizedFiles.length} files found):
${contextSummary}

USER QUERY: "${userQuery}"

INSTRUCTIONS:
- Use the relevant files above to provide context-aware responses
- Reference specific files by their paths when relevant
- Explain code concepts using examples from the user's actual files
- If the files contain relevant code, explain how it works
- Suggest improvements or modifications based on the existing code
- Be specific about which files contain relevant information
- Help the user understand their codebase structure and patterns

Please provide a helpful response based on the user's query and the relevant files found.`;

  return enhancedPrompt;
}



/**
 * Send a message to Gemini API with semantic search enhancement
 * @param message - The user's message
 * @param useSemanticSearch - Whether to use semantic search for context
 * @param maxContextFiles - Maximum number of context files to include
 * @param searchThreshold - Similarity threshold for semantic search
 * @returns Promise with the AI response
 */
export async function sendMessageWithSemanticSearch(
  message: string,
  useSemanticSearch: boolean = true,
  maxContextFiles: number = 3,
  searchThreshold: number = 0.7
): Promise<GeminiResponse> {
  const startTime = Date.now();

  try {
    if (!apiKey) {
      throw new GeminiApiError('API key is not configured');
    }

    // Analyze query to determine if context is needed
    const queryAnalysis = queryAnalysisService.analyzeQueryEnhanced(message);
    console.log(`🧠 Query analysis: ${queryAnalysis.reasoning}`);

    let contextFiles: SemanticSearchResult[] = [];
    let searchPerformed = false;

    // Only perform semantic search if analysis indicates it's needed AND it's enabled
    const shouldPerformSearch = useSemanticSearch && queryAnalysis.requiresContext;

    if (shouldPerformSearch) {
      try {
        console.log(`🔍 Performing semantic search based on query analysis...`);
        contextFiles = await performSemanticSearch(message, maxContextFiles, searchThreshold);
        searchPerformed = true;
        console.log(`📄 Semantic search found ${contextFiles.length} relevant files`);
      } catch (error) {
        console.warn('Semantic search failed, continuing without context:', error);
      }
    } else if (useSemanticSearch && !queryAnalysis.requiresContext) {
      console.log(`⚡ Skipping semantic search - query can be answered with general knowledge`);
    }

    // Construct prompt with or without semantic context
    let prompt: string;
    if (contextFiles.length > 0) {
      prompt = constructSemanticPrompt(message, contextFiles);
    } else {
      // Fallback to original file context method
      const fileContext = await fetchFileIndexForContext();
      if (fileContext) {
        prompt = constructGeminiPrompt(message, fileContext);
      } else {
        prompt = message;
      }
    }



    // Add system instructions
    const systemPrompt = `You are an AI assistant helping with code notes and programming concepts.
You should provide clear, concise, and helpful responses. When explaining code concepts, use examples when appropriate.
Be encouraging and educational in your responses.



RESPONSE FORMATTING:
- Use clear headings (##) to organize different sections
- Use bullet points or numbered lists for key information
- When explaining code, use proper code blocks with syntax highlighting
- For file analysis, organize information into logical sections like:
  ## Purpose
  ## Key Components
  ## Main Functions/Classes
  ## Structure
- Present information in a conversational, readable way
- Focus on the actual content and functionality rather than technical metadata

${prompt}`;

    // Generate content using Gemini
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new GeminiApiError('Empty response from Gemini API');
    }

    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Prepare the response object
    const geminiResponse: GeminiResponse = {
      success: true,
      content: text,
      contextFiles,
      searchPerformed,
      queryAnalysis,
      responseTime
    };

    console.log(`✅ Response generated in ${responseTime}ms (search: ${searchPerformed ? 'yes' : 'no'})`);
    return geminiResponse;

  } catch (error: any) {
    console.error('Gemini API Error:', error);

    // Handle different types of errors
    let errorMessage = 'Failed to get response from AI assistant';
    if (error.message?.includes('API_KEY_INVALID')) {
      errorMessage = 'Invalid API key configuration';
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      errorMessage = 'API quota exceeded. Please try again later.';
    } else if (error.message?.includes('SAFETY')) {
      errorMessage = 'Content was blocked by safety filters. Please rephrase your question.';
    } else if (error instanceof GeminiApiError) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      contextFiles: [],
      searchPerformed: false,
      queryAnalysis: undefined,
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Check if the Gemini API is properly configured
 * @returns boolean indicating if the API is ready to use
 */
export function isGeminiConfigured(): boolean {
  return !!apiKey;
}
