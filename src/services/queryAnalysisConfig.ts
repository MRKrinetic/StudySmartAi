/**
 * Configuration service for query analysis
 * Provides centralized configuration management for the intelligent query analysis system
 */

import { QueryAnalysisConfig } from './queryAnalysisService';

export interface QueryAnalysisSettings extends QueryAnalysisConfig {
  enableQueryAnalysis: boolean;
  enablePerformanceLogging: boolean;
  enableDebugMode: boolean;
  fallbackToContext: boolean; // If true, use context when analysis is uncertain
}

export interface QueryAnalysisPreset {
  name: string;
  description: string;
  config: QueryAnalysisSettings;
}

// Predefined configuration presets
export const QUERY_ANALYSIS_PRESETS: QueryAnalysisPreset[] = [
  {
    name: 'balanced',
    description: 'Balanced performance and accuracy (recommended)',
    config: {
      enableQueryAnalysis: true,
      contextThreshold: 0.6,
      enableStrictMode: false,
      maxAnalysisTime: 100,
      enablePerformanceLogging: true,
      enableDebugMode: false,
      fallbackToContext: false
    }
  },
  {
    name: 'performance',
    description: 'Optimized for speed, minimal context usage',
    config: {
      enableQueryAnalysis: true,
      contextThreshold: 0.8,
      enableStrictMode: false,
      maxAnalysisTime: 50,
      enablePerformanceLogging: true,
      enableDebugMode: false,
      fallbackToContext: false
    }
  },
  {
    name: 'accuracy',
    description: 'Optimized for accuracy, more context usage',
    config: {
      enableQueryAnalysis: true,
      contextThreshold: 0.4,
      enableStrictMode: true,
      maxAnalysisTime: 200,
      enablePerformanceLogging: true,
      enableDebugMode: false,
      fallbackToContext: true
    }
  },
  {
    name: 'debug',
    description: 'Debug mode with detailed logging',
    config: {
      enableQueryAnalysis: true,
      contextThreshold: 0.6,
      enableStrictMode: false,
      maxAnalysisTime: 200,
      enablePerformanceLogging: true,
      enableDebugMode: true,
      fallbackToContext: false
    }
  },
  {
    name: 'disabled',
    description: 'Query analysis disabled, always use context',
    config: {
      enableQueryAnalysis: false,
      contextThreshold: 0.0,
      enableStrictMode: true,
      maxAnalysisTime: 0,
      enablePerformanceLogging: false,
      enableDebugMode: false,
      fallbackToContext: true
    }
  }
];

class QueryAnalysisConfigService {
  private currentSettings: QueryAnalysisSettings;
  private readonly STORAGE_KEY = 'queryAnalysisSettings';

  constructor() {
    this.currentSettings = this.loadSettings();
  }

  /**
   * Load settings from localStorage or use default
   */
  private loadSettings(): QueryAnalysisSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...QUERY_ANALYSIS_PRESETS[0].config, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load query analysis settings:', error);
    }
    
    // Return default (balanced) settings
    return { ...QUERY_ANALYSIS_PRESETS[0].config };
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentSettings));
    } catch (error) {
      console.warn('Failed to save query analysis settings:', error);
    }
  }

  /**
   * Get current settings
   */
  getSettings(): QueryAnalysisSettings {
    return { ...this.currentSettings };
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<QueryAnalysisSettings>): void {
    this.currentSettings = { ...this.currentSettings, ...newSettings };
    this.saveSettings();
  }

  /**
   * Apply a preset configuration
   */
  applyPreset(presetName: string): boolean {
    const preset = QUERY_ANALYSIS_PRESETS.find(p => p.name === presetName);
    if (preset) {
      this.currentSettings = { ...preset.config };
      this.saveSettings();
      return true;
    }
    return false;
  }

  /**
   * Get available presets
   */
  getPresets(): QueryAnalysisPreset[] {
    return [...QUERY_ANALYSIS_PRESETS];
  }

  /**
   * Get current preset name (if any)
   */
  getCurrentPresetName(): string | null {
    for (const preset of QUERY_ANALYSIS_PRESETS) {
      if (JSON.stringify(preset.config) === JSON.stringify(this.currentSettings)) {
        return preset.name;
      }
    }
    return null; // Custom configuration
  }

  /**
   * Reset to default settings
   */
  resetToDefault(): void {
    this.currentSettings = { ...QUERY_ANALYSIS_PRESETS[0].config };
    this.saveSettings();
  }

  /**
   * Validate settings
   */
  validateSettings(settings: Partial<QueryAnalysisSettings>): string[] {
    const errors: string[] = [];

    if (settings.contextThreshold !== undefined) {
      if (settings.contextThreshold < 0 || settings.contextThreshold > 1) {
        errors.push('Context threshold must be between 0 and 1');
      }
    }

    if (settings.maxAnalysisTime !== undefined) {
      if (settings.maxAnalysisTime < 0 || settings.maxAnalysisTime > 1000) {
        errors.push('Max analysis time must be between 0 and 1000ms');
      }
    }

    return errors;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    averageAnalysisTime: number;
    contextUsageRate: number;
    totalQueries: number;
  } {
    // This would be implemented with actual metrics collection
    // For now, return mock data
    return {
      averageAnalysisTime: 45,
      contextUsageRate: 0.35,
      totalQueries: 127
    };
  }
}

// Export singleton instance
export const queryAnalysisConfigService = new QueryAnalysisConfigService();
export default queryAnalysisConfigService;
