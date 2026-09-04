import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicalRecord extends Document {
  _id: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  type: 'prescription' | 'blood_report' | 'scan' | 'insurance' | 'discharge_summary' | 'other';
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  hospitalId?: mongoose.Types.ObjectId;
  doctorId?: mongoose.Types.ObjectId;
  emergencyId?: mongoose.Types.ObjectId;
  tags: string[];
  isSharedWithFamily: boolean;
  familyAccessList: mongoose.Types.ObjectId[];
  recordDate: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const medicalRecordSchema = new Schema<IMedicalRecord>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['prescription', 'blood_report', 'scan', 'insurance', 'discharge_summary', 'other'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number },
    mimeType: { type: String },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User' },
    emergencyId: { type: Schema.Types.ObjectId, ref: 'Emergency' },
    tags: [{ type: String }],
    isSharedWithFamily: { type: Boolean, default: false },
    familyAccessList: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    recordDate: { type: Date, required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

medicalRecordSchema.index({ patientId: 1 });
medicalRecordSchema.index({ type: 1 });
medicalRecordSchema.index({ recordDate: -1 });

const MedicalRecord = mongoose.model<IMedicalRecord>('MedicalRecord', medicalRecordSchema);
export default MedicalRecord;
