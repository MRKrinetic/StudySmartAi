/**
 * Test cases for the Query Analysis Service
 * Tests various query types and patterns to ensure correct classification
 */

import queryAnalysisService, { QueryType } from '../queryAnalysisService';

describe('QueryAnalysisService', () => {
  beforeEach(() => {
    // Reset to default configuration before each test
    queryAnalysisService.updateConfig({
      contextThreshold: 0.6,
      enableStrictMode: false,
      maxAnalysisTime: 100
    });
  });

  describe('General Programming Queries', () => {
    const generalQueries = [
      'What is a for loop?',
      'How to center a div in CSS?',
      'Explain what REST APIs are',
      'What are JavaScript promises?',
      'How do you create a function in Python?',
      'What is the difference between let and var?',
      'Explain object-oriented programming concepts',
      'How to implement a binary search algorithm?'
    ];

    test.each(generalQueries)('should classify "%s" as general programming', (query) => {
      const result = queryAnalysisService.analyzeQuery(query);
      
      expect(result.queryType).toBe(QueryType.GENERAL_PROGRAMMING);
      expect(result.requiresContext).toBe(false);
      expect(result.detectedPatterns).toContain('general_programming');
    });
  });

  describe('File Reference Queries', () => {
    const fileQueries = [
      'Explain this file: app.js',
      'What does my config.json contain?',
      'Show me the main.py file',
      'Analyze the index.html file',
      'What is in the package.json?',
      'Review this file named utils.ts',
      'Explain this file in my project'
    ];

    test.each(fileQueries)('should classify "%s" as file reference', (query) => {
      const result = queryAnalysisService.analyzeQuery(query);
      
      expect(result.queryType).toBe(QueryType.FILE_REFERENCE);
      expect(result.requiresContext).toBe(true);
      expect(result.detectedPatterns).toContain('file_reference');
    });
  });

  describe('Code Explanation Queries', () => {
    const codeQueries = [
      'Explain this function',
      'What does this code do?',
      'How does this method work?',
      'Analyze this class implementation',
      'What is this variable used for?',
      'Explain this component',
      'How does my implementation work?'
    ];

    test.each(codeQueries)('should classify "%s" as code explanation', (query) => {
      const result = queryAnalysisService.analyzeQuery(query);
      
      expect(result.queryType).toBe(QueryType.CODE_EXPLANATION);
      expect(result.requiresContext).toBe(true);
      expect(result.detectedPatterns).toContain('code_reference');
    });
  });

  describe('Project-Specific Queries', () => {
    const projectQueries = [
      'Show me examples from my codebase',
      'Find similar functions in my project',
      'What patterns are used in our application?',
      'Search for authentication code in my files',
      'How is error handling done in this project?',
      'Find database queries in our codebase'
    ];

    test.each(projectQueries)('should classify "%s" as project specific', (query) => {
      const result = queryAnalysisService.analyzeQuery(query);
      
      expect(result.queryType).toBe(QueryType.PROJECT_SPECIFIC);
      expect(result.requiresContext).toBe(true);
      expect(result.detectedPatterns).toContain('project_specific');
    });
  });

  describe('Documentation Queries', () => {
    const docQueries = [
      'What does the documentation say about authentication?',
      'According to my README, how do I install this?',
      'What is in the project documentation?',
      'Check the docs for API endpoints',
      'What does my documentation say about deployment?'
    ];

    test.each(docQueries)('should classify "%s" as documentation query', (query) => {
      const result = queryAnalysisService.analyzeQuery(query);
      
      expect(result.queryType).toBe(QueryType.DOCUMENTATION_QUERY);
      expect(result.requiresContext).toBe(true);
      expect(result.detectedPatterns).toContain('documentation_query');
    });
  });

  describe('Enhanced Analysis', () => {
    test('should detect contextual references', () => {
      const query = 'Explain this function and how it relates to the above code';
      const result = queryAnalysisService.analyzeQueryEnhanced(query);
      
      expect(result.advancedPatterns).toContain('contextual_reference');
      expect(result.requiresContext).toBe(true);
    });

    test('should detect learning requests', () => {
      const query = 'I want to learn about React hooks fundamentals';
      const result = queryAnalysisService.analyzeQueryEnhanced(query);
      
      expect(result.advancedPatterns).toContain('learning_request');
      expect(result.requiresContext).toBe(false);
    });

    test('should detect debugging requests', () => {
      const query = 'Why is my function not working correctly?';
      const result = queryAnalysisService.analyzeQueryEnhanced(query);
      
      expect(result.advancedPatterns).toContain('debugging_request');
      expect(result.requiresContext).toBe(true);
    });

    test('should analyze query complexity', () => {
      const simpleQuery = 'What is a loop?';
      const complexQuery = 'Analyze the implementation of the asynchronous data processing pipeline in my microservices architecture';
      
      const simpleResult = queryAnalysisService.analyzeQueryEnhanced(simpleQuery);
      const complexResult = queryAnalysisService.analyzeQueryEnhanced(complexQuery);
      
      expect(simpleResult.complexity).toBe('low');
      expect(complexResult.complexity).toBe('high');
      expect(complexResult.specificity).toBeGreaterThan(simpleResult.specificity);
    });
  });

  describe('Configuration', () => {
    test('should respect context threshold', () => {
      queryAnalysisService.updateConfig({ contextThreshold: 0.9 });
      
      const query = 'How to implement authentication?'; // Ambiguous query
      const result = queryAnalysisService.analyzeQuery(query);
      
      // With high threshold, should not require context
      expect(result.requiresContext).toBe(false);
    });

    test('should respect strict mode', () => {
      queryAnalysisService.updateConfig({ enableStrictMode: true });
      
      const query = 'What is a function?'; // General programming
      const result = queryAnalysisService.analyzeQuery(query);
      
      // In strict mode, might still use context for safety
      expect(result.queryType).toBe(QueryType.GENERAL_PROGRAMMING);
    });

    test('should handle analysis timeout', () => {
      queryAnalysisService.updateConfig({ maxAnalysisTime: 1 });
      
      const query = 'Complex query that might take time to analyze';
      const startTime = Date.now();
      const result = queryAnalysisService.analyzeQuery(query);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(50); // Should be fast
      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty query', () => {
      const result = queryAnalysisService.analyzeQuery('');
      
      expect(result).toBeDefined();
      expect(result.requiresContext).toBe(true); // Fail safe
    });

    test('should handle very short queries', () => {
      const result = queryAnalysisService.analyzeQuery('help');
      
      expect(result).toBeDefined();
      expect(result.confidence).toBeLessThan(0.7); // Low confidence for short queries
    });

    test('should handle very long queries', () => {
      const longQuery = 'This is a very long query that contains many words and technical terms like function, class, method, variable, component, and implementation. It should be analyzed properly despite its length and complexity.';
      const result = queryAnalysisService.analyzeQueryEnhanced(longQuery);
      
      expect(result).toBeDefined();
      expect(result.complexity).toBe('high');
      expect(result.technicalTerms).toBeGreaterThan(3);
    });

    test('should handle mixed patterns', () => {
      const query = 'Explain this function in my project and also teach me about general programming concepts';
      const result = queryAnalysisService.analyzeQuery(query);
      
      expect(result.detectedPatterns.length).toBeGreaterThan(1);
      expect(result.requiresContext).toBe(true); // Should prioritize context-requiring patterns
    });
  });
});
