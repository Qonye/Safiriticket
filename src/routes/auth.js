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

// Valid roles
const VALID_ROLES = ['superadmin', 'systemsadmin', 'admin', 'marketing', 'receptionist', 'accounting', 'user'];

// Helper function to check if user has superadmin-level privileges
function isSuperAdminLevel(role) {
    return role === 'superadmin' || role === 'systemsadmin';
}

// Helper function to check if user can manage users
function canManageUsers(role) {
    return isSuperAdminLevel(role) || role === 'admin';
}

// Get all users (admin and superadmin only)
router.get('/users', authenticate, async (req, res) => {
    if (!canManageUsers(req.user.role)) {
        return res.status(403).json({ error: 'Not authorized' });
    }
    
    try {
        const users = await User.find({}, { password: 0 });
        // Normalize _id to id for consistency
        const normalizedUsers = users.map(user => ({
            id: user._id.toString(),
            _id: user._id.toString(),
            username: user.username,
            name: user.name,
            role: user.role
        }));
        res.json(normalizedUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new user (admin and superadmin only)
router.post('/users', authenticate, async (req, res) => {
    if (!canManageUsers(req.user.role)) {
        return res.status(403).json({ error: 'Not authorized' });
    }

    try {
        const { username, password, name, role } = req.body;

        // Validation
        if (!username || !password || !name) {
            return res.status(400).json({ error: 'Username, password, and name are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Only superadmin-level can create superadmin, systemsadmin, or admin users
        if (role && (role === 'superadmin' || role === 'systemsadmin' || role === 'admin') && !isSuperAdminLevel(req.user.role)) {
            return res.status(403).json({ error: 'Only superadmin or systems admin can create admin, systems admin, or superadmin users' });
        }

        if (role && !VALID_ROLES.includes(role)) {
            return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
        }

        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            username,
            password: hashedPassword,
            name,
            role: role || 'user'
        });

        res.status(201).json({
            id: user._id,
            username: user.username,
            name: user.name,
            role: user.role
        });
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user (admin and superadmin only)
router.put('/users/:id', authenticate, async (req, res) => {
    if (!canManageUsers(req.user.role)) {
        return res.status(403).json({ error: 'Not authorized' });
    }

    try {
        const { id } = req.params;
        const { name, role, password } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Only superadmin-level can modify superadmin, systemsadmin, or admin users
        if (role !== undefined && (user.role === 'superadmin' || user.role === 'systemsadmin' || user.role === 'admin' || role === 'superadmin' || role === 'systemsadmin' || role === 'admin')) {
            if (!isSuperAdminLevel(req.user.role)) {
                return res.status(403).json({ error: 'Only superadmin or systems admin can modify admin, systems admin, or superadmin users' });
            }
        }

        // Prevent modifying the last superadmin
        if (user.role === 'superadmin' && role !== undefined && role !== 'superadmin') {
            const superadminCount = await User.countDocuments({ role: 'superadmin' });
            if (superadminCount === 1) {
                return res.status(400).json({ error: 'Cannot change role of the last superadmin' });
            }
        }

        // Update fields
        if (name !== undefined) user.name = name;
        if (role !== undefined) {
            if (!VALID_ROLES.includes(role)) {
                return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
            }
            user.role = role;
        }
        if (password !== undefined) {
            if (password.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters' });
            }
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        res.json({
            id: user._id,
            username: user.username,
            name: user.name,
            role: user.role
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete user (admin and superadmin only)
router.delete('/users/:id', authenticate, async (req, res) => {
    if (!canManageUsers(req.user.role)) {
        return res.status(403).json({ error: 'Not authorized' });
    }

    try {
        const { id } = req.params;

        // Prevent deleting yourself
        if (req.user._id.toString() === id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Only superadmin-level can delete admin, systemsadmin, or superadmin users
        if ((user.role === 'superadmin' || user.role === 'systemsadmin' || user.role === 'admin') && !isSuperAdminLevel(req.user.role)) {
            return res.status(403).json({ error: 'Only superadmin or systems admin can delete admin, systems admin, or superadmin users' });
        }

        // Prevent deleting the last superadmin
        if (user.role === 'superadmin') {
            const superadminCount = await User.countDocuments({ role: 'superadmin' });
            if (superadminCount === 1) {
                return res.status(400).json({ error: 'Cannot delete the last superadmin' });
            }
        }

        await User.findByIdAndDelete(id);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reset user password (admin and superadmin only)
router.post('/users/:id/reset-password', authenticate, async (req, res) => {
    if (!canManageUsers(req.user.role)) {
        return res.status(403).json({ error: 'Not authorized' });
    }

    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Password is required and must be at least 6 characters' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Only superadmin-level can reset password for admin, systemsadmin, or superadmin users
        if ((user.role === 'superadmin' || user.role === 'systemsadmin' || user.role === 'admin') && !isSuperAdminLevel(req.user.role)) {
            return res.status(403).json({ error: 'Only superadmin or systems admin can reset password for admin, systems admin, or superadmin users' });
        }

        user.password = await bcrypt.hash(password, 10);
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;