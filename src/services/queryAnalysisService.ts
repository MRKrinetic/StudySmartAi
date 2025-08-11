/**
 * Query Analysis Service
 * 
 * Analyzes incoming queries to determine whether ChromaDB context retrieval
 * is necessary before executing LLM queries. This optimizes performance by
 * avoiding unnecessary database calls for general programming questions.
 */

export interface QueryAnalysisResult {
  requiresContext: boolean;
  confidence: number;
  reasoning: string;
  queryType: QueryType;
  detectedPatterns: string[];
}

export enum QueryType {
  GENERAL_PROGRAMMING = 'general_programming',
  PROJECT_SPECIFIC = 'project_specific',
  FILE_REFERENCE = 'file_reference',
  CODE_EXPLANATION = 'code_explanation',
  SEMANTIC_SEARCH = 'semantic_search',
  DOCUMENTATION_QUERY = 'documentation_query'
}

export interface QueryAnalysisConfig {
  contextThreshold: number; // Confidence threshold for requiring context (0-1)
  enableStrictMode: boolean; // If true, err on the side of using context
  maxAnalysisTime: number; // Max time to spend on analysis (ms)
}

class QueryAnalysisService {
  private config: QueryAnalysisConfig;

  constructor(config: Partial<QueryAnalysisConfig> = {}) {
    this.config = {
      contextThreshold: 0.6,
      enableStrictMode: false,
      maxAnalysisTime: 100,
      ...config
    };
  }

  /**
   * Initialize with configuration from config service
   */
  initializeWithConfig(configService?: any): void {
    if (configService && typeof configService.getSettings === 'function') {
      const settings = configService.getSettings();
      this.config = {
        contextThreshold: settings.contextThreshold,
        enableStrictMode: settings.enableStrictMode,
        maxAnalysisTime: settings.maxAnalysisTime
      };
    }
  }

  /**
   * Analyze a query to determine if it requires ChromaDB context
   */
  public analyzeQuery(query: string): QueryAnalysisResult {
    const startTime = Date.now();
    
    try {
      const normalizedQuery = this.normalizeQuery(query);
      const patterns = this.detectPatterns(normalizedQuery);
      const queryType = this.classifyQueryType(normalizedQuery, patterns);
      const confidence = this.calculateConfidence(normalizedQuery, patterns, queryType);
      
      const requiresContext = this.shouldUseContext(confidence, queryType, patterns);
      const reasoning = this.generateReasoning(queryType, patterns, confidence, requiresContext);

      return {
        requiresContext,
        confidence,
        reasoning,
        queryType,
        detectedPatterns: patterns
      };
    } catch (error) {
      console.warn('Query analysis failed, defaulting to context usage:', error);
      // Fail safe: use context if analysis fails
      return {
        requiresContext: true,
        confidence: 0.5,
        reasoning: 'Analysis failed, using context for safety',
        queryType: QueryType.PROJECT_SPECIFIC,
        detectedPatterns: []
      };
    } finally {
      const analysisTime = Date.now() - startTime;
      if (analysisTime > this.config.maxAnalysisTime) {
        console.warn(`Query analysis took ${analysisTime}ms, consider optimization`);
      }
    }
  }

  /**
   * Normalize query for analysis
   */
  private normalizeQuery(query: string): string {
    return query.toLowerCase().trim();
  }

