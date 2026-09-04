import User, { IUser } from '../models/User';
import { AccountStatus, AccountType, UserRole, VerificationStatus } from '../constants/enums';
import mongoose from 'mongoose';

export class UserRepository {
  async create(data: Partial<IUser>): Promise<IUser> {
    const user = new User(data);
    return user.save();
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByIdWithPassword(id: string): Promise<IUser | null> {
    return User.findById(id).select('+passwordHash');
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() });
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  }

  async findByMobile(mobileNumber: string): Promise<IUser | null> {
    return User.findOne({ mobileNumber });
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return User.findOne({ googleId });
  }

  async updateById(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  async softDelete(id: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true, deletedAt: new Date(), accountStatus: AccountStatus.DELETED } },
      { new: true }
    );
  }

  async findAll(
    filter: Record<string, unknown> = {},
    skip: number = 0,
    limit: number = 10,
    sort: Record<string, 1 | -1> = { createdAt: -1 }
  ): Promise<{ users: IUser[]; total: number }> {
    const [users, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    return { users, total };
  }

  async findNearbyDonors(
    coordinates: [number, number],
    maxDistanceKm: number,
    bloodGroup?: string
  ): Promise<IUser[]> {
    const filter: Record<string, any> = {
      $or: [
        { role: UserRole.BLOOD_DONOR },
        { roles: 'blood_donor' },
      ],
      accountStatus: AccountStatus.ACTIVE,
    };
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    return User.find({
      ...filter,
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates },
          $maxDistance: maxDistanceKm * 1000,
        },
      },
    }).limit(50);
  }

  async updateVerificationStatus(
    id: string,
    status: VerificationStatus
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, { verificationStatus: status }, { new: true });
  }

  async addFcmToken(userId: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { fcmTokens: token },
    });
  }

  async removeFcmToken(userId: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { fcmTokens: token },
    });
  }

  async countByRole(): Promise<{ _id: string; count: number }[]> {
    return User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await User.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }

  async mobileExists(mobileNumber: string): Promise<boolean> {
    const count = await User.countDocuments({ mobileNumber });
    return count > 0;
  }
}

export default new UserRepository();
