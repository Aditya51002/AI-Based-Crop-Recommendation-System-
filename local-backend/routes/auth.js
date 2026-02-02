const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

function signToken(userId) {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jwt.sign({ id: userId }, secret, { expiresIn });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!name || !password || (!email && !phone)) {
            return res.status(400).json({ success: false, message: 'Name, password, and email or phone are required' });
        }

        const existing = await User.findOne({ $or: [{ email }, { phone }] });
        if (existing) {
            return res.status(409).json({ success: false, message: 'User already exists' });
        }

        const user = await User.create({ name, email, phone, password });
        const token = signToken(user._id);

        return res.status(201).json({ success: true, user: user.toSafeJSON(), token });
    } catch (err) {
        console.error('Register error:', err.message);
        return res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, phone, password } = req.body;
        const identifier = email || phone;
        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: 'Email/phone and password are required' });
        }

        const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] }).select('+password');
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const valid = await user.comparePassword(password);
        if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const token = signToken(user._id);
        return res.json({ success: true, user: user.toSafeJSON(), token });
    } catch (err) {
        console.error('Login error:', err.message);
        return res.status(500).json({ success: false, message: 'Login failed' });
    }
});

module.exports = router;
