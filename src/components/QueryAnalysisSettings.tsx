/**
 * Query Analysis Settings Component
 * Allows users to configure the intelligent query analysis system
 */

import { useState, useEffect } from 'react';
import { Settings, Brain, Zap, Target, Bug, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import queryAnalysisConfigService, { QueryAnalysisSettings, QUERY_ANALYSIS_PRESETS } from '@/services/queryAnalysisConfig';

interface QueryAnalysisSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const QueryAnalysisSettings = ({ isOpen, onClose }: QueryAnalysisSettingsProps) => {
  const [settings, setSettings] = useState<QueryAnalysisSettings>(queryAnalysisConfigService.getSettings());
  const [currentPreset, setCurrentPreset] = useState<string | null>(queryAnalysisConfigService.getCurrentPresetName());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(queryAnalysisConfigService.getSettings());
      setCurrentPreset(queryAnalysisConfigService.getCurrentPresetName());
      setHasChanges(false);
    }
  }, [isOpen]);

  const handleSettingChange = (key: keyof QueryAnalysisSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasChanges(true);
    setCurrentPreset(null); // Custom configuration
  };

  const handlePresetChange = (presetName: string) => {
    const preset = QUERY_ANALYSIS_PRESETS.find(p => p.name === presetName);
    if (preset) {
      setSettings(preset.config);
      setCurrentPreset(presetName);
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    queryAnalysisConfigService.updateSettings(settings);
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    queryAnalysisConfigService.resetToDefault();
    setSettings(queryAnalysisConfigService.getSettings());
    setCurrentPreset(queryAnalysisConfigService.getCurrentPresetName());
    setHasChanges(false);
  };

  const getPresetIcon = (presetName: string) => {
    switch (presetName) {
      case 'performance':
        return <Zap className="h-4 w-4" />;
      case 'accuracy':
        return <Target className="h-4 w-4" />;
      case 'debug':
        return <Bug className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getPresetColor = (presetName: string) => {
    switch (presetName) {
      case 'performance':
        return 'text-blue-500';
      case 'accuracy':
        return 'text-green-500';
      case 'debug':
        return 'text-orange-500';
      case 'disabled':
        return 'text-gray-500';
      default:
        return 'text-purple-500';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Query Analysis Settings
            </CardTitle>
            <CardDescription>
              Configure how the AI analyzes your queries to optimize performance
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Presets */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Configuration Presets</Label>
            <Select value={currentPreset || 'custom'} onValueChange={handlePresetChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent>
                {QUERY_ANALYSIS_PRESETS.map((preset) => (
                  <SelectItem key={preset.name} value={preset.name}>
                    <div className="flex items-center gap-2">
                      <span className={getPresetColor(preset.name)}>
                        {getPresetIcon(preset.name)}
                      </span>
                      <span className="capitalize">{preset.name}</span>
                    </div>
                  </SelectItem>
                ))}
                {!currentPreset && (
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-gray-500" />
                      <span>Custom</span>
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            
            {currentPreset && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {QUERY_ANALYSIS_PRESETS.find(p => p.name === currentPreset)?.description}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Main Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enable-analysis">Enable Query Analysis</Label>
                <p className="text-xs text-muted-foreground">
                  Analyze queries to determine if context retrieval is needed
                </p>
              </div>
              <Switch
                id="enable-analysis"
                checked={settings.enableQueryAnalysis}
                onCheckedChange={(checked) => handleSettingChange('enableQueryAnalysis', checked)}
              />
            </div>

            {settings.enableQueryAnalysis && (
              <>
                <div className="space-y-2">
                  <Label>Context Threshold: {(settings.contextThreshold * 100).toFixed(0)}%</Label>
                  <p className="text-xs text-muted-foreground">
                    Confidence level required to use context retrieval
                  </p>
                  <Slider
                    value={[settings.contextThreshold]}
                    onValueChange={([value]) => handleSettingChange('contextThreshold', value)}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="strict-mode">Strict Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Err on the side of using context when uncertain
                    </p>
                  </div>
                  <Switch
                    id="strict-mode"
                    checked={settings.enableStrictMode}
                    onCheckedChange={(checked) => handleSettingChange('enableStrictMode', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Analysis Time: {settings.maxAnalysisTime}ms</Label>
                  <p className="text-xs text-muted-foreground">
                    Maximum time to spend analyzing each query
                  </p>
                  <Slider
                    value={[settings.maxAnalysisTime]}
                    onValueChange={([value]) => handleSettingChange('maxAnalysisTime', value)}
                    min={10}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* Advanced Settings */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Advanced Options</Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="performance-logging">Performance Logging</Label>
                <p className="text-xs text-muted-foreground">
                  Log response times and analysis metrics
                </p>
              </div>
              <Switch
                id="performance-logging"
                checked={settings.enablePerformanceLogging}
                onCheckedChange={(checked) => handleSettingChange('enablePerformanceLogging', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="debug-mode">Debug Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Show detailed analysis information in console
                </p>
              </div>
              <Switch
                id="debug-mode"
                checked={settings.enableDebugMode}
                onCheckedChange={(checked) => handleSettingChange('enableDebugMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="fallback-context">Fallback to Context</Label>
                <p className="text-xs text-muted-foreground">
                  Use context when analysis is uncertain or fails
                </p>
              </div>
              <Switch
                id="fallback-context"
                checked={settings.fallbackToContext}
                onCheckedChange={(checked) => handleSettingChange('fallbackToContext', checked)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleReset}>
              Reset to Default
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges}>
                Save Changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QueryAnalysisSettings;
