import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema({
  agentName: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('Agent', agentSchema);