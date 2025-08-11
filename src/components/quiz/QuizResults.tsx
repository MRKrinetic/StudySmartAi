import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  RotateCcw,
  Target,
  Award,
  TrendingUp
} from 'lucide-react';
import { Quiz, QuizSession, QuizResult } from '@/types';
import { cn } from '@/lib/utils';

interface QuizResultsProps {
  quiz: Quiz;
  session: QuizSession;
  result: QuizResult;
  onReturnToChat: () => void;
  onRetakeQuiz?: () => void;
  onReviewAnswers?: () => void;
  className?: string;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  quiz,
  session,
  result,
  onReturnToChat,
  onRetakeQuiz,
  onReviewAnswers,
  className
}) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPerformanceLevel = (percentage: number): { level: string; color: string; icon: React.ReactNode } => {
    if (percentage >= 90) {
      return { 
        level: 'Excellent', 
        color: 'text-green-600', 
        icon: <Trophy className="h-5 w-5 text-yellow-500" />
      };
    } else if (percentage >= 80) {
      return { 
        level: 'Very Good', 
        color: 'text-blue-600', 
        icon: <Award className="h-5 w-5 text-blue-500" />
      };
    } else if (percentage >= 70) {
      return { 
        level: 'Good', 
        color: 'text-green-600', 
        icon: <Target className="h-5 w-5 text-green-500" />
      };
    } else if (percentage >= 60) {
      return { 
        level: 'Fair', 
        color: 'text-yellow-600', 
        icon: <TrendingUp className="h-5 w-5 text-yellow-500" />
      };
    } else {
      return { 
        level: 'Needs Improvement', 
        color: 'text-red-600', 
        icon: <XCircle className="h-5 w-5 text-red-500" />
      };
    }
  };

  const performance = getPerformanceLevel(result.percentage);
  const averageTimePerQuestion = result.timeSpent / result.totalQuestions;

  return (
    <div className={cn("w-full h-full bg-background flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReturnToChat}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Chat
            </Button>
          </div>
          <Badge variant={result.passed ? "default" : "destructive"}>
            {result.passed ? 'Passed' : 'Failed'}
          </Badge>
        </div>
      </div>

      {/* Results Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Main Results Card */}
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                {performance.icon}
              </div>
              <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
              <p className="text-muted-foreground">{quiz.title}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score Overview */}
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <div className="text-4xl font-bold">{result.percentage}%</div>
                  <div className={cn("text-lg font-medium", performance.color)}>
                    {performance.level}
                  </div>
                  <Progress value={result.percentage} className="w-full max-w-md mx-auto" />
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{result.correctAnswers}</div>
                    <div className="text-sm text-muted-foreground">Correct</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {result.totalQuestions - result.correctAnswers}
                    </div>
                    <div className="text-sm text-muted-foreground">Incorrect</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{result.totalQuestions}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Performance Details</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Final Score:</span>
                      <span className="font-medium">{result.score}/{result.totalQuestions}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Percentage:</span>
                      <span className="font-medium">{result.percentage}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Passing Score:</span>
                      <span className="font-medium">{quiz.passingScore}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Difficulty:</span>
                      <Badge variant="outline" className="text-xs">
                        {quiz.difficulty}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Time Analysis</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Time:</span>
                      <span className="font-medium">{formatTime(result.timeSpent)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Avg per Question:</span>
                      <span className="font-medium">{formatTime(Math.round(averageTimePerQuestion))}</span>
                    </div>
                    
                    {quiz.timeLimit && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Time Limit:</span>
                        <span className="font-medium">{quiz.timeLimit} min</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Completed:</span>
                      <span className="font-medium">
                        {new Date(result.completedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category and Tags */}
              {(quiz.category || quiz.tags.length > 0) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold">Quiz Information</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{quiz.category}</Badge>
                      {quiz.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onReviewAnswers && (
              <Button variant="outline" onClick={onReviewAnswers}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Review Answers
              </Button>
            )}

            {onRetakeQuiz && (
              <Button variant="outline" onClick={onRetakeQuiz}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Quiz
              </Button>
            )}

            <Button onClick={onReturnToChat}>
              Return to Chat
            </Button>
          </div>

          {/* Encouragement Message */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                {result.passed ? (
                  <>
                    <h4 className="font-semibold text-green-600">Congratulations! 🎉</h4>
                    <p className="text-sm text-muted-foreground">
                      You've successfully passed this quiz. Great job on demonstrating your knowledge!
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="font-semibold text-blue-600">Keep Learning! 📚</h4>
                    <p className="text-sm text-muted-foreground">
                      Don't worry! Learning is a process. Review the material and try again when you're ready.
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
