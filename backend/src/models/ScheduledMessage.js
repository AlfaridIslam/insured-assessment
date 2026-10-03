import mongoose from 'mongoose';

const scheduledMessageSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, 'Message body is required'],
      trim: true,
    },
    day: {
      type: String,
      trim: true,
    },
    time: {
      type: String,
      trim: true,
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Calculated scheduled execution timestamp is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'queued', 'sent', 'failed'],
      default: 'pending',
      index: true,
    },
    jobId: {
      type: String,
      trim: true,
    },
    sentAt: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('ScheduledMessage', scheduledMessageSchema);
