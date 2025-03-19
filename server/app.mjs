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

import authRoutes from './routes/auth.routes.js'; // Adjust path as needed
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
app.use(bodyParser.urlencoded({extended: true}))


// Multer config
const upload = multer({dest: 'uploads/'});

app.post('/upload', upload.single('myFile'), (req,res) => {
    try {
        console.log('Uploaded file:', req.file);
        res.json({message: 'File uploaded successfully!', file:req.file});
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'File upload failed'});
    }
});

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/SecureChatDB')
.then(() => console.log(" Connected to MongoDB"))
.catch(err => console.error(" MongoDB Connection Error:", err));

// Routes 
app.use('/auth', authRoutes);


// WebSocket Chat Logic
io.on("connection", (socket) => {
    console.log(` New user connected: ${socket.id}`);

    // Handle incoming chat messages
    socket.on("message", (data) => {
        console.log(`📨 Message received: ${data}`);
        io.emit("message", data); //  Broadcast message to all users
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
        console.log(` User disconnected: ${socket.id}`);
    });
});

// Start server
server.listen(3500, () => {
    console.log('SecureChat is running on https://localhost:3500');
  });