import mongoose, { Schema, Document } from 'mongoose';
import { OrganizationType, VerificationStatus, AccountStatus } from '../constants/enums';

export interface IOrganization extends Document {
  _id: mongoose.Types.ObjectId;
  organizationName: string;
  organizationType: OrganizationType;
  registrationNumber: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  verificationStatus: VerificationStatus;
  accountStatus: AccountStatus;
  documents: {
    name: string;
    url: string;
    uploadedAt: Date;
  }[];
  // Hospital specific
  departments?: string[];
  totalBeds?: number;
  availableBeds?: number;
  icuBeds?: number;
  ventilators?: number;
  hasEmergencyWard?: boolean;
  // Blood Bank specific
  bloodInventory?: {
    bloodGroup: string;
    units: number;
  }[];
  // Ambulance Provider specific
  totalVehicles?: number;
  availableVehicles?: number;
  // General
  website?: string;
  description?: string;
  logo?: string;
  adminUserId: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    organizationName: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
    },
    organizationType: {
      type: String,
      enum: Object.values(OrganizationType),
      required: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      street: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String },
      country: { type: String, default: 'India' },
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
    },
    accountStatus: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.ACTIVE,
    },
    documents: [
      {
        name: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    departments: [{ type: String }],
    totalBeds: { type: Number, default: 0 },
    availableBeds: { type: Number, default: 0 },
    icuBeds: { type: Number, default: 0 },
    ventilators: { type: Number, default: 0 },
    hasEmergencyWard: { type: Boolean, default: false },
    bloodInventory: [
      {
        bloodGroup: { type: String },
        units: { type: Number, default: 0 },
      },
    ],
    totalVehicles: { type: Number, default: 0 },
    availableVehicles: { type: Number, default: 0 },
    website: { type: String },
    description: { type: String },
    logo: { type: String },
    adminUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

organizationSchema.index({ location: '2dsphere' });
organizationSchema.index({ organizationType: 1 });
organizationSchema.index({ verificationStatus: 1 });
organizationSchema.index({ email: 1 });
organizationSchema.index({ registrationNumber: 1 });
organizationSchema.index({ isDeleted: 1 });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
organizationSchema.pre(/^find/, function (this: any) {
  this.where({ isDeleted: { $ne: true } });
});

const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);
export default Organization;
