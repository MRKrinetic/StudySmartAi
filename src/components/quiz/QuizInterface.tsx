import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { Quiz, QuizSession, QuizAnswer, QuizQuestion } from '@/types';
import { cn } from '@/lib/utils';

interface QuizInterfaceProps {
  quiz: Quiz;
  session: QuizSession;
  onAnswerSubmit: (questionId: string, answer: string | number, timeSpent: number) => Promise<void>;
  onQuizComplete: () => Promise<void>;
  onReturnToChat: () => void;
  className?: string;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({
  quiz,
  session,
  onAnswerSubmit,
  onQuizComplete,
  onReturnToChat,
  className
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(session.currentQuestionIndex || 0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number>('');
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  
  // Check if current question is already answered
  const existingAnswer = session.answers.find(a => a.questionId === currentQuestion?.id);
  const isAnswered = !!existingAnswer;

  useEffect(() => {
    setQuestionStartTime(Date.now());
    setSelectedAnswer('');
    setShowFeedback(false);
    setLastSubmissionResult(null);
  }, [currentQuestionIndex]);

  const handleAnswerSelect = (answer: string | number) => {
    if (isAnswered) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer && selectedAnswer !== 0) return;
    if (isAnswered || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      await onAnswerSubmit(currentQuestion.id, selectedAnswer, timeSpent);
      
      // Show feedback for a moment
      setShowFeedback(true);
      setLastSubmissionResult({ isCorrect: true }); // This would come from the API response
      
      // Auto-advance after showing feedback
      setTimeout(() => {
        if (isLastQuestion) {
          handleCompleteQuiz();
        } else {
          handleNextQuestion();
        }
      }, 2000);
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleCompleteQuiz = async () => {
    try {
      await onQuizComplete();
    } catch (error) {
      console.error('Error completing quiz:', error);
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <Button
                key={index}
                variant={selectedAnswer === index ? "default" : "outline"}
                className={cn(
                  "w-full text-left justify-start h-auto p-4",
                  isAnswered && "cursor-not-allowed opacity-60",
                  existingAnswer && existingAnswer.userAnswer === index && 
                    (existingAnswer.isCorrect ? "bg-green-100 border-green-500" : "bg-red-100 border-red-500")
                )}
                onClick={() => handleAnswerSelect(index)}
                disabled={isAnswered}
              >
                <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                {option}
              </Button>
            ))}
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-3">
            {['true', 'false'].map((option) => (
              <Button
                key={option}
                variant={selectedAnswer === option ? "default" : "outline"}
                className={cn(
                  "w-full text-left justify-start h-auto p-4",
                  isAnswered && "cursor-not-allowed opacity-60",
                  existingAnswer && existingAnswer.userAnswer === option && 
                    (existingAnswer.isCorrect ? "bg-green-100 border-green-500" : "bg-red-100 border-red-500")
                )}
                onClick={() => handleAnswerSelect(option)}
                disabled={isAnswered}
              >
                {option === 'true' ? 'True' : 'False'}
              </Button>
            ))}
          </div>
        );

      case 'fill_in_blank':
        return (
          <div className="space-y-3">
            <input
              type="text"
              value={selectedAnswer as string}
              onChange={(e) => handleAnswerSelect(e.target.value)}
              placeholder="Type your answer here..."
              className={cn(
                "w-full p-3 border rounded-md",
                isAnswered && "cursor-not-allowed opacity-60"
              )}
              disabled={isAnswered}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading question...</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full bg-background flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
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
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {quiz.timeLimit ? `${quiz.timeLimit} min limit` : 'No time limit'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{quiz.title}</h2>
            <Badge variant="secondary">
              {currentQuestionIndex + 1} of {quiz.questions.length}
            </Badge>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 p-6 overflow-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Question {currentQuestionIndex + 1}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {currentQuestion.difficulty}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {currentQuestion.points} pts
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg leading-relaxed">{currentQuestion.question}</p>
            
            {renderQuestion()}

            {/* Feedback */}
            {showFeedback && lastSubmissionResult && (
              <div className={cn(
                "p-4 rounded-md border",
                lastSubmissionResult.isCorrect 
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {lastSubmissionResult.isCorrect ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span className="font-medium">
                    {lastSubmissionResult.isCorrect ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
                {currentQuestion.explanation && (
                  <p className="text-sm">{currentQuestion.explanation}</p>
                )}
              </div>
            )}

            {/* Show answer if already answered */}
            {isAnswered && existingAnswer && (
              <div className={cn(
                "p-4 rounded-md border",
                existingAnswer.isCorrect 
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {existingAnswer.isCorrect ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span className="font-medium">
                    {existingAnswer.isCorrect ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
                {currentQuestion.explanation && (
                  <p className="text-sm">{currentQuestion.explanation}</p>
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
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {!isAnswered && (
              <Button
                onClick={handleSubmitAnswer}
                disabled={(!selectedAnswer && selectedAnswer !== 0) || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </Button>
            )}

            {isAnswered && !isLastQuestion && (
              <Button onClick={handleNextQuestion}>
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}

            {isAnswered && isLastQuestion && (
              <Button onClick={handleCompleteQuiz}>
                Complete Quiz
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizInterface;
