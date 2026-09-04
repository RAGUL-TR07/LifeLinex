import mongoose, { Schema, Document } from 'mongoose';
import { AmbulanceStatus } from '../constants/enums';

export interface IAmbulance extends Document {
  _id: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId; // Organization
  vehicleNumber: string;
  vehicleType: 'basic' | 'advanced' | 'neonatal' | 'mortuary';
  driverId?: mongoose.Types.ObjectId;
  status: AmbulanceStatus;
  currentLocation: {
    type: 'Point';
    coordinates: [number, number];
  };
  equipment: string[];
  isAvailable: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ambulanceSchema = new Schema<IAmbulance>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    vehicleNumber: { type: String, required: true, unique: true, uppercase: true },
    vehicleType: {
      type: String,
      enum: ['basic', 'advanced', 'neonatal', 'mortuary'],
      default: 'basic',
    },
    driverId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: Object.values(AmbulanceStatus),
      default: AmbulanceStatus.AVAILABLE,
    },
    currentLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    equipment: [{ type: String }],
    isAvailable: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ambulanceSchema.index({ currentLocation: '2dsphere' });
ambulanceSchema.index({ providerId: 1 });
ambulanceSchema.index({ status: 1 });
ambulanceSchema.index({ isAvailable: 1 });

const Ambulance = mongoose.model<IAmbulance>('Ambulance', ambulanceSchema);
export default Ambulance;
