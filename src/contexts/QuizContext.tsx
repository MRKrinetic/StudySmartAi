import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Quiz, QuizSession, QuizResult, QuizGenerationRequest } from '@/types';

// Quiz Mode Types
export type QuizMode = 'chat' | 'generation' | 'quiz' | 'results' | 'review';

export interface QuizState {
  mode: QuizMode;
  currentQuiz: Quiz | null;
  currentSession: QuizSession | null;
  currentResult: QuizResult | null;
  isGenerating: boolean;
  error: string | null;
  history: QuizSession[];
}

// Action Types
export type QuizAction =
  | { type: 'SET_MODE'; payload: QuizMode }
  | { type: 'START_GENERATION' }
  | { type: 'GENERATION_SUCCESS'; payload: { quiz: Quiz; session: QuizSession } }
  | { type: 'GENERATION_ERROR'; payload: string }
  | { type: 'START_QUIZ'; payload: { quiz: Quiz; session: QuizSession } }
  | { type: 'UPDATE_SESSION'; payload: QuizSession }
  | { type: 'QUIZ_COMPLETED'; payload: QuizResult }
  | { type: 'START_REVIEW' }
  | { type: 'RETURN_TO_CHAT' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_HISTORY'; payload: QuizSession[] };

// Initial State
const initialState: QuizState = {
  mode: 'chat',
  currentQuiz: null,
  currentSession: null,
  currentResult: null,
  isGenerating: false,
  error: null,
  history: []
};

// Reducer
function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        mode: action.payload,
        error: null
      };

    case 'START_GENERATION':
      return {
        ...state,
        mode: 'generation',
        isGenerating: true,
        error: null,
        currentQuiz: null,
        currentSession: null,
        currentResult: null
      };

    case 'GENERATION_SUCCESS':
      return {
        ...state,
        mode: 'quiz',
        isGenerating: false,
        currentQuiz: action.payload.quiz,
        currentSession: action.payload.session,
        error: null
      };

    case 'GENERATION_ERROR':
      return {
        ...state,
        mode: 'chat',
        isGenerating: false,
        error: action.payload,
        currentQuiz: null,
        currentSession: null
      };

    case 'START_QUIZ':
      return {
        ...state,
        mode: 'quiz',
        currentQuiz: action.payload.quiz,
        currentSession: action.payload.session,
        currentResult: null,
        error: null
      };

    case 'UPDATE_SESSION':
      return {
        ...state,
        currentSession: action.payload
      };

    case 'QUIZ_COMPLETED':
      return {
        ...state,
        mode: 'results',
        currentResult: action.payload,
        error: null
      };

    case 'START_REVIEW':
      return {
        ...state,
        mode: 'review',
        error: null
      };

    case 'RETURN_TO_CHAT':
      return {
        ...state,
        mode: 'chat',
        currentQuiz: null,
        currentSession: null,
        currentResult: null,
        error: null
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    case 'SET_HISTORY':
      return {
        ...state,
        history: action.payload
      };

    default:
      return state;
  }
}

// Context
interface QuizContextType {
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
  
  // Helper functions
  startQuizGeneration: () => void;
  setGenerationSuccess: (quiz: Quiz, session: QuizSession) => void;
  setGenerationError: (error: string) => void;
  startQuiz: (quiz: Quiz, session: QuizSession) => void;
  updateSession: (session: QuizSession) => void;
  completeQuiz: (result: QuizResult) => void;
  startReview: () => void;
  returnToChat: () => void;
  setError: (error: string) => void;
  clearError: () => void;
  setHistory: (history: QuizSession[]) => void;
  
  // Computed properties
  isInQuizMode: boolean;
  isInChatMode: boolean;
  hasActiveQuiz: boolean;
  hasError: boolean;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

// Provider Component
interface QuizProviderProps {
  children: ReactNode;
}

export const QuizProvider: React.FC<QuizProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  // Helper functions
  const startQuizGeneration = () => {
    dispatch({ type: 'START_GENERATION' });
  };

  const setGenerationSuccess = (quiz: Quiz, session: QuizSession) => {
    dispatch({ type: 'GENERATION_SUCCESS', payload: { quiz, session } });
  };

  const setGenerationError = (error: string) => {
    dispatch({ type: 'GENERATION_ERROR', payload: error });
  };

  const startQuiz = (quiz: Quiz, session: QuizSession) => {
    dispatch({ type: 'START_QUIZ', payload: { quiz, session } });
  };

  const updateSession = (session: QuizSession) => {
    dispatch({ type: 'UPDATE_SESSION', payload: session });
  };

  const completeQuiz = (result: QuizResult) => {
    dispatch({ type: 'QUIZ_COMPLETED', payload: result });
  };

  const startReview = () => {
    dispatch({ type: 'START_REVIEW' });
  };

  const returnToChat = () => {
    dispatch({ type: 'RETURN_TO_CHAT' });
  };

  const setError = (error: string) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const setHistory = (history: QuizSession[]) => {
    dispatch({ type: 'SET_HISTORY', payload: history });
  };

  // Computed properties
  const isInQuizMode = state.mode === 'quiz' || state.mode === 'generation' || state.mode === 'results' || state.mode === 'review';
  const isInChatMode = state.mode === 'chat';
  const hasActiveQuiz = state.currentQuiz !== null && state.currentSession !== null;
  const hasError = state.error !== null;

  const contextValue: QuizContextType = {
    state,
    dispatch,
    startQuizGeneration,
    setGenerationSuccess,
    setGenerationError,
    startQuiz,
    updateSession,
    completeQuiz,
    startReview,
    returnToChat,
    setError,
    clearError,
    setHistory,
    isInQuizMode,
    isInChatMode,
    hasActiveQuiz,
    hasError
  };

  return (
    <QuizContext.Provider value={contextValue}>
      {children}
    </QuizContext.Provider>
  );
};

// Hook to use Quiz Context
export const useQuiz = (): QuizContextType => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};

export default QuizContext;
