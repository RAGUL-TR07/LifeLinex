import mongoose, { Schema, Document } from 'mongoose';
import { MedicineDonationStatus } from '../constants/enums';

export interface IMedicineDonation extends Document {
  _id: mongoose.Types.ObjectId;
  donorId: mongoose.Types.ObjectId;
  medicines: {
    name: string;
    quantity: number;
    unit: string;
    expiryDate: Date;
    batchNumber?: string;
    manufacturer?: string;
  }[];
  status: MedicineDonationStatus;
  pickupAddress: string;
  pickupDate?: Date;
  assignedNgoId?: mongoose.Types.ObjectId;
  verifiedBy?: mongoose.Types.ObjectId;
  verificationNote?: string;
  collectedAt?: Date;
  distributedAt?: Date;
  images: string[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const medicineDonationSchema = new Schema<IMedicineDonation>(
  {
    donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    medicines: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unit: { type: String, required: true },
        expiryDate: { type: Date, required: true },
        batchNumber: { type: String },
        manufacturer: { type: String },
      },
    ],
    status: {
      type: String,
      enum: Object.values(MedicineDonationStatus),
      default: MedicineDonationStatus.PENDING,
    },
    pickupAddress: { type: String, required: true },
    pickupDate: { type: Date },
    assignedNgoId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verificationNote: { type: String },
    collectedAt: { type: Date },
    distributedAt: { type: Date },
    images: [{ type: String }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

medicineDonationSchema.index({ donorId: 1 });
medicineDonationSchema.index({ status: 1 });

const MedicineDonation = mongoose.model<IMedicineDonation>('MedicineDonation', medicineDonationSchema);
export default MedicineDonation;
