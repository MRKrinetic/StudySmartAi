import mongoose, { Schema, Document } from 'mongoose';
import { IFile } from '../../src/types/index';

export interface FileDocument extends IFile, Document {}

const FileSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
    maxlength: [255, 'File name cannot exceed 255 characters'],
    minlength: [1, 'File name must be at least 1 character']
  },
  content: {
    type: String,
    default: '',
    maxlength: [1000000, 'File content cannot exceed 1MB'] // 1MB limit
  },
  type: {
    type: String,
    required: [true, 'File type is required'],
    enum: {
      values: ['txt', 'md', 'py', 'js', 'cpp', 'json', 'csv'],
      message: 'File type must be one of: txt, md, py, js, cpp, json, csv'
    }
  },
  notebookId: {
    type: Schema.Types.ObjectId,
    ref: 'Notebook',
    required: [true, 'Notebook ID is required']
  },
  folderId: {
    type: Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  size: {
    type: Number,
    default: 0
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

// Pre-save middleware to calculate file size
FileSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.size = Buffer.byteLength(this.content, 'utf8');
  }
  next();
});

// Indexes for better performance
FileSchema.index({ notebookId: 1, name: 1 });
FileSchema.index({ folderId: 1 });
FileSchema.index({ type: 1 });
FileSchema.index({ createdAt: -1 });

// Compound index for hierarchical queries
FileSchema.index({ notebookId: 1, folderId: 1 });

// Prevent duplicate file names within the same folder/notebook
FileSchema.index(
  { notebookId: 1, folderId: 1, name: 1 }, 
  { unique: true }
);

export default mongoose.model<FileDocument>('File', FileSchema);