  /**
   * Detect patterns in the query that indicate context requirements
   */
  private detectPatterns(query: string): string[] {
    const patterns: string[] = [];

    // File and path references
    const filePatterns = [
      /\b[\w-]+\.(js|ts|py|cpp|java|html|css|json|md|txt|csv)\b/g,
      /\bfile\s+(?:named|called)\s+[\w.-]+/g,
      /\bthis\s+file\b/g,
      /\bmy\s+(?:code|file|project|notebook)\b/g,
      /\bin\s+(?:my|this|the)\s+(?:project|codebase|repository)\b/g
    ];

    filePatterns.forEach(pattern => {
      if (pattern.test(query)) {
        patterns.push('file_reference');
      }
    });

    // Code-specific references
    const codePatterns = [
      /\bthis\s+(?:function|class|method|variable|component)\b/g,
      /\bexplain\s+(?:this|the)\s+(?:code|function|class|method)\b/g,
      /\bwhat\s+does\s+(?:this|the)\s+(?:code|function|class)\b/g,
      /\bhow\s+does\s+(?:this|my)\s+(?:code|function|implementation)\b/g,
      /\bfind\s+(?:similar|related)\s+(?:functions|code|examples)\b/g
    ];

    codePatterns.forEach(pattern => {
      if (pattern.test(query)) {
        patterns.push('code_reference');
      }
    });

    // Project-specific indicators
    const projectPatterns = [
      /\bin\s+(?:my|this|our)\s+(?:project|application|app|system)\b/g,
      /\bfrom\s+(?:my|our)\s+(?:codebase|files|notes)\b/g,
      /\bshow\s+me\s+(?:examples|code)\s+from\b/g,
      /\bsearch\s+(?:for|my|our)\b/g,
      /\bfind\s+(?:in|from)\s+(?:my|our|the)\b/g
    ];

    projectPatterns.forEach(pattern => {
      if (pattern.test(query)) {
        patterns.push('project_specific');
      }
    });

    // Documentation queries
    const docPatterns = [
      /\bwhat\s+does\s+(?:the|my)\s+documentation\s+say\b/g,
      /\baccording\s+to\s+(?:the|my)\s+(?:docs|documentation|readme)\b/g,
      /\bin\s+(?:the|my)\s+(?:readme|documentation|notes)\b/g
    ];

    docPatterns.forEach(pattern => {
      if (pattern.test(query)) {
        patterns.push('documentation_query');
      }
    });

    // General programming indicators (suggest NO context needed)
    const generalPatterns = [
      /\bwhat\s+is\s+(?:a|an)\s+(?:for\s+loop|while\s+loop|function|class|variable)\b/g,
      /\bhow\s+to\s+(?:create|make|write|implement)\s+(?:a|an)\b/g,
      /\bexplain\s+(?:the\s+concept\s+of|what\s+is)\b/g,
      /\b(?:javascript|python|java|c\+\+|html|css|sql)\s+(?:syntax|tutorial|basics)\b/g,
      /\bhow\s+do\s+(?:i|you)\s+(?:center\s+a\s+div|create\s+a\s+loop|define\s+a\s+function)\b/g,
      /\bwhat\s+(?:are|is)\s+(?:rest\s+apis|promises|async\s+await|closures)\b/g
    ];

    generalPatterns.forEach(pattern => {
      if (pattern.test(query)) {
        patterns.push('general_programming');
      }
    });

    return [...new Set(patterns)]; // Remove duplicates
  }

  /**
   * Classify the query type based on detected patterns
   */
  private classifyQueryType(query: string, patterns: string[]): QueryType {
    // Priority order for classification
    if (patterns.includes('file_reference')) {
      return QueryType.FILE_REFERENCE;
    }
    
    if (patterns.includes('code_reference')) {
      return QueryType.CODE_EXPLANATION;
    }
    
    if (patterns.includes('documentation_query')) {
      return QueryType.DOCUMENTATION_QUERY;
    }
    
    if (patterns.includes('project_specific')) {
      return QueryType.PROJECT_SPECIFIC;
    }
    
    if (patterns.includes('general_programming')) {
      return QueryType.GENERAL_PROGRAMMING;
    }

    // Default to semantic search for ambiguous queries
    return QueryType.SEMANTIC_SEARCH;
  }

  /**
   * Calculate confidence score for the classification
   */
  private calculateConfidence(query: string, patterns: string[], queryType: QueryType): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence based on pattern strength
    const patternWeights = {
      'file_reference': 0.3,
      'code_reference': 0.25,
      'project_specific': 0.2,
      'documentation_query': 0.25,
      'general_programming': -0.3 // Negative weight for general programming
    };

    patterns.forEach(pattern => {
      confidence += patternWeights[pattern as keyof typeof patternWeights] || 0;
    });

    // Adjust based on query length and specificity
    const wordCount = query.split(/\s+/).length;
    if (wordCount < 3) {
      confidence -= 0.1; // Short queries are less specific
    } else if (wordCount > 10) {
      confidence += 0.1; // Longer queries tend to be more specific
    }

