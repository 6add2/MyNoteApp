import mongoose, { Document, Schema } from 'mongoose';

export interface INotePermission {
  userId: mongoose.Types.ObjectId;
  role: 'owner' | 'editor' | 'viewer';
}

export interface INote extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  ownerId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  isPublic: boolean;
  yDocSnapshot?: Buffer;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
    lastEditedBy?: mongoose.Types.ObjectId;
    backgroundUrl?: string | null;
  };
  permissions: INotePermission[];
}

const NoteSchema = new Schema<INote>({
  title: {
    type: String,
    required: true,
    trim: true,
    default: 'Untitled Note',
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
    index: true,
  },
  yDocSnapshot: {
    type: Buffer,
    default: null,
  },
  metadata: {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    lastEditedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    backgroundUrl: {
      type: String,
      default: null,
    },
  },
  permissions: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      required: true,
    },
  }],
});

// Update updatedAt on save
NoteSchema.pre<INote>('save', function (this: INote) {
  this.metadata.updatedAt = new Date();
});

export const Note = mongoose.model<INote>('Note', NoteSchema);


