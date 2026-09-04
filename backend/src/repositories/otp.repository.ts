import OTPModel, { IOTP } from '../models/OTP';
import { OTPType } from '../constants/enums';
import { hashOTP, getOTPExpiry } from '../utils/otp';
import mongoose from 'mongoose';

export class OTPRepository {
  async createOTP(
    userId: string,
    type: OTPType,
    code: string,
    target: string
  ): Promise<IOTP> {
    // Invalidate previous OTPs of same type
    await OTPModel.updateMany(
      { userId: new mongoose.Types.ObjectId(userId), type, isUsed: false },
      { $set: { isUsed: true } }
    );

    return OTPModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      type,
      code: hashOTP(code),
      target,
      expiresAt: getOTPExpiry(),
    });
  }

  async findLatestOTP(userId: string, type: OTPType): Promise<IOTP | null> {
    return OTPModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      type,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    })
      .select('+code')
      .sort({ createdAt: -1 });
  }

  async markAsUsed(id: string): Promise<void> {
    await OTPModel.findByIdAndUpdate(id, { isUsed: true });
  }

  async incrementAttempts(id: string): Promise<void> {
    await OTPModel.findByIdAndUpdate(id, { $inc: { attempts: 1 } });
  }
}

export default new OTPRepository();
