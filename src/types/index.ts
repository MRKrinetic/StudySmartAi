// MongoDB Document Interfaces
export interface INotebook {
  _id?: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  isExpanded?: boolean;
}

export interface IFolder {
  _id?: string;
  name: string;
  notebookId: string;
  parentFolderId?: string;
  createdAt: Date;
  updatedAt: Date;
  isExpanded?: boolean;
}

export interface IFile {
  _id?: string; // Keep for backward compatibility
  id?: string;  // Primary ID field returned by API
  name: string;
  content: string;
  type: 'txt' | 'md' | 'py' | 'js' | 'cpp' | 'json' | 'csv';
  notebookId: string;
  folderId?: string;
  createdAt: Date;
  updatedAt: Date;
  size?: number;
}

export interface ITask {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Frontend UI Interfaces (for compatibility with existing component)
export interface FileItem {
  id: string;
  name: string;
  type: 'txt' | 'md' | 'py' | 'js' | 'cpp' | 'json' | 'csv';
  content?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Section {
  id: string;
  name: string;
  files: FileItem[];
  isExpanded: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Notebook {
  id: string;
  name: string;
  sections: Section[];
  isExpanded: boolean;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface NotebookTreeData {
  notebooks: Notebook[];
}

// Error Types
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// File Indexing Types for Gemini AI Integration
export interface IndexedFile {
  notebook: string;
  filename: string;
  extension: string;
  preview: string;
  fileId: string;
  createdAt: string;
}

export interface FileIndexResponse {
  success: boolean;
  data?: IndexedFile[];
  error?: string;
  message?: string;
  totalFiles?: number;
}

export interface IndexCacheData {
  files: IndexedFile[];
  lastUpdated: string;
  totalFiles: number;
}

// Advanced Editor Types
export interface EditorPosition {
  lineNumber: number;
  column: number;
}

export interface EditorSelection {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface EditorTab {
  id: string;
  name: string;
  type: 'txt' | 'md' | 'py' | 'js' | 'cpp' | 'json' | 'csv' | 'console';
  content: string;
  isDirty: boolean;
  isActive: boolean;
  notebookId: string;
  folderId?: string;
  isReadOnly?: boolean; // For console tabs
}

export interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;
  cursorPosition: EditorPosition;
  selection: EditorSelection | null;
  isCommandPaletteOpen: boolean;
  findWidgetVisible: boolean;
}

export interface EditorCommand {
  id: string;
  label: string;
  description?: string;
  keybinding?: string;
  action: () => void | Promise<void>;
  category?: string;
}

export interface EditorTheme {
  name: string;
  base: 'vs' | 'vs-dark' | 'hc-black';
  inherit: boolean;
  rules: Array<{
    token: string;
    foreground?: string;
    background?: string;
    fontStyle?: string;
  }>;
  colors: Record<string, string>;
}

export interface LanguageConfiguration {
  id: string;
  extensions: string[];
  aliases: string[];
  mimetypes?: string[];
  configuration?: {
    comments?: {
      lineComment?: string;
      blockComment?: [string, string];
    };
    brackets?: Array<[string, string]>;
    autoClosingPairs?: Array<{
      open: string;
      close: string;
      notIn?: string[];
    }>;
    surroundingPairs?: Array<[string, string]>;
    folding?: {
      markers?: {
        start: RegExp;
        end: RegExp;
      };
    };
  };
}

export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  minimap: {
    enabled: boolean;
    side: 'left' | 'right';
    size: 'proportional' | 'fill' | 'fit';
  };
  scrollBeyondLastLine: boolean;
  automaticLayout: boolean;
  lineNumbers: 'on' | 'off' | 'relative' | 'interval';
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
  bracketPairColorization: boolean;
  codeLens: boolean;
  folding: boolean;
  foldingStrategy: 'auto' | 'indentation';
  showFoldingControls: 'always' | 'mouseover';
}

// Semantic Search Types
export interface SemanticSearchResult {
  fileId: string;
  filePath: string;
  notebook: string;
  fileType: string;
  preview: string;
  similarity: number;
  content?: string;
}

export interface SemanticSearchQuery {
  query: string;
  userId: string;
  maxResults?: number;
  threshold?: number;
  fileTypes?: string[];
  notebooks?: string[];
}

export interface SemanticSearchResponse {
  success: boolean;
  data?: {
    query: string;
    results: SemanticSearchResult[];
    totalResults: number;
    threshold: number;
    maxResults: number;
  };
  error?: string;
  message?: string;
}

export interface VectorEmbedding {
  id: string;
  embedding: number[];
  metadata: {
    userId: string;
    filePath: string;
    notebook: string;
    preview: string;
    fileType: string;
    lastModified: string;
    content?: string;
  };
}

export interface EmbeddingIndexRequest {
  userId: string;
  incremental?: boolean;
  fileTypes?: string[];
  notebooks?: string[];
}

export interface EmbeddingIndexResponse {
  success: boolean;
  message?: string;
  data?: {
    totalFiles: number;
    indexedFiles: number;
    skippedFiles: number;
    errors: string[];
    vectorDbStats?: {
      count: number;
      metadata?: any;
    };
  };
  error?: string;
}

export interface ChatWithSemanticSearchRequest {
  message: string;
  userId: string;
  includeSemanticSearch?: boolean;
  maxContextFiles?: number;
  searchThreshold?: number;
}

export interface ChatWithSemanticSearchResponse {
  success: boolean;
  data?: {
    message: string;
    contextFiles: SemanticSearchResult[];
    searchPerformed: boolean;
    totalContextFiles: number;
    searchThreshold: number;
  };
  error?: string;
  message?: string;
}

// Enhanced Gemini Response with Semantic Search
export interface EnhancedGeminiResponse {
  success: boolean;
  content?: string;
  error?: string;
  contextFiles?: SemanticSearchResult[];
  searchPerformed?: boolean;
  searchQuery?: string;
  searchThreshold?: number;
}

// Vector Database Configuration
export interface VectorDbConfig {
  host: string;
  port: number;
  collectionName: string;
  threshold: number;
  maxResults: number;
}

// Semantic Search Settings
export interface SemanticSearchSettings {
  enabled: boolean;
  threshold: number;
  maxContextFiles: number;
  fileTypeFilters: string[];
  notebookFilters: string[];
  showContextFiles: boolean;
  autoIndex: boolean;
}

// Error Types for Semantic Search
export class SemanticSearchError extends Error {
  constructor(message: string, public code?: string, public originalError?: any) {
    super(message);
    this.name = 'SemanticSearchError';
  }
}

export class VectorDbError extends Error {
  constructor(message: string, public code?: string, public originalError?: any) {
    super(message);
    this.name = 'VectorDbError';
  }
}

export class EmbeddingError extends Error {
  constructor(message: string, public code?: string, public originalError?: any) {
    super(message);
    this.name = 'EmbeddingError';
  }
}



// Flashcard types
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  sourceFile?: string;
  sourceContent?: string;
  createdAt: Date;
  lastModified: Date;
  isAutoGenerated: boolean;
}

export interface FlashcardDeck {
  id: string;
  name: string;
  description?: string;
  flashcards: string[]; // Flashcard IDs
  category: string;
  tags: string[];
  createdAt: Date;
  lastModified: Date;
  isPublic: boolean;
}

// Spaced Repetition types (SM-2 Algorithm)
export interface SpacedRepetitionData {
  flashcardId: string;
  userId: string;
  easeFactor: number; // Initial: 2.5
  interval: number; // Days until next review
  repetitions: number; // Number of successful repetitions
  nextReviewDate: Date;
  lastReviewDate?: Date;
  quality: number; // Last quality rating (0-5)
  totalReviews: number;
  correctReviews: number;
  streak: number; // Current correct streak
  longestStreak: number;
}

export interface ReviewSession {
  id: string;
  userId: string;
  flashcardIds: string[];
  startedAt: Date;
  completedAt?: Date;
  totalCards: number;
  reviewedCards: number;
  correctCards: number;
  averageQuality: number;
  timeSpent: number; // in seconds
}

export interface FlashcardReview {
  flashcardId: string;
  quality: number; // 0-5 rating
  timeSpent: number; // in seconds
  wasCorrect: boolean;
  reviewedAt: Date;
}

export interface StudyStatistics {
  userId: string;
  totalFlashcards: number;
  totalDecks: number;
  totalReviews: number;
  correctReviews: number;
  averageQuality: number;
  currentStreak: number;
  longestStreak: number;
  studyDays: number;
  lastStudyDate?: Date;
  weeklyGoal: number;
  weeklyProgress: number;
  monthlyStats: {
    month: string;
    reviews: number;
    correctReviews: number;
    newCards: number;
    timeSpent: number;
  }[];
}

export interface FlashcardGenerationRequest {
  sourceType: 'file' | 'chromadb' | 'content';
  sourceFiles?: string[]; // File IDs or paths
  content?: string; // Direct content input
  cardCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  category: string;
  tags?: string[];
  deckName?: string;
}

export interface FlashcardGenerationResponse {
  success: boolean;
  data?: {
    flashcards: Flashcard[];
    deck?: FlashcardDeck;
  };
  error?: string;
  message?: string;
}

// Quiz Types
export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'fill_in_blank';
  question: string;
  options?: string[]; // For multiple choice questions
  correctAnswer: string | number; // String for text answers, number for option index
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sourceContent?: string; // Original content this question was generated from
  sourceFile?: string; // File path/name where content came from
  tags?: string[];
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  category: string;
  tags: string[];
  timeLimit?: number; // in minutes
  passingScore: number; // percentage
  sourceFiles: string[]; // Files used to generate the quiz
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  isPublic: boolean;
}

export interface QuizSession {
  id: string;
  quizId: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  currentQuestionIndex: number;
  answers: QuizAnswer[];
  score?: number;
  percentage?: number;
  timeSpent: number; // in seconds
  status: 'in_progress' | 'completed' | 'abandoned';
}

export interface QuizAnswer {
  questionId: string;
  userAnswer: string | number;
  isCorrect: boolean;
  timeSpent: number; // in seconds
  answeredAt: Date;
}

export interface QuizResult {
  sessionId: string;
  quizId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  timeSpent: number;
  completedAt: Date;
  answers: QuizAnswer[];
  passed: boolean;
  difficulty: string;
  category: string;
}

export interface QuizGenerationRequest {
  sourceType: 'chromadb' | 'files' | 'content';
  sourceFiles?: string[]; // File IDs or paths
  content?: string; // Direct content input
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionTypes: ('multiple_choice' | 'true_false' | 'fill_in_blank')[];
  category: string;
  tags?: string[];
  timeLimit?: number;
  focusTopics?: string[]; // Specific topics to focus on
}

export interface QuizGenerationResponse {
  success: boolean;
  data?: {
    quiz: Quiz;
    session?: QuizSession;
  };
  error?: string;
  message?: string;
}

export interface QuizSettings {
  defaultQuestionCount: number;
  defaultDifficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  defaultTimeLimit: number;
  enableAdaptiveDifficulty: boolean;
  showExplanations: boolean;
  allowReview: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}

export interface QuizStatistics {
  userId: string;
  totalQuizzes: number;
  totalQuestions: number;
  correctAnswers: number;
  averageScore: number;
  averageTimePerQuestion: number;
  bestScore: number;
  worstScore: number;
  streakCurrent: number;
  streakLongest: number;
  categoryStats: {
    category: string;
    quizzes: number;
    averageScore: number;
    lastAttempt: Date;
  }[];
  difficultyStats: {
    difficulty: string;
    quizzes: number;
    averageScore: number;
    averageTime: number;
  }[];
  recentActivity: {
    date: string;
    quizzes: number;
    score: number;
    timeSpent: number;
  }[];
}

// Task Management Types
export interface TaskFormData {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string; // ISO string for form inputs
}

export interface TaskFilters {
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  search?: string;
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface TaskApiResponse {
  success: boolean;
  data?: ITask | ITask[] | TaskStats;
  count?: number;
  error?: string;
  message?: string;
  details?: any[];
}
