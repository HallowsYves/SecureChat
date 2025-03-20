import express from 'express';
import Activity from '../models/Activity.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js'; 

const router = express.Router();
const SECRET_KEY = 'your-secret-key'; // Change this in production

router.post('/login', async (req, res) => {
        const { username, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT Token
        const token = jwt.sign({ userId: user._id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });

        // Log the sign-in
        try {
            const activity = new Activity({ type: 'signIn', username: user.username });
            await activity.save();
        } catch (error) {
            console.error("Sign-in logging error:", error);

        }
        // Send token as response
        res.json({
             message: 'Login successful', 
             token,
            username: user.username 
        });
});

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({ username, passwordHash: hashedPassword });
        await newUser.save();

        // Send success response
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
export default router;
