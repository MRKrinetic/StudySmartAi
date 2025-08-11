import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizAnswer {
  questionId: string;
  userAnswer: string | number;
  isCorrect: boolean;
  timeSpent: number; // in seconds
  answeredAt: Date;
}

export interface IQuizSession extends Document {
  quizId: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  currentQuestionIndex: number;
  answers: IQuizAnswer[];
  score?: number;
  percentage?: number;
  timeSpent: number; // in seconds
  status: 'in_progress' | 'completed' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
}

const QuizAnswerSchema = new Schema({
  questionId: { 
    type: String, 
    required: true 
  },
  userAnswer: { 
    type: Schema.Types.Mixed, 
    required: true 
  },
  isCorrect: { 
    type: Boolean, 
    required: true 
  },
  timeSpent: { 
    type: Number, 
    required: true,
    min: [0, 'Time spent cannot be negative']
  },
  answeredAt: { 
    type: Date, 
    required: true 
  }
}, { _id: false });

const QuizSessionSchema = new Schema({
  quizId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Quiz', 
    required: [true, 'Quiz ID is required'],
    index: true
  },
  userId: { 
    type: String, 
    required: [true, 'User ID is required'],
    index: true
  },
  startedAt: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  completedAt: { 
    type: Date,
    index: true
  },
  currentQuestionIndex: { 
    type: Number, 
    required: true,
    default: 0,
    min: [0, 'Current question index cannot be negative']
  },
  answers: {
    type: [QuizAnswerSchema],
    default: []
  },
  score: { 
    type: Number,
    min: [0, 'Score cannot be negative']
  },
  percentage: { 
    type: Number,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100']
  },
  timeSpent: { 
    type: Number, 
    required: true,
    default: 0,
    min: [0, 'Time spent cannot be negative']
  },
  status: { 
    type: String, 
    required: true,
    enum: {
      values: ['in_progress', 'completed', 'abandoned'],
      message: 'Status must be one of: in_progress, completed, abandoned'
    },
    default: 'in_progress',
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
QuizSessionSchema.index({ userId: 1, status: 1 });
QuizSessionSchema.index({ userId: 1, createdAt: -1 });
QuizSessionSchema.index({ quizId: 1, userId: 1 });
QuizSessionSchema.index({ userId: 1, completedAt: -1 });

// Virtual for correct answers count
QuizSessionSchema.virtual('correctAnswers').get(function() {
  return this.answers.filter((answer: IQuizAnswer) => answer.isCorrect).length;
});

// Virtual for total questions answered
QuizSessionSchema.virtual('questionsAnswered').get(function() {
  return this.answers.length;
});

// Virtual for average time per question
QuizSessionSchema.virtual('averageTimePerQuestion').get(function() {
  if (this.answers.length === 0) return 0;
  const totalTime = this.answers.reduce((sum: number, answer: IQuizAnswer) => sum + answer.timeSpent, 0);
  return totalTime / this.answers.length;
});

// Virtual for is completed
QuizSessionSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Virtual for is in progress
QuizSessionSchema.virtual('isInProgress').get(function() {
  return this.status === 'in_progress';
});

// Method to calculate score and percentage
QuizSessionSchema.methods.calculateScore = function() {
  const correctAnswers = this.answers.filter((answer: IQuizAnswer) => answer.isCorrect).length;
  const totalQuestions = this.answers.length;
  
  if (totalQuestions === 0) {
    this.score = 0;
    this.percentage = 0;
    return;
  }
  
  this.score = correctAnswers;
  this.percentage = Math.round((correctAnswers / totalQuestions) * 100);
};

// Method to complete the session
QuizSessionSchema.methods.complete = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  this.calculateScore();
};

// Method to abandon the session
QuizSessionSchema.methods.abandon = function() {
  this.status = 'abandoned';
  this.completedAt = new Date();
};

// Method to add an answer
QuizSessionSchema.methods.addAnswer = function(answer: IQuizAnswer) {
  this.answers.push(answer);
  this.currentQuestionIndex = Math.max(this.currentQuestionIndex, this.answers.length);
  this.timeSpent += answer.timeSpent;
};

export default mongoose.model<IQuizSession>('QuizSession', QuizSessionSchema);
