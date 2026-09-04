import mongoose, { Schema, Document } from 'mongoose';
import { EquipmentStatus } from '../constants/enums';

export interface IMedicalEquipment extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  category: 'wheelchair' | 'ventilator' | 'hospital_bed' | 'oxygen_concentrator' | 'other';
  ownerId: mongoose.Types.ObjectId;
  ownerType: 'User' | 'Organization';
  status: EquipmentStatus;
  condition: 'new' | 'good' | 'fair' | 'poor';
  description?: string;
  images: string[];
  location: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
  };
  currentUserId?: mongoose.Types.ObjectId;
  transferHistory: {
    fromId: mongoose.Types.ObjectId;
    toId: mongoose.Types.ObjectId;
    date: Date;
    notes?: string;
  }[];
  isAvailableForDonation: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const medicalEquipmentSchema = new Schema<IMedicalEquipment>(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['wheelchair', 'ventilator', 'hospital_bed', 'oxygen_concentrator', 'other'],
      required: true,
    },
    ownerId: { type: Schema.Types.ObjectId, required: true },
    ownerType: { type: String, enum: ['User', 'Organization'], required: true },
    status: {
      type: String,
      enum: Object.values(EquipmentStatus),
      default: EquipmentStatus.AVAILABLE,
    },
    condition: {
      type: String,
      enum: ['new', 'good', 'fair', 'poor'],
      default: 'good',
    },
    description: { type: String },
    images: [{ type: String }],
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
      address: { type: String },
    },
    currentUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    transferHistory: [
      {
        fromId: { type: Schema.Types.ObjectId },
        toId: { type: Schema.Types.ObjectId },
        date: { type: Date, default: Date.now },
        notes: { type: String },
      },
    ],
    isAvailableForDonation: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

medicalEquipmentSchema.index({ location: '2dsphere' });
medicalEquipmentSchema.index({ category: 1 });
medicalEquipmentSchema.index({ status: 1 });

const MedicalEquipment = mongoose.model<IMedicalEquipment>('MedicalEquipment', medicalEquipmentSchema);
export default MedicalEquipment;
