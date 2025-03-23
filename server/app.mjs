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
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

import authRoutes from './routes/auth.routes.js';
import { logMessage } from './logger.js';

// Generate UUID for a unique session ID per socket connection
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
// If "uploads" folder is inside "server", then path.join(__dirname, 'uploads') is correct.
// If it's one level up, use path.join(__dirname, '../uploads').
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth routes
app.use('/auth', authRoutes);

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

// WebSocket Chat Logic
io.on("connection", (socket) => {
  // Unique sessionId for this connection
  const sessionId = generateUUID();
  socket.emit("sessionAssigned", { sessionId });
  console.log(`New user connected: ${socket.id} with session: ${sessionId}`);

  // Join a conversation (room) when requested
  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    socket.emit("conversationJoined", { conversationId });
  });

  // Handle incoming messages
  socket.on("message", async (data) => {
    // We require a conversationId to broadcast properly
    if (!data.conversationId) {
      console.error("No conversationId provided with message");
      return;
    }

    // If it's a text message, convert Markdown to HTML and sanitize
    if (data.type === 'text' && data.text) {
      let htmlContent = marked.parseInline(data.text);
      htmlContent = sanitizeHtml(htmlContent, {
        allowedTags: ['b', 'strong', 'i', 'em', 'u', 'a', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'p', 'br'],
        allowedAttributes: { 'a': ['href', 'target'] },
        allowedSchemes: ['http', 'https', 'mailto']
      });
      data.text = htmlContent;
    }

    // Log the message using conversationId
    logMessage(data.conversationId, data.sender, data.text || '[file message]');

    // Save text messages to MongoDB if desired
    if (data.type === 'text') {
      try {
        const msg = new Message({
          sender: data.sender,
          content: data.text,
          conversationId: data.conversationId, // store conversationId in DB
        });
        await msg.save();
      } catch (err) {
        console.error("Error saving message:", err);
      }
    }

    // Broadcast to everyone in that conversation room
    io.to(data.conversationId).emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Start server
server.listen(3500, '0.0.0.0', () => {
  console.log(`SecureChat is running on LocalIP:3500`);
});
