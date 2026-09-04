/**
 * Demo User Seeder
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/seed-demo-users.ts
 *
 * Creates two demo accounts:
 *  - User:  user@lifelinex.com  / User@123456
 *  - Admin: admin@lifelinex.com / Admin@123456
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import dns from 'dns';
import bcrypt from 'bcryptjs';
import {
  UserRole,
  AccountType,
  AccountStatus,
  VerificationStatus,
} from '../constants/enums';

const MONGO_URI = process.env.MONGODB_URI!;
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

const demoUsers = [
  {
    fullName: 'Demo User',
    email: 'user@lifelinex.com',
    mobileNumber: '9000000001',
    password: 'User@123456',
    role: UserRole.PATIENT,
    accountType: AccountType.INDIVIDUAL,
  },
  {
    fullName: 'Super Admin',
    email: 'admin@lifelinex.com',
    mobileNumber: '9000000002',
    password: 'Admin@123456',
    role: UserRole.ADMIN,
    accountType: AccountType.INDIVIDUAL,
  },
];

async function seed() {
  // Same DNS override as src/database/connection.ts
  try {
    dns.setServers([
      '2001:4860:4860::6464',
      '2001:4860:4860::8888',
      '8.8.8.8',
      '1.1.1.1',
    ]);
  } catch (e: unknown) {
    console.warn('DNS override warning:', (e as Error).message);
  }

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Use raw collection to bypass the Mongoose pre-save hook (which has a
  // compatibility issue in this codebase). We hash passwords manually here.
  const col = mongoose.connection.collection('users');

  for (const demo of demoUsers) {
    const existing = await col.findOne({ email: demo.email });
    const passwordHash = await bcrypt.hash(demo.password, SALT_ROUNDS);
    const now = new Date();

    if (existing) {
      console.log(`⚠️  ${demo.email} already exists — updating password and role.`);
      await col.updateOne(
        { email: demo.email },
        { 
          $set: { 
            passwordHash, 
            role: demo.role,
            fullName: demo.fullName,
            accountStatus: AccountStatus.ACTIVE,
            updatedAt: now 
          } 
        }
      );
      continue;
    }

    await col.insertOne({
      fullName: demo.fullName,
      email: demo.email,
      mobileNumber: demo.mobileNumber,
      passwordHash,
      role: demo.role,
      accountType: demo.accountType,
      isEmailVerified: true,
      isMobileVerified: true,
      verificationStatus: VerificationStatus.APPROVED,
      accountStatus: AccountStatus.ACTIVE,
      emergencyContacts: [],
      fcmTokens: [],
      notificationSettings: { email: true, sms: true, push: true, inApp: true },
      volunteerPoints: 0,
      volunteerBadges: [],
      totalDonations: 0,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`✅ Created ${demo.role} — ${demo.email} / ${demo.password}`);
  }

  await mongoose.disconnect();
  console.log('🎉 Seeding complete.');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
