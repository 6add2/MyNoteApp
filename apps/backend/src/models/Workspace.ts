import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkspace extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  ownerId: mongoose.Types.ObjectId;
  memberIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  settings: {
    defaultView: 'grid' | 'list';
    color: string;
  };
}

const WorkspaceSchema = new Schema<IWorkspace>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  memberIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  settings: {
    defaultView: {
      type: String,
      enum: ['grid', 'list'],
      default: 'grid',
    },
    color: {
      type: String,
      default: '#3b82f6', // Blue
    },
  },
});

export const Workspace = mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);


