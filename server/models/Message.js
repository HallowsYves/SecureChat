import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  content: { type: String, required: true },
  conversationId: {type: String, required: true},
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model('Message', messageSchema);
