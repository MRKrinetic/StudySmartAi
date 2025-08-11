import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles, FileText, Brain, AlertCircle, Search, Settings, File, Database, CheckCircle, XCircle, Mic, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { sendMessageWithFileContext, isGeminiConfigured, SemanticSearchResult } from "@/services/geminiApi";
import { QueryAnalysisResult } from "@/services/queryAnalysisService";
import { useQuiz } from "@/contexts/QuizContext";
import { quizService } from "@/services/quizService";
import { QuizGenerationRequest } from "@/types";
import QueryAnalysisSettings from "./QueryAnalysisSettings";
import QuizGenerationDialog from "./quiz/QuizGenerationDialog";
import QuizInterface from "./quiz/QuizInterface";
import QuizResults from "./quiz/QuizResults";
import QuizReview from "./quiz/QuizReview";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';


interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'error';
  timestamp: Date;
  contextFiles?: SemanticSearchResult[];
  searchPerformed?: boolean;
  queryAnalysis?: QueryAnalysisResult;
  responseTime?: number;
}

const mockMessages: Message[] = [
  {
    id: '1',
    content: 'Hello! I\'m your AI assistant powered by Gemini 1.5 Flash with file indexing. I can help you with your notebooks, search through your files, generate summaries, create quizzes, and answer questions about your code. I have access to your file index and can reference specific files when answering questions. What would you like to do?',
    role: 'assistant',
    timestamp: new Date()
  },
  {
    id: '2',
    content: 'Can you summarize the binary search notes I just created?',
    role: 'user',
    timestamp: new Date()
  },
  {
    id: '3',
    content: `Based on your binary search notes, here's a summary:

## Binary Search Algorithm

**Binary Search** is an efficient search algorithm for sorted arrays with **O(log n)** time complexity. The algorithm works by repeatedly dividing the search space in half, comparing the target with the middle element, and eliminating half of the remaining elements.

### Key Points:
- ✅ Requires **sorted input**
- ⏱️ Time: \`O(log n)\`, Space: \`O(1)\` iterative
- 🚀 Much faster than linear search for large datasets
- 📊 Ideal for large, sorted collections

### Example Implementation:

\`\`\`python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1

    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1  # Not found
\`\`\`

> 💡 **Pro Tip**: Binary search is perfect when you need to find elements in sorted data structures quickly!`,
    role: 'assistant',
    timestamp: new Date()
  }
];

interface VectorDbStatus {
  activeService: 'chromadb' | 'simple';
  isHealthy: boolean;
  totalEmbeddings: number;
}

