import RefreshTokenModel, { IRefreshToken } from '../models/RefreshToken';
import { getRefreshTokenExpiry } from '../utils/jwt';
import mongoose from 'mongoose';

export class RefreshTokenRepository {
  async create(
    userId: string,
    token: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<IRefreshToken> {
    return RefreshTokenModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      token,
      deviceInfo,
      ipAddress,
      expiresAt: getRefreshTokenExpiry(),
    });
  }

  async findByToken(token: string): Promise<IRefreshToken | null> {
    return RefreshTokenModel.findOne({ token, isRevoked: false });
  }

  async revokeToken(token: string): Promise<void> {
    await RefreshTokenModel.updateOne({ token }, { $set: { isRevoked: true } });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await RefreshTokenModel.updateMany(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $set: { isRevoked: true } }
    );
  }

  async cleanupExpired(): Promise<void> {
    await RefreshTokenModel.deleteMany({ expiresAt: { $lt: new Date() } });
  }
}

export default new RefreshTokenRepository();
