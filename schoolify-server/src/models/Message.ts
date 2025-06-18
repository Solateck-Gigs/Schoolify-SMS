import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId; // User ID of the sender
  receiver: mongoose.Types.ObjectId; // User ID of the receiver (e.g., admin, teacher)
  subject: string;
  content: string;
  type: 'suggestion' | 'question' | 'general';
  read_by_receiver: boolean;
  created_at: Date;
  updated_at: Date;
}

const MessageSchema: Schema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['suggestion', 'question', 'general'],
      default: 'general',
    },
    read_by_receiver: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

MessageSchema.index({ receiver: 1 });
MessageSchema.index({ type: 1 });
MessageSchema.index({ read_by_receiver: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema); 