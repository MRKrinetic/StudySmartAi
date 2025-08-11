import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw,
  BookOpen,
  Target,
  Clock,
  Brain
} from 'lucide-react';
import { Quiz, QuizSession, QuizAnswer, QuizQuestion } from '@/types';
import { cn } from '@/lib/utils';

interface QuizReviewProps {
  quiz: Quiz;
  session: QuizSession;
  onReturnToResults: () => void;
  onRetakeQuiz?: () => void;
  className?: string;
}

const QuizReview: React.FC<QuizReviewProps> = ({
  quiz,
  session,
  onReturnToResults,
  onRetakeQuiz,
  className
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'correct'>('all');

  // Filter questions based on review filter
  const getFilteredQuestions = () => {
    const questionsWithAnswers = quiz.questions.map(question => {
      const userAnswer = session.answers.find(a => a.questionId === question.id);
      return { question, userAnswer };
    });

    switch (reviewFilter) {
      case 'incorrect':
        return questionsWithAnswers.filter(({ userAnswer }) => userAnswer && !userAnswer.isCorrect);
      case 'correct':
        return questionsWithAnswers.filter(({ userAnswer }) => userAnswer && userAnswer.isCorrect);
      default:
        return questionsWithAnswers;
    }
  };

  const filteredQuestions = getFilteredQuestions();
  const currentItem = filteredQuestions[currentQuestionIndex];

  if (!currentItem) {
    return (
      <div className={cn("w-full h-full bg-background flex flex-col items-center justify-center", className)}>
        <p className="text-muted-foreground">No questions to review</p>
        <Button onClick={onReturnToResults} className="mt-4">
          Return to Results
        </Button>
      </div>
    );
  }

  const { question, userAnswer } = currentItem;

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => {
              const isUserAnswer = userAnswer?.userAnswer === index;
              const isCorrectAnswer = question.correctAnswer === index;
              
              return (
                <div
                  key={index}
                  className={cn(
                    "p-3 border rounded-md",
                    isCorrectAnswer && "bg-green-50 border-green-200",
                    isUserAnswer && !isCorrectAnswer && "bg-red-50 border-red-200",
                    !isUserAnswer && !isCorrectAnswer && "bg-gray-50 border-gray-200"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                    <span>{option}</span>
                    <div className="ml-auto flex items-center gap-1">
                      {isCorrectAnswer && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {isUserAnswer && !isCorrectAnswer && <XCircle className="h-4 w-4 text-red-600" />}
                      {isUserAnswer && (
                        <Badge variant={isCorrectAnswer ? "default" : "destructive"} className="text-xs">
                          Your Answer
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-3">
            {['true', 'false'].map((option) => {
              const isUserAnswer = String(userAnswer?.userAnswer).toLowerCase() === option;
              const isCorrectAnswer = String(question.correctAnswer).toLowerCase() === option;
              
              return (
                <div
                  key={option}
                  className={cn(
                    "p-3 border rounded-md",
                    isCorrectAnswer && "bg-green-50 border-green-200",
                    isUserAnswer && !isCorrectAnswer && "bg-red-50 border-red-200",
                    !isUserAnswer && !isCorrectAnswer && "bg-gray-50 border-gray-200"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{option}</span>
                    <div className="ml-auto flex items-center gap-1">
                      {isCorrectAnswer && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {isUserAnswer && !isCorrectAnswer && <XCircle className="h-4 w-4 text-red-600" />}
                      {isUserAnswer && (
                        <Badge variant={isCorrectAnswer ? "default" : "destructive"} className="text-xs">
                          Your Answer
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'fill_in_blank':
        return (
          <div className="space-y-3">
            <div className="p-3 border rounded-md bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Your Answer:</span>
                <Badge variant={userAnswer?.isCorrect ? "default" : "destructive"}>
                  {userAnswer?.isCorrect ? 'Correct' : 'Incorrect'}
                </Badge>
              </div>
              <p className="font-medium mt-1">{userAnswer?.userAnswer || 'No answer provided'}</p>
            </div>
            
            <div className="p-3 border rounded-md bg-green-50 border-green-200">
              <span className="text-sm text-muted-foreground">Correct Answer:</span>
              <p className="font-medium mt-1">{question.correctAnswer}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("w-full h-full bg-background flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReturnToResults}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Results
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Review Mode</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quiz Review</h2>
            <Badge variant="secondary">
              {currentQuestionIndex + 1} of {filteredQuestions.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="p-4 border-b border-border">
        <Tabs value={reviewFilter} onValueChange={(value) => {
          setReviewFilter(value as any);
          setCurrentQuestionIndex(0);
        }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Questions</TabsTrigger>
            <TabsTrigger value="incorrect">Incorrect Only</TabsTrigger>
            <TabsTrigger value="correct">Correct Only</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Question Content */}
      <div className="flex-1 p-6 overflow-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Question {quiz.questions.findIndex(q => q.id === question.id) + 1}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {question.difficulty}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {question.points} pts
                </Badge>
                {userAnswer && (
                  <Badge variant={userAnswer.isCorrect ? "default" : "destructive"} className="text-xs">
                    {userAnswer.isCorrect ? 'Correct' : 'Incorrect'}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg leading-relaxed">{question.question}</p>
            
            {renderQuestionContent()}

            {/* Answer Analysis */}
            {userAnswer && (
              <div className="space-y-4">
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Time Spent:</span>
                    <span className="font-medium">{formatTime(userAnswer.timeSpent)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Result:</span>
                    <span className={cn(
                      "font-medium",
                      userAnswer.isCorrect ? "text-green-600" : "text-red-600"
                    )}>
                      {userAnswer.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Points:</span>
                    <span className="font-medium">
                      {userAnswer.isCorrect ? question.points : 0}/{question.points}
                    </span>
                  </div>
                </div>

                {/* Explanation */}
                {question.explanation && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="font-medium text-blue-900 mb-2">Explanation</h4>
                    <p className="text-blue-800 text-sm">{question.explanation}</p>
                  </div>
                )}

                {/* Source Information */}
                {question.sourceFile && (
                  <div className="p-3 bg-gray-50 border rounded-md">
                    <p className="text-xs text-muted-foreground">
                      Source: {question.sourceFile}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {onRetakeQuiz && (
              <Button variant="outline" onClick={onRetakeQuiz}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Retake Quiz
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentQuestionIndex === filteredQuestions.length - 1}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizReview;
