import mongoose, { Schema, Document } from 'mongoose';

export interface IFlashcardDeck extends Document {
  name: string;
  description?: string;
  flashcards: string[]; // Flashcard IDs
  category: string;
  tags: string[];
  isPublic: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardDeckSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  flashcards: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Flashcard',
    index: true
  }],
  category: { type: String, required: true, index: true },
  tags: [{ type: String, index: true }],
  isPublic: { type: Boolean, required: true, default: false },
  userId: { type: String, required: true, index: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
FlashcardDeckSchema.index({ userId: 1, name: 1 });
FlashcardDeckSchema.index({ userId: 1, category: 1 });
FlashcardDeckSchema.index({ userId: 1, tags: 1 });
FlashcardDeckSchema.index({ isPublic: 1, category: 1 });
FlashcardDeckSchema.index({ userId: 1, createdAt: -1 });

// Virtual for flashcard count
FlashcardDeckSchema.virtual('flashcardCount').get(function() {
  return this.flashcards.length;
});

// Text search index for name, description, and tags
FlashcardDeckSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text' 
});

export default mongoose.model<IFlashcardDeck>('FlashcardDeck', FlashcardDeckSchema);
