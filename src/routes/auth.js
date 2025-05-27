import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
    try {
        console.log('Login attempt:', req.body);
        const { username, password } = req.body;
        
        // Find user by username
        const user = await User.findOne({ username });
        console.log('User found:', user ? 'Yes' : 'No');
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        console.log('Comparing password...');
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isValidPassword ? 'Yes' : 'No');
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'changeme', { expiresIn: '24h' });

        // Return user info and token
        res.json({
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Check authentication status
router.get('/me', authenticate, (req, res) => {
    res.json({
        id: req.user._id,
        username: req.user.username,
        name: req.user.name,
        role: req.user.role
    });
});

// Get all users (admin only)
router.get('/users', authenticate, async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Not authorized' });
    }
    
    try {
        const users = await User.find({}, { password: 0 }); // Don't include passwords
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;