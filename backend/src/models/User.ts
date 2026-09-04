import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import {
  UserRole,
  AccountType,
  AccountStatus,
  VerificationStatus,
  BloodGroup,
} from '../constants/enums';
import config from '../config';

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface ILocation {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  mobileNumber?: string;
  passwordHash?: string;
  googleId?: string;
  role: UserRole;
  roles: string[];
  accountType: AccountType;
  profileImage?: string;
  address?: IAddress;
  location?: ILocation;
  bloodGroup?: BloodGroup;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  emergencyContacts: IEmergencyContact[];
  verificationStatus: VerificationStatus;
  hasUploadedDocs?: boolean;
  verificationDocuments?: Array<{ name: string; url?: string; fileType?: string; submittedAt: Date }>;
  accountStatus: AccountStatus;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  fcmTokens: string[];
  notificationSettings: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  preferredLanguage?: string;
  // Volunteer specific
  volunteerPoints?: number;
  volunteerBadges?: string[];
  // Donor specific
  lastDonationDate?: Date;
  totalDonations?: number;
  availability?: string; // e.g. "Available", "Busy"
  rating?: number;
  responseTime?: string; // e.g. "10 mins"
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const addressSchema = new Schema<IAddress>(
  {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String, default: 'India' },
  },
  { _id: false }
);

const locationSchema = new Schema<ILocation>(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  { _id: false }
);

const emergencyContactSchema = new Schema<IEmergencyContact>(
  {
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    mobileNumber: {
      type: String,
      unique: true,
      sparse: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian mobile number'],
    },
    passwordHash: {
      type: String,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    roles: {
      type: [String],
      default: ['patient'],
    },
    accountType: {
      type: String,
      enum: Object.values(AccountType),
      required: true,
    },
    profileImage: { type: String },
    address: addressSchema,
    location: locationSchema,
    bloodGroup: {
      type: String,
      enum: Object.values(BloodGroup),
    },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    emergencyContacts: {
      type: [emergencyContactSchema],
      default: [],
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
    },
    hasUploadedDocs: {
      type: Boolean,
      default: false,
    },
    verificationDocuments: {
      type: [{
        name: { type: String, required: true },
        url: { type: String },
        fileType: { type: String },
        submittedAt: { type: Date, default: Date.now },
      }],
      default: [],
    },
    accountStatus: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.ACTIVE,
    },
    isEmailVerified: { type: Boolean, default: false },
    isMobileVerified: { type: Boolean, default: false },
    preferredLanguage: {
      type: String,
      enum: ['en', 'ta'],
      default: 'en',
    },
    notificationSettings: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    volunteerPoints: { type: Number, default: 0 },
    volunteerBadges: { type: [String], default: [] },
    lastDonationDate: { type: Date },
    totalDonations: { type: Number, default: 0 },
    availability: { type: String, default: 'Available' },
    rating: { type: Number, default: 5.0 },
    responseTime: { type: String, default: '5 mins' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc: unknown, ret: Record<string, unknown>) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ mobileNumber: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ accountType: 1 });
userSchema.index({ location: '2dsphere' });
userSchema.index({ bloodGroup: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ verificationStatus: 1 });

// Pre-save hook for password hashing
// Mongoose v7+: async hooks must NOT call next() — just return/throw.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(userSchema as any).pre('save', async function (this: any) {
  if (!this.isModified('passwordHash') || !this.passwordHash) {
    return; // nothing to hash
  }
  this.passwordHash = await bcrypt.hash(this.passwordHash, config.bcrypt.saltRounds);
});

// Soft delete query filter
// eslint-disable-next-line @typescript-eslint/no-explicit-any
userSchema.pre(/^find/, function (this: any) {
  this.where({ isDeleted: { $ne: true } });
});

// Compare passwords
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = this as any;
  if (!doc.passwordHash) return false;
  return bcrypt.compare(candidatePassword, doc.passwordHash);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
