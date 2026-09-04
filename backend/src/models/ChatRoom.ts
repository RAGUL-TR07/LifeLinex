import mongoose, { Schema, Document } from 'mongoose';

export interface IChatRoom extends Document {
  _id: mongoose.Types.ObjectId;
  emergencyId?: mongoose.Types.ObjectId;
  name?: string;
  type: 'emergency' | 'support' | 'group' | 'direct';
  participants: {
    userId: mongoose.Types.ObjectId;
    role: string;
    joinedAt: Date;
    isActive: boolean;
  }[];
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const chatRoomSchema = new Schema<IChatRoom>(
  {
    emergencyId: { type: Schema.Types.ObjectId, ref: 'Emergency' },
    name: { type: String },
    type: {
      type: String,
      enum: ['emergency', 'support', 'group', 'direct'],
      required: true,
    },
    participants: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        role: { type: String },
        joinedAt: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true },
      },
    ],
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastMessageAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

chatRoomSchema.index({ emergencyId: 1 });
chatRoomSchema.index({ 'participants.userId': 1 });

const ChatRoom = mongoose.model<IChatRoom>('ChatRoom', chatRoomSchema);
export default ChatRoom;
