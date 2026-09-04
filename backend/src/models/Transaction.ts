import mongoose, { Schema, Document } from 'mongoose';
import { TransactionStatus, TransactionType } from '../constants/enums';

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  referenceId?: mongoose.Types.ObjectId; // campaign / ambulance booking / etc.
  referenceModel?: string;
  description?: string;
  receiptUrl?: string;
  metadata?: Record<string, unknown>;
  failureReason?: string;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    referenceId: { type: Schema.Types.ObjectId },
    referenceModel: { type: String },
    description: { type: String },
    receiptUrl: { type: String },
    metadata: { type: Schema.Types.Mixed },
    failureReason: { type: String },
    refundedAt: { type: Date },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ razorpayOrderId: 1 });
transactionSchema.index({ createdAt: -1 });

const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
export default Transaction;
