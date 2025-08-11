import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, Settings, Clock, Target, FileText, Sparkles } from 'lucide-react';
import { QuizGenerationRequest } from '@/types';
import { cn } from '@/lib/utils';

interface QuizGenerationDialogProps {
  onGenerate: (request: QuizGenerationRequest) => Promise<void>;
  onCancel: () => void;
  isGenerating?: boolean;
  className?: string;
}

const QuizGenerationDialog: React.FC<QuizGenerationDialogProps> = ({
  onGenerate,
  onCancel,
  isGenerating = false,
  className
}) => {
  const [formData, setFormData] = useState<QuizGenerationRequest>({
    sourceType: 'chromadb',
    questionCount: 10,
    difficulty: 'medium',
    questionTypes: ['multiple_choice'],
    category: 'Programming',
    tags: [],
    timeLimit: 15,
    focusTopics: []
  });

  const [customTag, setCustomTag] = useState('');
  const [customTopic, setCustomTopic] = useState('');

  const questionTypeOptions = [
    { value: 'multiple_choice', label: 'Multiple Choice', description: '4 options to choose from' },
    { value: 'true_false', label: 'True/False', description: 'Simple true or false questions' },
    { value: 'fill_in_blank', label: 'Fill in the Blank', description: 'Type the correct answer' }
  ];

  const difficultyOptions = [
    { value: 'easy', label: 'Easy', description: 'Basic concepts and definitions' },
    { value: 'medium', label: 'Medium', description: 'Application and understanding' },
    { value: 'hard', label: 'Hard', description: 'Complex analysis and synthesis' },
    { value: 'mixed', label: 'Mixed', description: 'Variety of difficulty levels' }
  ];

  const categoryOptions = [
    'Programming', 'Web Development', 'Data Science', 'Machine Learning',
    'Software Engineering', 'Computer Science', 'Mathematics', 'Physics',
    'Chemistry', 'Biology', 'History', 'Literature', 'Business', 'Other'
  ];

  const handleQuestionTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        questionTypes: [...prev.questionTypes, type as any]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        questionTypes: prev.questionTypes.filter(t => t !== type)
      }));
    }
  };

  const addTag = () => {
    if (customTag.trim() && !formData.tags?.includes(customTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), customTag.trim()]
      }));
      setCustomTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const addTopic = () => {
    if (customTopic.trim() && !formData.focusTopics?.includes(customTopic.trim())) {
      setFormData(prev => ({
        ...prev,
        focusTopics: [...(prev.focusTopics || []), customTopic.trim()]
      }));
      setCustomTopic('');
    }
  };

  const removeTopic = (topicToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      focusTopics: prev.focusTopics?.filter(topic => topic !== topicToRemove) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.questionTypes.length === 0) {
      alert('Please select at least one question type.');
      return;
    }
    await onGenerate(formData);
  };

  return (
    <div className={cn("w-full h-full bg-background flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-semibold">Create Quiz</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Generate a personalized quiz based on your uploaded content
        </p>
      </div>

      {/* Form Content */}
      <div className="flex-1 p-6 overflow-auto">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
  
          {/* Question Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4" />
                Question Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {questionTypeOptions.map(option => (
                <div key={option.value} className="flex items-start space-x-3">
                  <Checkbox
                    id={option.value}
                    checked={formData.questionTypes.includes(option.value as any)}
                    onCheckedChange={(checked) => 
                      handleQuestionTypeChange(option.value, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="font-medium">
                      {option.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Advanced Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4" />
                Advanced Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min="1"
                  max="300"
                  value={formData.timeLimit || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    timeLimit: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  placeholder="No time limit"
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    Add
                  </Button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Focus Topics (Optional)</Label>
                <p className="text-sm text-muted-foreground">
                  Specify topics to focus the quiz on specific areas of your content
                </p>
                <div className="flex gap-2">
                  <Input
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Add a focus topic..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                  />
                  <Button type="button" onClick={addTopic} size="sm">
                    Add
                  </Button>
                </div>
                {formData.focusTopics && formData.focusTopics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.focusTopics.map((topic, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => removeTopic(topic)}
                      >
                        {topic} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isGenerating || formData.questionTypes.length === 0}>
              {isGenerating ? 'Generating...' : 'Generate Quiz'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizGenerationDialog;
