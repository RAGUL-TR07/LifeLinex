import mongoose, { Schema, Document } from 'mongoose';
import { NotificationType } from '../constants/enums';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  channels: ('in_app' | 'push' | 'email' | 'sms')[];
  sentChannels: ('in_app' | 'push' | 'email' | 'sms')[];
  referenceId?: mongoose.Types.ObjectId;
  referenceModel?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    channels: [{ type: String, enum: ['in_app', 'push', 'email', 'sms'] }],
    sentChannels: [{ type: String, enum: ['in_app', 'push', 'email', 'sms'] }],
    referenceId: { type: Schema.Types.ObjectId },
    referenceModel: { type: String },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;
