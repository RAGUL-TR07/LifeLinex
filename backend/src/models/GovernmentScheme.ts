import mongoose, { Schema, Document } from 'mongoose';
import { VerificationStatus } from '../constants/enums';

export interface IGovernmentScheme extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  category: string;
  eligibilityCriteria: string[];
  benefits: string;
  applicationProcess: string;
  requiredDocuments: string[];
  deadline?: Date;
  officialLink?: string;
  organizationId?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISchemeApplication extends Document {
  _id: mongoose.Types.ObjectId;
  schemeId: mongoose.Types.ObjectId;
  applicantId: mongoose.Types.ObjectId;
  status: VerificationStatus;
  documents: {
    name: string;
    url: string;
    uploadedAt: Date;
  }[];
  notes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  appliedAt: Date;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const governmentSchemeSchema = new Schema<IGovernmentScheme>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    eligibilityCriteria: [{ type: String }],
    benefits: { type: String },
    applicationProcess: { type: String },
    requiredDocuments: [{ type: String }],
    deadline: { type: Date },
    officialLink: { type: String },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const schemeApplicationSchema = new Schema<ISchemeApplication>(
  {
    schemeId: { type: Schema.Types.ObjectId, ref: 'GovernmentScheme', required: true },
    applicantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
    },
    documents: [
      {
        name: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    notes: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    appliedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

governmentSchemeSchema.index({ category: 1 });
governmentSchemeSchema.index({ isActive: 1 });
schemeApplicationSchema.index({ applicantId: 1 });
schemeApplicationSchema.index({ schemeId: 1 });

export const GovernmentScheme = mongoose.model<IGovernmentScheme>('GovernmentScheme', governmentSchemeSchema);
export const SchemeApplication = mongoose.model<ISchemeApplication>('SchemeApplication', schemeApplicationSchema);