const AIChatSidebar = () => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isConfigured] = useState(isGeminiConfigured());
  const [showContextFiles, setShowContextFiles] = useState(true);
  const [vectorDbStatus, setVectorDbStatus] = useState<VectorDbStatus | null>(null);
  const [showQuerySettings, setShowQuerySettings] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Quiz context
  const {
    state: quizState,
    startQuizGeneration,
    setGenerationSuccess,
    setGenerationError,
    startReview,
    returnToChat
  } = useQuiz();

  // Fetch vector database status
  const fetchVectorDbStatus = async () => {
    try {
      const response = await fetch('/api/semantic/vector-db-status');

      if (!response.ok) {
        console.warn(`Vector DB status endpoint returned ${response.status}: ${response.statusText}`);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Vector DB status endpoint returned non-JSON response. Service may be unavailable.');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setVectorDbStatus(data.data);
      } else {
        console.warn('Vector DB status check failed:', data.message);
      }
    } catch (error) {
      console.warn('Failed to fetch vector DB status:', error);
    }
  };

  // Fetch status on component mount and periodically
  useEffect(() => {
    fetchVectorDbStatus();
    const interval = setInterval(fetchVectorDbStatus, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  };

  const startRecording = () => {
    setIsRecording(true);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setInputValue(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } else {
      console.error('Speech recognition not supported in this browser.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Component to render vector database status
  const VectorDbStatusDisplay = () => {
    if (!vectorDbStatus) return null;

    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg text-sm">
        <Database className="h-4 w-4" />
        <span>Vector DB:</span>
        <Badge
          variant={vectorDbStatus.isHealthy ? "default" : "destructive"}
          className={vectorDbStatus.isHealthy ? "bg-green-500" : ""}
        >
          {vectorDbStatus.isHealthy ? (
            <CheckCircle className="h-3 w-3 mr-1" />
          ) : (
            <XCircle className="h-3 w-3 mr-1" />
          )}
          {vectorDbStatus.activeService === 'chromadb' ? 'ChromaDB' : 'Simple'}
        </Badge>
        <span className="text-muted-foreground">
          {vectorDbStatus.totalEmbeddings} docs
        </span>
      </div>
    );
  };

  // Component to render context files
  const ContextFilesDisplay = ({ contextFiles, searchPerformed }: {
    contextFiles?: SemanticSearchResult[],
    searchPerformed?: boolean
  }) => {
    if (!searchPerformed || !contextFiles || contextFiles.length === 0) {
      return null;
    }

    return (
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-start p-2 h-auto">
            <Search className="h-3 w-3 mr-2" />
            <span className="text-xs text-muted-foreground">
              Found {contextFiles.length} relevant file{contextFiles.length !== 1 ? 's' : ''}
            </span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 mt-1">
          {contextFiles.map((file, index) => (
            <div key={index} className="flex items-start gap-2 p-2 bg-muted/50 rounded text-xs">
              <File className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-foreground truncate">{file.path}</p>
                <p className="text-muted-foreground">Similarity: {(file.similarity * 100).toFixed(2)}%</p>
              </div>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  // Component to display query analysis information
  const QueryAnalysisDisplay = ({ queryAnalysis, searchPerformed, responseTime }: {
    queryAnalysis?: QueryAnalysisResult,
    searchPerformed?: boolean,
    responseTime?: number
  }) => {
    if (!queryAnalysis) {
      return null;
    }

    const getQueryTypeIcon = (queryType: string) => {
      switch (queryType) {
        case 'general_programming':
          return <Brain className="h-3 w-3" />;
        case 'project_specific':
        case 'file_reference':
        case 'code_explanation':
          return <Database className="h-3 w-3" />;
        case 'documentation_query':
          return <FileText className="h-3 w-3" />;
        default:
          return <Search className="h-3 w-3" />;
      }
    };

    const getQueryTypeColor = (queryType: string) => {
      switch (queryType) {
        case 'general_programming':
          return 'text-blue-500';
        case 'project_specific':
        case 'file_reference':
        case 'code_explanation':
          return 'text-green-500';
        case 'documentation_query':
          return 'text-purple-500';
        default:
          return 'text-gray-500';
      }
    };

    const getQueryTypeLabel = (queryType: string) => {
      switch (queryType) {
        case 'general_programming':
          return 'General Knowledge';
        case 'project_specific':
          return 'Project Context';
        case 'file_reference':
          return 'File Reference';
        case 'code_explanation':
          return 'Code Analysis';
        case 'documentation_query':
          return 'Documentation';
        default:
          return 'Semantic Search';
      }
    };

    return (
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-start p-2 h-auto">
            {getQueryTypeIcon(queryAnalysis.queryType)}
            <span className="text-xs text-muted-foreground ml-2">
              {getQueryTypeLabel(queryAnalysis.queryType)}
              {queryAnalysis.requiresContext ? ' (Context Used)' : ' (General Knowledge)'}
            </span>
            {responseTime && (
              <Badge variant="outline" className="text-xs ml-auto">
                {responseTime}ms
              </Badge>
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1">
          <div className="p-2 bg-muted/30 rounded text-xs space-y-1">
            <div className="flex items-start gap-2">
              <span className="font-medium text-foreground">Analysis:</span>
              <span className={cn("text-xs flex-1", getQueryTypeColor(queryAnalysis.queryType))}>
                {queryAnalysis.reasoning}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Confidence:</span>
              <span className="text-xs text-muted-foreground">
                {(queryAnalysis.confidence * 100).toFixed(0)}%
              </span>
            </div>
            {queryAnalysis.detectedPatterns.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="font-medium text-foreground">Patterns:</span>
                <span className="text-xs text-muted-foreground flex-1">
                  {queryAnalysis.detectedPatterns.join(', ')}
                </span>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading) return;

    // Check if Gemini is configured
    if (!isGeminiConfigured()) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'AI assistant is not properly configured. Please check your API key configuration.',
        role: 'error',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    const currentInput = inputValue;
    // Clear input and add user message
    setInputValue('');
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send message to Gemini API with file context
      const response = await sendMessageWithFileContext(currentInput);

      if (response.success && response.content) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: response.content,
          role: 'assistant',
          timestamp: new Date(),
          contextFiles: response.contextFiles || [],
          searchPerformed: response.searchPerformed || false,
          queryAnalysis: response.queryAnalysis,
          responseTime: response.responseTime
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        // Handle API error
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: response.error || 'Sorry, I encountered an error while processing your request. Please try again.',
          role: 'error',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorResponse]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an unexpected error. Please try again later.',
        role: 'error',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quiz generation handler
  const handleCreateQuiz = () => {
    console.log('🎯 Create Quiz button clicked');
    startQuizGeneration();
  };

  // Quiz generation function
  const handleQuizGeneration = async (request: QuizGenerationRequest) => {
    try {
      console.log('🚀 Starting quiz generation with request:', request);
      const result = await quizService.generateQuiz(request);
      console.log('📝 Quiz generation result:', result);

      if (result.success && result.data) {
        console.log('✅ Quiz generation successful');
        setGenerationSuccess(result.data.quiz, result.data.session);
      } else {
        console.log('❌ Quiz generation failed:', result.error);
        setGenerationError(result.error || 'Failed to generate quiz');
      }
    } catch (error) {
      console.error('💥 Error generating quiz:', error);
      setGenerationError('Failed to generate quiz. Please try again.');
    }
  };

  // Quiz answer submission handler
  const handleAnswerSubmit = async (questionId: string, answer: string | number, timeSpent: number) => {
    if (!quizState.currentSession) return;

    try {
      const result = await quizService.submitAnswer(
        quizState.currentSession.id,
        questionId,
        answer,
        timeSpent
      );

      if (result.success) {
        // Update session would be handled by the quiz interface
        console.log('Answer submitted successfully');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  // Quiz completion handler
  const handleQuizComplete = async () => {
    if (!quizState.currentSession) return;

    try {
      const result = await quizService.completeQuiz(quizState.currentSession.id);

      if (result.success && result.data) {
        // This would trigger the results view
        console.log('Quiz completed successfully');
      }
    } catch (error) {
      console.error('Error completing quiz:', error);
    }
  };

  const quickActions = [
    { label: 'Summarize', icon: FileText, color: 'text-blue-500', action: () => {} },
    { label: 'Create Quiz', icon: Brain, color: 'text-purple-500', action: handleCreateQuiz },
    { label: 'Explain Code', icon: Sparkles, color: 'text-green-500', action: () => {} }
  ];

  // Render quiz generation dialog
  if (quizState.mode === 'generation') {
    return (
      <QuizGenerationDialog
        onGenerate={handleQuizGeneration}
        onCancel={returnToChat}
        isGenerating={quizState.isGenerating}
      />
    );
  }

  // Render quiz interface
  if (quizState.mode === 'quiz' && quizState.currentQuiz && quizState.currentSession) {
    return (
      <QuizInterface
        quiz={quizState.currentQuiz}
        session={quizState.currentSession}
        onAnswerSubmit={handleAnswerSubmit}
        onQuizComplete={handleQuizComplete}
        onReturnToChat={returnToChat}
      />
    );
  }

  // Render quiz results
  if (quizState.mode === 'results' && quizState.currentQuiz && quizState.currentResult) {
    return (
      <QuizResults
        quiz={quizState.currentQuiz}
        session={quizState.currentSession!}
        result={quizState.currentResult}
        onReturnToChat={returnToChat}
        onRetakeQuiz={() => {
          // Handle retake quiz
          startQuizGeneration();
        }}
        onReviewAnswers={startReview}
      />
    );
  }

  // Render quiz review
  if (quizState.mode === 'review' && quizState.currentQuiz && quizState.currentSession) {
    return (
      <QuizReview
        quiz={quizState.currentQuiz}
        session={quizState.currentSession}
        onReturnToResults={() => {
          // Return to results mode
          if (quizState.currentResult) {
            // We need to add a way to return to results
            returnToChat(); // For now, return to chat
          }
        }}
        onRetakeQuiz={() => {
          startQuizGeneration();
        }}
      />
    );
  }

  // Default chat interface
  return (
    <div className="w-full h-full bg-chat-background border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="h-5 w-5 text-chat-ai" />
          <h2 className="text-sm font-semibold text-foreground">AI Assistant</h2>
          <Badge variant="secondary" className="text-xs">
            Gemini 1.5 Flash
          </Badge>
          {!isConfigured && (
            <Badge variant="destructive" className="text-xs">
              Not Configured
            </Badge>
          )}
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQuerySettings(true)}
              className="h-6 w-6 p-0"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Vector Database Status */}
        <VectorDbStatusDisplay />

        {/* Quick Actions */}
        <div className="flex gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={action.action}
            >
              <action.icon className={`h-3 w-3 ${action.color}`} />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                message.role === 'user'
                  ? 'bg-secondary text-white'
                  : message.role === 'error'
                  ? 'bg-destructive text-white'
                  : 'bg-muted text-white'
              )}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : message.role === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              
              <div className={cn(
                "max-w-[80%] p-3 rounded-lg text-sm",
                message.role === 'user'
                  ? 'bg-secondary text-white'
                  : message.role === 'error'
                  ? 'bg-destructive/10 border border-destructive/20 text-destructive'
                  : 'bg-muted text-white'
              )}>
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:text-white prose-headings:text-white prose-strong:text-white prose-em:text-white prose-code:text-white prose-pre:bg-black/20 prose-blockquote:text-white prose-li:text-white">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-md"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className="bg-black/20 px-1 py-0.5 rounded text-sm text-white" {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}

                {/* Show context files for assistant messages */}
                {message.role === 'assistant' && showContextFiles && (
                  <div className="mt-3 space-y-2">
                    <ContextFilesDisplay
                      contextFiles={message.contextFiles}
                      searchPerformed={message.searchPerformed}
                    />
                    <QueryAnalysisDisplay
                      queryAnalysis={message.queryAnalysis}
                      searchPerformed={message.searchPerformed}
                      responseTime={message.responseTime}
                    />
                  </div>
                )}

                <p className={cn(
                  "text-xs mt-2 opacity-70 flex items-center gap-2",
                  message.role === 'user'
                    ? 'text-white'
                    : message.role === 'error'
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                )}>
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.role === 'assistant' && message.responseTime && (
                    <span className="flex items-center gap-1">
                      <span>•</span>
                      <span>{message.responseTime}ms</span>
                    </span>
                  )}
                  {message.role === 'assistant' && message.searchPerformed && (
                    <span>
                      <Search className="h-3 w-3 inline" />
                    </span>
                  )}
                  {message.role === 'assistant' && message.queryAnalysis && !message.queryAnalysis.requiresContext && (
                    <span className="flex items-center gap-1 text-blue-500">
                      <Brain className="h-3 w-3" />
                      <span>Fast Mode</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-muted text-white flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder={isConfigured ? "Ask Gemini..." : "Gemini not configured"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            disabled={isLoading || !isConfigured}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (isRecording ? stopRecording() : startRecording())}
            disabled={isLoading || !isConfigured}
            className="text-muted-foreground"
          >
            {isRecording ? <Square className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Button 
            size="icon" 
            onClick={handleSendMessage} 
            disabled={isLoading || !isConfigured || !inputValue.trim()}
          >
            {isLoading ? <Sparkles className="h-5 w-5 animate-pulse" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            {isConfigured
              ? "AI uses semantic search to find relevant files and provide context-aware responses."
              : "AI assistant requires API key configuration. Please check your .env file."
            }
          </p>

          {isConfigured && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowContextFiles(!showContextFiles)}
              className="h-6 px-2 text-xs"
            >
              <Settings className="h-3 w-3 mr-1" />
              {showContextFiles ? 'Hide' : 'Show'} Context
            </Button>
          )}
        </div>
      </div>

      {/* Query Analysis Settings Modal */}
      <QueryAnalysisSettings
        isOpen={showQuerySettings}
        onClose={() => setShowQuerySettings(false)}
      />
    </div>
  );
};

export default AIChatSidebar;