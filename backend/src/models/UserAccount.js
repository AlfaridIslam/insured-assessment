import mongoose from 'mongoose';

const userAccountSchema = new mongoose.Schema(
  {
    accountName: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
    },
    accountType: {
      type: String,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('UserAccount', userAccountSchema);
