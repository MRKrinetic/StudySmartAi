import { QuizSettings, QuizStatistics, QuizSession, QuizGenerationRequest } from '@/types';

export interface UserQuizPreferences {
  userId: string;
  preferredDifficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  preferredQuestionTypes: ('multiple_choice' | 'true_false' | 'fill_in_blank')[];
  preferredQuestionCount: number;
  preferredTimeLimit?: number;
  focusAreas: string[];
  adaptiveDifficulty: boolean;
  showExplanations: boolean;
  allowReview: boolean;
  lastUpdated: Date;
}

export interface PerformanceMetrics {
  averageScore: number;
  averageTimePerQuestion: number;
  strongTopics: string[];
  weakTopics: string[];
  preferredDifficulty: 'easy' | 'medium' | 'hard';
  recentPerformanceTrend: 'improving' | 'declining' | 'stable';
}

export class QuizPersonalizationService {
  private static instance: QuizPersonalizationService;
  private userPreferences: Map<string, UserQuizPreferences> = new Map();
  private performanceCache: Map<string, PerformanceMetrics> = new Map();

  static getInstance(): QuizPersonalizationService {
    if (!QuizPersonalizationService.instance) {
      QuizPersonalizationService.instance = new QuizPersonalizationService();
    }
    return QuizPersonalizationService.instance;
  }

