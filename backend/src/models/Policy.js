import mongoose from 'mongoose';

const policySchema = new mongoose.Schema(
  {
    policyNumber: {
      type: String,
      required: [true, 'Policy number is required'],
      trim: true,
      unique: true,
      index: true,
    },
    policyStartDate: {
      type: Date,
    },
    policyEndDate: {
      type: Date,
    },
    policyCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PolicyCategory',
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PolicyCarrier',
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    premiumAmount: {
      type: Number,
      default: 0,
    },
    policyType: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful compound indexes
policySchema.index({ userId: 1, policyNumber: 1 });

export default mongoose.model('Policy', policySchema);
