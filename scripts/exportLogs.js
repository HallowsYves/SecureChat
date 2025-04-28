import fs from 'fs';
import mongoose from 'mongoose';
import message from '../server/models/message.js';
import activity from '../server/models/activity.js';


// Connect to your MongoDB
await mongoose.connect('mongodb://localhost:27017/SecureChatDB');

// Fetch Messages
const allMessages = await message.find({}).sort({ timestamp: 1 });

// Fetch activities
const allActivities = await activity.find({}).sort({ timestamp: 1});

const exportData = {
    messages: allMessages,
    activities: allActivities
  };

  
fs.writeFileSync('messages-log.txt', JSON.stringify(allMessages, null, 2));

mongoose.connection.close();

console.log('Messages successfully exported to messages-log.txt');