  /**
   * Get user preferences with defaults
   */
  getUserPreferences(userId: string): UserQuizPreferences {
    const existing = this.userPreferences.get(userId);
    if (existing) {
      return existing;
    }

    // Default preferences
    const defaults: UserQuizPreferences = {
      userId,
      preferredDifficulty: 'medium',
      preferredQuestionTypes: ['multiple_choice', 'true_false'],
      preferredQuestionCount: 10,
      preferredTimeLimit: 15,
      focusAreas: [],
      adaptiveDifficulty: true,
      showExplanations: true,
      allowReview: true,
      lastUpdated: new Date()
    };

    this.userPreferences.set(userId, defaults);
    return defaults;
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(userId: string, updates: Partial<UserQuizPreferences>): void {
    const current = this.getUserPreferences(userId);
    const updated = {
      ...current,
      ...updates,
      userId,
      lastUpdated: new Date()
    };
    this.userPreferences.set(userId, updated);
  }

  /**
   * Analyze user performance and calculate metrics
   */
  analyzePerformance(userId: string, sessions: QuizSession[]): PerformanceMetrics {
    if (sessions.length === 0) {
      return {
        averageScore: 0,
        averageTimePerQuestion: 0,
        strongTopics: [],
        weakTopics: [],
        preferredDifficulty: 'medium',
        recentPerformanceTrend: 'stable'
      };
    }

    // Calculate basic metrics
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const totalScore = completedSessions.reduce((sum, s) => sum + (s.percentage || 0), 0);
    const averageScore = totalScore / completedSessions.length;

    const totalTime = completedSessions.reduce((sum, s) => sum + s.timeSpent, 0);
    const totalQuestions = completedSessions.reduce((sum, s) => sum + s.answers.length, 0);
    const averageTimePerQuestion = totalQuestions > 0 ? totalTime / totalQuestions : 0;

    // Analyze topic performance (would need quiz data for full implementation)
    const strongTopics: string[] = [];
    const weakTopics: string[] = [];

    // Determine preferred difficulty based on performance
    let preferredDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
    if (averageScore >= 85) {
      preferredDifficulty = 'hard';
    } else if (averageScore < 65) {
      preferredDifficulty = 'easy';
    }

    // Analyze recent trend (last 5 sessions vs previous 5)
    let recentPerformanceTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (completedSessions.length >= 6) {
      const recent = completedSessions.slice(-5);
      const previous = completedSessions.slice(-10, -5);
      
      const recentAvg = recent.reduce((sum, s) => sum + (s.percentage || 0), 0) / recent.length;
      const previousAvg = previous.reduce((sum, s) => sum + (s.percentage || 0), 0) / previous.length;
      
      if (recentAvg > previousAvg + 5) {
        recentPerformanceTrend = 'improving';
      } else if (recentAvg < previousAvg - 5) {
        recentPerformanceTrend = 'declining';
      }
    }

    const metrics: PerformanceMetrics = {
      averageScore,
      averageTimePerQuestion,
      strongTopics,
      weakTopics,
      preferredDifficulty,
      recentPerformanceTrend
    };

    this.performanceCache.set(userId, metrics);
    return metrics;
  }

  /**
   * Personalize quiz generation request based on user data
   */
  personalizeQuizRequest(
    userId: string, 
    baseRequest: QuizGenerationRequest,
    userSessions: QuizSession[] = []
  ): QuizGenerationRequest {
    const preferences = this.getUserPreferences(userId);
    const performance = this.analyzePerformance(userId, userSessions);

    let personalizedRequest = { ...baseRequest };

    // Apply adaptive difficulty if enabled
    if (preferences.adaptiveDifficulty && userSessions.length >= 3) {
      personalizedRequest.difficulty = performance.preferredDifficulty;
    } else if (preferences.preferredDifficulty !== 'adaptive') {
      personalizedRequest.difficulty = preferences.preferredDifficulty;
    }

    // Apply preferred question types if not specified
    if (!baseRequest.questionTypes || baseRequest.questionTypes.length === 0) {
      personalizedRequest.questionTypes = preferences.preferredQuestionTypes;
    }

    // Apply preferred question count if not specified
    if (!baseRequest.questionCount) {
      personalizedRequest.questionCount = preferences.preferredQuestionCount;
    }

    // Apply preferred time limit if not specified
    if (!baseRequest.timeLimit && preferences.preferredTimeLimit) {
      personalizedRequest.timeLimit = preferences.preferredTimeLimit;
    }

    // Enhance focus topics with user's focus areas
    const combinedFocusTopics = [
      ...(baseRequest.focusTopics || []),
      ...preferences.focusAreas
    ];
    if (combinedFocusTopics.length > 0) {
      personalizedRequest.focusTopics = [...new Set(combinedFocusTopics)];
    }

    // Add weak topics to focus areas for improvement
    if (performance.weakTopics.length > 0) {
      personalizedRequest.focusTopics = [
        ...(personalizedRequest.focusTopics || []),
        ...performance.weakTopics
      ];
    }

    return personalizedRequest;
  }

  /**
   * Get personalized quiz recommendations
   */
  getQuizRecommendations(userId: string, userSessions: QuizSession[]): {
    recommendedDifficulty: string;
    recommendedTopics: string[];
    recommendedQuestionTypes: string[];
    improvementAreas: string[];
    motivationalMessage: string;
  } {
    const performance = this.analyzePerformance(userId, userSessions);
    const preferences = this.getUserPreferences(userId);

    let motivationalMessage = "Keep up the great work! ";
    
    if (performance.recentPerformanceTrend === 'improving') {
      motivationalMessage = "Excellent progress! You're improving with each quiz. ";
    } else if (performance.recentPerformanceTrend === 'declining') {
      motivationalMessage = "Don't worry, everyone has ups and downs. Let's focus on improvement! ";
    }

    if (performance.averageScore >= 90) {
      motivationalMessage += "You're mastering the material!";
    } else if (performance.averageScore >= 75) {
      motivationalMessage += "You're doing well, keep practicing!";
    } else {
      motivationalMessage += "Practice makes perfect - you've got this!";
    }

    return {
      recommendedDifficulty: performance.preferredDifficulty,
      recommendedTopics: [...performance.weakTopics, ...preferences.focusAreas],
      recommendedQuestionTypes: preferences.preferredQuestionTypes,
      improvementAreas: performance.weakTopics,
      motivationalMessage
    };
  }

  /**
   * Update preferences based on quiz completion
   */
  updatePreferencesFromQuizCompletion(
    userId: string, 
    session: QuizSession, 
    userFeedback?: {
      difficultyRating: 'too_easy' | 'just_right' | 'too_hard';
      timeRating: 'too_fast' | 'just_right' | 'too_slow';
      topicInterest: string[];
    }
  ): void {
    if (!userFeedback) return;

    const preferences = this.getUserPreferences(userId);
    const updates: Partial<UserQuizPreferences> = {};

    // Adjust difficulty preference based on feedback
    if (userFeedback.difficultyRating === 'too_easy' && preferences.preferredDifficulty !== 'hard') {
      const difficultyLevels = ['easy', 'medium', 'hard'];
      const currentIndex = difficultyLevels.indexOf(preferences.preferredDifficulty);
      updates.preferredDifficulty = difficultyLevels[currentIndex + 1] as any;
    } else if (userFeedback.difficultyRating === 'too_hard' && preferences.preferredDifficulty !== 'easy') {
      const difficultyLevels = ['easy', 'medium', 'hard'];
      const currentIndex = difficultyLevels.indexOf(preferences.preferredDifficulty);
      updates.preferredDifficulty = difficultyLevels[currentIndex - 1] as any;
    }

    // Adjust time limit based on feedback
    if (userFeedback.timeRating === 'too_fast' && preferences.preferredTimeLimit) {
      updates.preferredTimeLimit = Math.min(preferences.preferredTimeLimit + 5, 60);
    } else if (userFeedback.timeRating === 'too_slow' && preferences.preferredTimeLimit) {
      updates.preferredTimeLimit = Math.max(preferences.preferredTimeLimit - 5, 5);
    }

    // Update focus areas based on topic interest
    if (userFeedback.topicInterest.length > 0) {
      updates.focusAreas = [
        ...new Set([...preferences.focusAreas, ...userFeedback.topicInterest])
      ].slice(0, 10); // Limit to 10 focus areas
    }

    if (Object.keys(updates).length > 0) {
      this.updateUserPreferences(userId, updates);
    }
  }

  /**
   * Get cached performance metrics
   */
  getCachedPerformance(userId: string): PerformanceMetrics | null {
    return this.performanceCache.get(userId) || null;
  }

  /**
   * Clear user data (for privacy/GDPR compliance)
   */
  clearUserData(userId: string): void {
    this.userPreferences.delete(userId);
    this.performanceCache.delete(userId);
  }
}

// Export singleton instance
export const quizPersonalizationService = QuizPersonalizationService.getInstance();

export default QuizPersonalizationService;
