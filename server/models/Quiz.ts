import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'fill_in_blank';
  question: string;
  options?: string[]; // For multiple choice questions
  correctAnswer: string | number; // String for text answers, number for option index
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sourceContent?: string; // Original content this question was generated from
  sourceFile?: string; // File path/name where content came from
  tags?: string[];
  points: number;
}

export interface IQuiz extends Document {
  title: string;
  description?: string;
  questions: IQuizQuestion[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  category: string;
  tags: string[];
  timeLimit?: number; // in minutes
  passingScore: number; // percentage
  sourceFiles: string[]; // Files used to generate the quiz
  userId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema({
  id: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    required: true,
    enum: ['multiple_choice', 'true_false', 'fill_in_blank']
  },
  question: { 
    type: String, 
    required: true,
    maxlength: [1000, 'Question cannot exceed 1000 characters']
  },
  options: [{ 
    type: String,
    maxlength: [200, 'Option cannot exceed 200 characters']
  }],
  correctAnswer: { 
    type: Schema.Types.Mixed, 
    required: true 
  },
  explanation: { 
    type: String,
    maxlength: [500, 'Explanation cannot exceed 500 characters']
  },
  difficulty: { 
    type: String, 
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  sourceContent: { 
    type: String,
    maxlength: [2000, 'Source content cannot exceed 2000 characters']
  },
  sourceFile: { 
    type: String,
    maxlength: [255, 'Source file path cannot exceed 255 characters']
  },
  tags: [{ 
    type: String,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  points: { 
    type: Number, 
    required: true,
    min: [1, 'Points must be at least 1'],
    max: [100, 'Points cannot exceed 100']
  }
}, { _id: false });

const QuizSchema = new Schema({
  title: { 
    type: String, 
    required: [true, 'Quiz title is required'],
    trim: true,
    maxlength: [200, 'Quiz title cannot exceed 200 characters'],
    minlength: [1, 'Quiz title must be at least 1 character']
  },
  description: { 
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  questions: {
    type: [QuizQuestionSchema],
    required: true,
    validate: {
      validator: function(questions: IQuizQuestion[]) {
        return questions.length >= 1 && questions.length <= 50;
      },
      message: 'Quiz must have between 1 and 50 questions'
    }
  },
  difficulty: { 
    type: String, 
    required: true,
    enum: {
      values: ['easy', 'medium', 'hard', 'mixed'],
      message: 'Difficulty must be one of: easy, medium, hard, mixed'
    },
    index: true
  },
  category: { 
    type: String, 
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters'],
    index: true
  },
  tags: [{ 
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters'],
    index: true
  }],
  timeLimit: { 
    type: Number,
    min: [1, 'Time limit must be at least 1 minute'],
    max: [300, 'Time limit cannot exceed 300 minutes']
  },
  passingScore: { 
    type: Number, 
    required: true,
    min: [0, 'Passing score cannot be negative'],
    max: [100, 'Passing score cannot exceed 100'],
    default: 70
  },
  sourceFiles: [{ 
    type: String,
    trim: true,
    maxlength: [255, 'Source file path cannot exceed 255 characters']
  }],
  userId: { 
    type: String, 
    required: [true, 'User ID is required'],
    index: true
  },
  isPublic: { 
    type: Boolean, 
    required: true,
    default: false,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
QuizSchema.index({ userId: 1, category: 1 });
QuizSchema.index({ userId: 1, difficulty: 1 });
QuizSchema.index({ userId: 1, tags: 1 });
QuizSchema.index({ userId: 1, createdAt: -1 });
QuizSchema.index({ isPublic: 1, category: 1 });
QuizSchema.index({ isPublic: 1, difficulty: 1 });

// Text search index for title, description, and tags
QuizSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text',
  category: 'text'
});

// Virtual for total points
QuizSchema.virtual('totalPoints').get(function() {
  return this.questions.reduce((total: number, question: IQuizQuestion) => total + question.points, 0);
});

// Virtual for question count
QuizSchema.virtual('questionCount').get(function() {
  return this.questions.length;
});

// Virtual for average difficulty
QuizSchema.virtual('averageDifficulty').get(function() {
  if (this.difficulty !== 'mixed') return this.difficulty;
  
  const difficultyMap = { easy: 1, medium: 2, hard: 3 };
  const total = this.questions.reduce((sum: number, q: IQuizQuestion) => sum + difficultyMap[q.difficulty], 0);
  const average = total / this.questions.length;
  
  if (average <= 1.5) return 'easy';
  if (average <= 2.5) return 'medium';
  return 'hard';
});

export default mongoose.model<IQuiz>('Quiz', QuizSchema);
