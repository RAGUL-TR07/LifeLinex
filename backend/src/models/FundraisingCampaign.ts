import mongoose, { Schema, Document } from 'mongoose';
import { CampaignStatus } from '../constants/enums';

export interface IFundraisingCampaign extends Document {
  _id: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  patientId?: mongoose.Types.ObjectId;
  patientName?: string;
  hospitalName?: string;
  title: string;
  description: string;
  story: string;
  category: string;
  goalAmount: number;
  raisedAmount: number;
  donorCount: number;
  status: CampaignStatus;
  verifiedBy?: mongoose.Types.ObjectId;
  verificationNote?: string;
  images: string[];
  documents: string[];
  documentsData?: any;
  hospitalId?: mongoose.Types.ObjectId;
  medicalCondition?: string;
  expiresAt?: Date;
  razorpayAccountId?: string;
  withdrawalHistory: {
    amount: number;
    requestedAt: Date;
    processedAt?: Date;
    status: 'pending' | 'processed' | 'rejected';
  }[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const fundraisingCampaignSchema = new Schema<IFundraisingCampaign>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'User' },
    patientName: { type: String, trim: true },
    hospitalName: { type: String, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 500 },
    story: { type: String, required: true },
    category: { type: String, required: true },
    goalAmount: { type: Number, required: true, min: 1000 },
    raisedAmount: { type: Number, default: 0 },
    donorCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: Object.values(CampaignStatus),
      default: CampaignStatus.PENDING,
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verificationNote: { type: String },
    images: [{ type: String }],
    documents: [{ type: String }],
    documentsData: { type: Schema.Types.Mixed },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    medicalCondition: { type: String },
    expiresAt: { type: Date },
    razorpayAccountId: { type: String },
    withdrawalHistory: [
      {
        amount: { type: Number },
        requestedAt: { type: Date, default: Date.now },
        processedAt: { type: Date },
        status: { type: String, enum: ['pending', 'processed', 'rejected'], default: 'pending' },
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

fundraisingCampaignSchema.index({ createdBy: 1 });
fundraisingCampaignSchema.index({ status: 1 });
fundraisingCampaignSchema.index({ category: 1 });
fundraisingCampaignSchema.index({ createdAt: -1 });

const FundraisingCampaign = mongoose.model<IFundraisingCampaign>(
  'FundraisingCampaign',
  fundraisingCampaignSchema
);
export default FundraisingCampaign;
