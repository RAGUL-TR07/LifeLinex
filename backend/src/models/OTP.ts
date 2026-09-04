import mongoose, { Schema, Document } from 'mongoose';
import { OTPType } from '../constants/enums';

export interface IOTP extends Document {
  userId: mongoose.Types.ObjectId;
  type: OTPType;
  code: string;
  target: string; // email or phone
  isUsed: boolean;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOTP>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(OTPType),
      required: true,
    },
    code: {
      type: String,
      required: true,
      select: false,
    },
    target: {
      type: String,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

otpSchema.index({ userId: 1, type: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

const OTP = mongoose.model<IOTP>('OTP', otpSchema);
export default OTP;
