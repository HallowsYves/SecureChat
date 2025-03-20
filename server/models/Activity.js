import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  type: { type: String, enum: ['signIn', 'registration'], required: true },
  username: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model('Activity', activitySchema);