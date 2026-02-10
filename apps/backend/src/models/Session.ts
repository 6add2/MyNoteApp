import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  noteId: mongoose.Types.ObjectId;
  socketId: string;
  joinedAt: Date;
  lastActivity: Date;
}

const SessionSchema = new Schema<ISession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  noteId: {
    type: Schema.Types.ObjectId,
    ref: 'Note',
    required: true,
    index: true,
  },
  socketId: {
    type: String,
    required: true,
    unique: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// TTL index: auto-delete sessions after 1 hour of inactivity
SessionSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 3600 });

export const Session = mongoose.model<ISession>('Session', SessionSchema);


