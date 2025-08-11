import mongoose, { Schema, Document } from 'mongoose';

export interface ISpacedRepetitionData extends Document {
  flashcardId: string;
  userId: string;
  easeFactor: number; // Initial: 2.5
  interval: number; // Days until next review
  repetitions: number; // Number of successful repetitions
  nextReviewDate: Date;
  lastReviewDate?: Date;
  quality: number; // Last quality rating (0-5)
  totalReviews: number;
  correctReviews: number;
  streak: number; // Current correct streak
  longestStreak: number;
  createdAt: Date;
  updatedAt: Date;
}

const SpacedRepetitionDataSchema = new Schema({
  flashcardId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Flashcard', 
    required: true,
    index: true
  },
  userId: { type: String, required: true, index: true },
  easeFactor: { 
    type: Number, 
    required: true, 
    default: 2.5,
    min: 1.3,
    max: 2.5
  },
  interval: { 
    type: Number, 
    required: true, 
    default: 1,
    min: 1
  },
  repetitions: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0
  },
  nextReviewDate: { 
    type: Date, 
    required: true,
    index: true
  },
  lastReviewDate: { type: Date },
  quality: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0
  },
  correctReviews: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0
  },
  streak: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0
  },
  longestStreak: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
SpacedRepetitionDataSchema.index({ userId: 1, nextReviewDate: 1 });
SpacedRepetitionDataSchema.index({ flashcardId: 1, userId: 1 }, { unique: true });
SpacedRepetitionDataSchema.index({ userId: 1, streak: -1 });
SpacedRepetitionDataSchema.index({ userId: 1, totalReviews: -1 });

// Virtual for success rate
SpacedRepetitionDataSchema.virtual('successRate').get(function() {
  return this.totalReviews > 0 ? Math.round((this.correctReviews / this.totalReviews) * 100) : 0;
});

// Virtual for days until next review
SpacedRepetitionDataSchema.virtual('daysUntilReview').get(function() {
  const now = new Date();
  const diffTime = this.nextReviewDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is due for review
SpacedRepetitionDataSchema.virtual('isDue').get(function() {
  return new Date() >= this.nextReviewDate;
});

export default mongoose.model<ISpacedRepetitionData>('SpacedRepetitionData', SpacedRepetitionDataSchema);
