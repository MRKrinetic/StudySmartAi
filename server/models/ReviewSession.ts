import mongoose, { Schema, Document } from 'mongoose';

export interface IFlashcardReview {
  flashcardId: string;
  quality: number; // 0-5 rating
  timeSpent: number; // in seconds
  wasCorrect: boolean;
  reviewedAt: Date;
}

export interface IReviewSession extends Document {
  userId: string;
  flashcardIds: string[];
  startedAt: Date;
  completedAt?: Date;
  totalCards: number;
  reviewedCards: number;
  correctCards: number;
  averageQuality: number;
  timeSpent: number; // in seconds
  reviews: IFlashcardReview[];
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardReviewSchema = new Schema({
  flashcardId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Flashcard', 
    required: true 
  },
  quality: { 
    type: Number, 
    required: true,
    min: 0,
    max: 5
  },
  timeSpent: { 
    type: Number, 
    required: true,
    min: 0
  },
  wasCorrect: { type: Boolean, required: true },
  reviewedAt: { type: Date, required: true }
}, { _id: false });

const ReviewSessionSchema = new Schema({
  userId: { type: String, required: true, index: true },
  flashcardIds: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Flashcard' 
  }],
  startedAt: { type: Date, required: true },
  completedAt: { type: Date },
  totalCards: { 
    type: Number, 
    required: true,
    min: 1
  },
  reviewedCards: { 
    type: Number, 
    required: true,
    default: 0,
    min: 0
  },
  correctCards: { 
    type: Number, 
    required: true,
    default: 0,
    min: 0
  },
  averageQuality: { 
    type: Number, 
    required: true,
    default: 0,
    min: 0,
    max: 5
  },
  timeSpent: { 
    type: Number, 
    required: true,
    default: 0,
    min: 0
  },
  reviews: [FlashcardReviewSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
ReviewSessionSchema.index({ userId: 1, startedAt: -1 });
ReviewSessionSchema.index({ userId: 1, completedAt: -1 });
ReviewSessionSchema.index({ userId: 1, averageQuality: -1 });

// Virtual for completion percentage
ReviewSessionSchema.virtual('completionPercentage').get(function() {
  return this.totalCards > 0 ? Math.round((this.reviewedCards / this.totalCards) * 100) : 0;
});

// Virtual for accuracy percentage
ReviewSessionSchema.virtual('accuracyPercentage').get(function() {
  return this.reviewedCards > 0 ? Math.round((this.correctCards / this.reviewedCards) * 100) : 0;
});

// Virtual for is completed
ReviewSessionSchema.virtual('isCompleted').get(function() {
  return this.completedAt !== null && this.completedAt !== undefined;
});

// Virtual for average time per card
ReviewSessionSchema.virtual('averageTimePerCard').get(function() {
  return this.reviewedCards > 0 ? Math.round(this.timeSpent / this.reviewedCards) : 0;
});

export default mongoose.model<IReviewSession>('ReviewSession', ReviewSessionSchema);
