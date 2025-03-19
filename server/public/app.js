import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';


import authRoutes from '../routes/auth.routes.js'; //  Corrected path for public/



// Authentication Routes

// Convert __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
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

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/SecureChatDB')
.then(() => console.log(" Connected to MongoDB"))
.catch(err => console.error(" MongoDB Connection Error:", err));


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
    console.log(' Server is running on port 3500');
});