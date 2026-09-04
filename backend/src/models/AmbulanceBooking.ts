import mongoose, { Schema, Document } from 'mongoose';

export interface IAmbulanceBooking extends Document {
  _id: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  ambulanceId: mongoose.Types.ObjectId;
  emergencyId?: mongoose.Types.ObjectId;
  pickupLocation: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
  };
  dropLocation?: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
  };
  status: 'requested' | 'accepted' | 'en_route' | 'arrived' | 'completed' | 'cancelled';
  eta?: number; // minutes
  startedAt?: Date;
  arrivedAt?: Date;
  completedAt?: Date;
  distanceKm?: number;
  fare?: number;
  transactionId?: mongoose.Types.ObjectId;
  driverNotes?: string;
  rating?: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ambulanceBookingSchema = new Schema<IAmbulanceBooking>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ambulanceId: { type: Schema.Types.ObjectId, ref: 'Ambulance', required: true },
    emergencyId: { type: Schema.Types.ObjectId, ref: 'Emergency' },
    pickupLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
      address: { type: String },
    },
    dropLocation: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
      address: { type: String },
    },
    status: {
      type: String,
      enum: ['requested', 'accepted', 'en_route', 'arrived', 'completed', 'cancelled'],
      default: 'requested',
    },
    eta: { type: Number },
    startedAt: { type: Date },
    arrivedAt: { type: Date },
    completedAt: { type: Date },
    distanceKm: { type: Number },
    fare: { type: Number },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    driverNotes: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String },
  },
  { timestamps: true }
);

ambulanceBookingSchema.index({ patientId: 1 });
ambulanceBookingSchema.index({ ambulanceId: 1 });
ambulanceBookingSchema.index({ status: 1 });
ambulanceBookingSchema.index({ createdAt: -1 });

const AmbulanceBooking = mongoose.model<IAmbulanceBooking>('AmbulanceBooking', ambulanceBookingSchema);
export default AmbulanceBooking;
