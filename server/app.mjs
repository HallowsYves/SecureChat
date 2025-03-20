import express from 'express';
import https from 'https';
import fs from 'fs';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import Message from './models/message.js';
import sanitizeHtml from 'sanitize-html';

import authRoutes from './routes/auth.routes.js'; // Adjust path as needed
import { logMessage } from './logger.js'; // Import the logger function

// Generate UUID
/*
  * Replaces, each placeholder with random hexadecimal digit
  * For x, it uses any random hex digit from (0-f)
  * For y, it makes sure that the digit is 8,9,a, or b
*/
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Convert __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, '../certs/server.key')),
    cert: fs.readFileSync(path.join(__dirname, '../certs/server.cert'))
};

const server = https.createServer(httpsOptions, app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Multer config for file uploads
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('myFile'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      message: 'File uploaded successfully!',
      fileUrl,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
    });
});

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/SecureChatDB')
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB Connection Error:", err));

// Routes
app.use('/auth', authRoutes);

// WebSocket Chat Logic
io.on("connection", (socket) => {
  // For multiple sessions, generate a unique sessionId per connection.
  const sessionId = generateUUID();
  socket.emit("sessionAssigned", { sessionId });
  console.log(`New user connected: ${socket.id} with session: ${sessionId}`);

  socket.on("message", async (data) => {
    // Ensure every message includes the sessionId
    data.sessionId = data.sessionId || sessionId;

    // Log the message concurrently using our asynchronous function
    
    data.text = sanitizeHtml(data.text, {
      allowedTags: [],
      allowedAttributes: {}
    });
    
    logMessage(data.sessionId, data.sender, data.text);

    // (Optional) Save the message to MongoDB or process further...
    if (data.type === 'text') {
      try {
        const msg = new Message({
          sender: data.sender,
          content: data.text,
          sessionId: data.sessionId,
        });
        await msg.save();
      } catch (err) {
        console.error("Error saving message:", err);
      }
    }
    
    io.emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

  
// Start server
server.listen(3500, () => {
    console.log('SecureChat is running on https://localhost:3500');
});
