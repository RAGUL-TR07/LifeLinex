import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  chatRoomId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'location' | 'system';
  mediaUrl?: string;
  mediaMetadata?: {
    name?: string;
    size?: number;
    mimeType?: string;
  };
  readBy: {
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }[];
  replyTo?: mongoose.Types.ObjectId;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    chatRoomId: { type: Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 5000 },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'audio', 'video', 'location', 'system'],
      default: 'text',
    },
    mediaUrl: { type: String },
    mediaMetadata: {
      name: { type: String },
      size: { type: Number },
      mimeType: { type: String },
    },
    readBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

messageSchema.index({ chatRoomId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });

const Message = mongoose.model<IMessage>('Message', messageSchema);
export default Message;
