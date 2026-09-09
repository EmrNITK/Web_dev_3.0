import mongoose from 'mongoose';

const AnswerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed },   // string, array, etc.
  pointsEarned: { type: Number, default: 0 }
}, { _id: false });

const ResponseSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // NEW: Track logged-in user
  submittedAt: { type: Date, default: Date.now },
  respondentEmail: { type: String, default: null },
  answers: [AnswerSchema],
  totalScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  remark: {type: String, default: ''},
  color: {type: String, default: 'no-color'},
  paymentStatus: {
    type: String,
    enum: ['NOT_REQUIRED', 'PENDING', 'SUCCESS', 'PENDING_VERIFICATION', 'FAILED'],
    default: 'NOT_REQUIRED'
  },
  paymentDetails: {
    orderId: { type: String, default: '' },
    txnRef: { type: String, default: '' },
    baseAmount: { type: Number, default: 0 },
    exactAmount: { type: Number, default: 0 },
    screenshotUrl: { type: String, default: '' },
    transactionId: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
    paidAt: { type: Date, default: null }
  }
}, { timestamps: true });

export default mongoose.model('Response', ResponseSchema);