    // Ensure confidence is within bounds
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Determine if context should be used based on analysis
   */
  private shouldUseContext(confidence: number, queryType: QueryType, patterns: string[]): boolean {
    // Always use context for these types
    const alwaysUseContext = [
      QueryType.FILE_REFERENCE,
      QueryType.CODE_EXPLANATION,
      QueryType.DOCUMENTATION_QUERY,
      QueryType.PROJECT_SPECIFIC
    ];

    if (alwaysUseContext.includes(queryType)) {
      return true;
    }

    // Never use context for general programming (unless in strict mode)
    if (queryType === QueryType.GENERAL_PROGRAMMING && !this.config.enableStrictMode) {
      return false;
    }

    // Use threshold for ambiguous cases
    return confidence >= this.config.contextThreshold;
  }

  /**
   * Generate human-readable reasoning for the decision
   */
  private generateReasoning(
    queryType: QueryType, 
    patterns: string[], 
    confidence: number, 
    requiresContext: boolean
  ): string {
    const reasons: string[] = [];

    if (patterns.includes('file_reference')) {
      reasons.push('detected file or path references');
    }
    if (patterns.includes('code_reference')) {
      reasons.push('detected code-specific references');
    }
    if (patterns.includes('project_specific')) {
      reasons.push('detected project-specific language');
    }
    if (patterns.includes('documentation_query')) {
      reasons.push('detected documentation query');
    }
    if (patterns.includes('general_programming')) {
      reasons.push('detected general programming concepts');
    }

    const action = requiresContext ? 'Using' : 'Skipping';
    const confidenceText = `${(confidence * 100).toFixed(0)}% confidence`;
    
    if (reasons.length > 0) {
      return `${action} context retrieval (${confidenceText}): ${reasons.join(', ')}`;
    } else {
      return `${action} context retrieval (${confidenceText}): query type is ${queryType}`;
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<QueryAnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): QueryAnalysisConfig {
    return { ...this.config };
  }

  /**
   * Advanced pattern detection for edge cases
   */
  private detectAdvancedPatterns(query: string): string[] {
    const patterns: string[] = [];

    // Contextual pronouns that suggest reference to existing content
    const contextualPronouns = [
      /\b(?:this|that|these|those)\s+(?:code|function|file|class|method|variable|component|implementation)\b/g,
      /\b(?:my|our|the)\s+(?:current|existing|previous)\s+(?:code|implementation|solution)\b/g,
      /\b(?:above|below|earlier|previous)\s+(?:code|example|function)\b/g
    ];

    contextualPronouns.forEach(pattern => {
      if (pattern.test(query)) {
        patterns.push('contextual_reference');
      }
    });

    // Comparison requests that might need examples from codebase
    const comparisonPatterns = [
      /\bcompare\s+(?:this|my|our)\s+(?:with|to|against)\b/g,
      /\b(?:similar|different)\s+(?:to|from)\s+(?:my|our|this)\b/g,
      /\bshow\s+me\s+(?:other|similar|different)\s+(?:examples|implementations)\b/g
    ];

    comparisonPatterns.forEach(pattern => {
      if (pattern.test(query)) {
        patterns.push('comparison_request');
      }
    });

    // Learning/tutorial requests that are usually general
    const learningPatterns = [
      /\b(?:learn|tutorial|guide|introduction)\s+(?:to|about|for)\b/g,
      /\b(?:beginner|basic|fundamentals|concepts)\s+(?:of|in|for)\b/g,
      /\b(?:best\s+practices|common\s+patterns|design\s+patterns)\b/g,
      /\bhow\s+(?:to\s+get\s+started|does\s+.+\s+work|do\s+i\s+learn)\b/g
    ];

    learningPatterns.forEach(pattern => {
      if (pattern.test(query)) {
        patterns.push('learning_request');
      }
    });

    // Debugging/troubleshooting that might need specific context
    const debugPatterns = [
      /\b(?:debug|fix|error|bug|issue|problem)\s+(?:in|with|this|my)\b/g,
      /\bwhy\s+(?:is|does|doesn't|isn't)\s+(?:this|my|our)\b/g,
      /\b(?:not\s+working|broken|failing|crashing)\b/g,
      /\bget\s+(?:error|exception)\s+(?:in|when|while)\b/g
    ];

    debugPatterns.forEach(pattern => {
      if (pattern.test(query)) {
        patterns.push('debugging_request');
      }
    });

    return patterns;
  }

  /**
   * Analyze query complexity and specificity
   */
  private analyzeQueryComplexity(query: string): {
    complexity: 'low' | 'medium' | 'high';
    specificity: number;
    technicalTerms: number;
  } {
    const words = query.toLowerCase().split(/\s+/);
    const wordCount = words.length;

    // Count technical terms
    const technicalTerms = [
      'function', 'class', 'method', 'variable', 'component', 'module', 'library',
      'framework', 'api', 'database', 'query', 'algorithm', 'data structure',
      'async', 'await', 'promise', 'callback', 'closure', 'prototype', 'inheritance',
      'polymorphism', 'encapsulation', 'abstraction', 'interface', 'implementation'
    ];

    const technicalTermCount = words.filter(word =>
      technicalTerms.some(term => word.includes(term))
    ).length;

    // Determine complexity
    let complexity: 'low' | 'medium' | 'high' = 'low';
    if (wordCount > 15 || technicalTermCount > 3) {
      complexity = 'high';
    } else if (wordCount > 8 || technicalTermCount > 1) {
      complexity = 'medium';
    }

    // Calculate specificity (0-1)
    const specificityFactors = [
      technicalTermCount / words.length, // Technical term density
      Math.min(wordCount / 20, 1), // Length factor (capped at 20 words)
      query.includes('?') ? 0.1 : 0, // Question mark adds specificity
      /\b(?:specific|exactly|precisely|particular)\b/.test(query) ? 0.2 : 0
    ];

    const specificity = specificityFactors.reduce((sum, factor) => sum + factor, 0) / specificityFactors.length;

    return {
      complexity,
      specificity: Math.min(specificity, 1),
      technicalTerms: technicalTermCount
    };
  }

  /**
   * Enhanced query analysis with advanced patterns
   */
  public analyzeQueryEnhanced(query: string): QueryAnalysisResult & {
    complexity: 'low' | 'medium' | 'high';
    specificity: number;
    advancedPatterns: string[];
  } {
    const basicResult = this.analyzeQuery(query);
    const advancedPatterns = this.detectAdvancedPatterns(query);
    const complexityAnalysis = this.analyzeQueryComplexity(query);

    // Adjust confidence based on advanced patterns
    let adjustedConfidence = basicResult.confidence;

    if (advancedPatterns.includes('contextual_reference') ||
        advancedPatterns.includes('debugging_request')) {
      adjustedConfidence += 0.2;
    }

    if (advancedPatterns.includes('learning_request')) {
      adjustedConfidence -= 0.3;
    }

    if (advancedPatterns.includes('comparison_request')) {
      adjustedConfidence += 0.15;
    }

    // Adjust based on complexity and specificity
    if (complexityAnalysis.complexity === 'high' && complexityAnalysis.specificity > 0.7) {
      adjustedConfidence += 0.1;
    }

    adjustedConfidence = Math.max(0, Math.min(1, adjustedConfidence));

    // Re-evaluate context requirement with adjusted confidence
    const requiresContext = this.shouldUseContext(
      adjustedConfidence,
      basicResult.queryType,
      [...basicResult.detectedPatterns, ...advancedPatterns]
    );

    return {
      ...basicResult,
      confidence: adjustedConfidence,
      requiresContext,
      complexity: complexityAnalysis.complexity,
      specificity: complexityAnalysis.specificity,
      advancedPatterns,
      reasoning: this.generateEnhancedReasoning(
        basicResult.queryType,
        [...basicResult.detectedPatterns, ...advancedPatterns],
        adjustedConfidence,
        requiresContext,
        complexityAnalysis
      )
    };
  }

  /**
   * Generate enhanced reasoning with complexity analysis
   */
  private generateEnhancedReasoning(
    queryType: QueryType,
    patterns: string[],
    confidence: number,
    requiresContext: boolean,
    complexity: { complexity: 'low' | 'medium' | 'high'; specificity: number; technicalTerms: number }
  ): string {
    const baseReasoning = this.generateReasoning(queryType, patterns, confidence, requiresContext);

    const complexityNote = complexity.complexity === 'high'
      ? ` (high complexity, ${complexity.technicalTerms} technical terms)`
      : complexity.complexity === 'medium'
      ? ` (medium complexity)`
      : '';

    const specificityNote = complexity.specificity > 0.8
      ? ', highly specific query'
      : complexity.specificity < 0.3
      ? ', general query'
      : '';

    return `${baseReasoning}${complexityNote}${specificityNote}`;
  }
}

// Export singleton instance
export const queryAnalysisService = new QueryAnalysisService();
export default queryAnalysisService;
