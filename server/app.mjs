import express from 'express';
import session from 'express-session';
import http from 'http';
import https from 'https';
import fs from 'fs';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import path from 'path';
import MongoStore from 'connect-mongo';
import mongoose, { mongo } from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import Message from './models/message.js';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import { logMessage } from './logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const raw = process.env.ALLOWED_ORIGINS || '';
const allowedOrigins = raw
  .split(',')
  .map(origin => origin.trim())
  // ensure both http/https variants
  .flatMap(o => o.startsWith('http') ? [o] : [])
;

// Ensure file‑sharing origin is allowed
const fileSharingOrigin = 'https://securechat-file-sharing.onrender.com';
if (!allowedOrigins.includes(fileSharingOrigin)) {
  allowedOrigins.push(fileSharingOrigin);
}

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
  credentials: true
};

console.log('CORS allowing origins: ', allowedOrigins);

// SETUP session 
const app = express();

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Serve front end
app.use(express.static(path.join(__dirname, '../public')));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.DB_URL,
    collectionName: 'sessions'
  }),
}));



// Generate UUID for a unique session ID per socket connection
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Convert __dirname for ES modules



const useHttps = process.env.USE_HTTPS === 'true';

// Choose depending on certs / no certs
let server;

if (useHttps === 'true') {
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, '/certs/server.key')),
    cert: fs.readFileSync(path.join(__dirname, '/certs/server.cert')),
  };
  server = https.createServer(httpsOptions, app);
  console.log('HTTPS server running @ (local dev)');
} else {
  server = http.createServer(app);
  console.log(' HTTP server running');
}





const io = new Server(server, {cors: corsOptions});

// MIME type for .mjs files so browsers don't reject
app.get('*.mjs', function(req, res, next) {
  res.type("application/javascript");
  next();
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth routes
app.use('/auth', cors(corsOptions), authRoutes);


app.get('/chat.html', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('auth.html');
  }
  res.sendFile(path.join(__dirname, '../public/chat.html'));
})


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
mongoose.connect(process.env.DB_URL,)
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB connection error", err));

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

const PORT = process.env.PORT || 3500;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`SecureChat is running on port ${PORT}`);
});