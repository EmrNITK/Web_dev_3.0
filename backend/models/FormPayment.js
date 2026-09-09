import mongoose from 'mongoose';

const FormPaymentSchema = new mongoose.Schema(
  {
    formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    txnRef: { type: String, required: true, unique: true },
    baseAmount: { type: Number, required: true },
    exactAmount: { type: Number, required: true, index: true },
    merchantUpiId: { type: String, required: true },
    merchantName: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'PENDING_VERIFICATION', 'FAILED', 'EXPIRED'],
      default: 'PENDING',
      index: true
    },
    upiUrl: { type: String, required: true },
    manualProof: {
      screenshotUrl: { type: String, default: '' },
      transactionId: { type: String, default: '' },
      phoneNumber: { type: String, default: '' },
      submittedAt: { type: Date, default: null }
    },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

export default mongoose.model('FormPayment', FormPaymentSchema);
