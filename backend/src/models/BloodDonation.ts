import mongoose, { Schema, Document } from 'mongoose';
import { BloodGroup } from '../constants/enums';

export interface IBloodDonation extends Document {
  _id: mongoose.Types.ObjectId;
  donorId: mongoose.Types.ObjectId;
  bloodRequestId?: mongoose.Types.ObjectId;
  bloodBankId?: mongoose.Types.ObjectId;
  bloodGroup: BloodGroup;
  units: number;
  donationDate: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  status: 'scheduled' | 'completed' | 'cancelled';
  certificateUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bloodDonationSchema = new Schema<IBloodDonation>(
  {
    donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bloodRequestId: { type: Schema.Types.ObjectId, ref: 'BloodRequest' },
    bloodBankId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    bloodGroup: { type: String, enum: Object.values(BloodGroup), required: true },
    units: { type: Number, required: true, min: 1 },
    donationDate: { type: Date, required: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    certificateUrl: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

bloodDonationSchema.index({ donorId: 1 });
bloodDonationSchema.index({ bloodGroup: 1 });
bloodDonationSchema.index({ donationDate: -1 });

const BloodDonation = mongoose.model<IBloodDonation>('BloodDonation', bloodDonationSchema);
export default BloodDonation;
