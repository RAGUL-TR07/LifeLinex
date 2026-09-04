import mongoose, { Schema, Document } from 'mongoose';
import { BloodGroup } from '../constants/enums';

export interface IBloodRequest extends Document {
  _id: mongoose.Types.ObjectId;
  requestId: string; // e.g. "BLD-XXXX"
  requestedBy: mongoose.Types.ObjectId;
  patientName: string;
  patientContactNumber: string;
  attenderName: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  unitsReceived: number;
  hospitalName: string;
  hospitalAddress: string;
  hospitalId?: mongoose.Types.ObjectId;
  emergencyId?: mongoose.Types.ObjectId;
  urgency: 'normal' | 'urgent' | 'critical'; // Emergency Level
  medicalReason?: string;
  medicalCertificate?: string;
  status:
    | 'Pending'
    | 'Searching'
    | 'Accepted'
    | 'Donor Assigned'
    | 'Hospital Assigned'
    | 'Blood Reserved'
    | 'Completed'
    | 'Cancelled'
    | 'Expired';
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    address?: string;
  };
  requiredBy: Date;
  notes?: string;
  assignedDonor?: mongoose.Types.ObjectId;
  assignedHospital?: mongoose.Types.ObjectId;
  assignedNGO?: mongoose.Types.ObjectId;
  assignedVolunteer?: mongoose.Types.ObjectId;
  notifiedDonors: mongoose.Types.ObjectId[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bloodRequestSchema = new Schema<IBloodRequest>(
  {
    requestId: { type: String, required: true, unique: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String, required: true },
    patientContactNumber: { type: String, required: true },
    attenderName: { type: String, required: true },
    bloodGroup: { type: String, enum: Object.values(BloodGroup), required: true },
    unitsRequired: { type: Number, required: true, min: 1 },
    unitsReceived: { type: Number, default: 0 },
    hospitalName: { type: String, required: true },
    hospitalAddress: { type: String, required: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    emergencyId: { type: Schema.Types.ObjectId, ref: 'Emergency' },
    urgency: {
      type: String,
      enum: ['normal', 'urgent', 'critical'],
      default: 'normal',
    },
    medicalReason: { type: String },
    medicalCertificate: { type: String },
    status: {
      type: String,
      enum: [
        'Pending',
        'Searching',
        'Accepted',
        'Donor Assigned',
        'Hospital Assigned',
        'Blood Reserved',
        'Completed',
        'Cancelled',
        'Expired',
      ],
      default: 'Pending',
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
      address: { type: String },
    },
    requiredBy: { type: Date, required: true },
    notes: { type: String },
    assignedDonor: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedHospital: { type: Schema.Types.ObjectId, ref: 'Organization' },
    assignedNGO: { type: Schema.Types.ObjectId, ref: 'Organization' },
    assignedVolunteer: { type: Schema.Types.ObjectId, ref: 'User' },
    notifiedDonors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bloodRequestSchema.index({ location: '2dsphere' });
bloodRequestSchema.index({ bloodGroup: 1 });
bloodRequestSchema.index({ status: 1 });
bloodRequestSchema.index({ urgency: 1 });
bloodRequestSchema.index({ requiredBy: 1 });
bloodRequestSchema.index({ requestId: 1 });

const BloodRequest = mongoose.model<IBloodRequest>('BloodRequest', bloodRequestSchema);
export default BloodRequest;
