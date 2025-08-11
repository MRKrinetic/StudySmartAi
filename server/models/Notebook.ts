import mongoose, { Schema, Document } from 'mongoose';
import { INotebook } from '../../src/types/index';

export interface NotebookDocument extends INotebook, Document {}

const NotebookSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Notebook name is required'],
    trim: true,
    maxlength: [100, 'Notebook name cannot exceed 100 characters'],
    minlength: [1, 'Notebook name must be at least 1 character']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isExpanded: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better performance
NotebookSchema.index({ name: 1 });
NotebookSchema.index({ createdAt: -1 });

export default mongoose.model<NotebookDocument>('Notebook', NotebookSchema);
