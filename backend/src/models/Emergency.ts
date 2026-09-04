import mongoose, { Schema, Document } from 'mongoose';
import { EmergencyStatus, EmergencyType } from '../constants/enums';

export interface IEmergencyTimeline {
  status: string;
  message: string;
  updatedBy?: mongoose.Types.ObjectId;
  timestamp: Date;
}

export interface IEmergency extends Document {
  _id: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  type: EmergencyType;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: EmergencyStatus;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
  };
  assignedHospitalId?: mongoose.Types.ObjectId;
  assignedAmbulanceId?: mongoose.Types.ObjectId;
  assignedVolunteers: mongoose.Types.ObjectId[];
  assignedDoctors: mongoose.Types.ObjectId[];
  familyMembers: mongoose.Types.ObjectId[];
  chatRoomId?: mongoose.Types.ObjectId;
  timeline: IEmergencyTimeline[];
  aiPriorityScore?: number;
  aiRecommendedHospitalIds?: mongoose.Types.ObjectId[];
  estimatedArrivalTime?: Date;
  resolvedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const emergencySchema = new Schema<IEmergency>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(EmergencyType),
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EmergencyStatus),
      default: EmergencyStatus.CREATED,
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
      address: { type: String },
    },
    assignedHospitalId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    assignedAmbulanceId: {
      type: Schema.Types.ObjectId,
      ref: 'Ambulance',
    },
    assignedVolunteers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    assignedDoctors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    familyMembers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    chatRoomId: { type: Schema.Types.ObjectId, ref: 'ChatRoom' },
    timeline: [
      {
        status: { type: String },
        message: { type: String },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    aiPriorityScore: { type: Number },
    aiRecommendedHospitalIds: [{ type: Schema.Types.ObjectId, ref: 'Organization' }],
    estimatedArrivalTime: { type: Date },
    resolvedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

emergencySchema.index({ location: '2dsphere' });
emergencySchema.index({ patientId: 1 });
emergencySchema.index({ status: 1 });
emergencySchema.index({ severity: 1 });
emergencySchema.index({ createdAt: -1 });

const Emergency = mongoose.model<IEmergency>('Emergency', emergencySchema);
export default Emergency;
