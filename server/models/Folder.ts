import mongoose, { Schema, Document } from 'mongoose';
import { IFolder } from '../../src/types/index';

export interface FolderDocument extends IFolder, Document {}

const FolderSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Folder name is required'],
    trim: true,
    maxlength: [100, 'Folder name cannot exceed 100 characters'],
    minlength: [1, 'Folder name must be at least 1 character']
  },
  notebookId: {
    type: Schema.Types.ObjectId,
    ref: 'Notebook',
    required: [true, 'Notebook ID is required']
  },
  parentFolderId: {
    type: Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  isExpanded: {
    type: Boolean,
    default: false
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
FolderSchema.index({ notebookId: 1, name: 1 });
FolderSchema.index({ parentFolderId: 1 });
FolderSchema.index({ createdAt: -1 });

// Compound index for hierarchical queries
FolderSchema.index({ notebookId: 1, parentFolderId: 1 });

// Prevent duplicate folder names within the same parent
FolderSchema.index(
  { notebookId: 1, parentFolderId: 1, name: 1 }, 
  { unique: true }
);

export default mongoose.model<FolderDocument>('Folder', FolderSchema);
