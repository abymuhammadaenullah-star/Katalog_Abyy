import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db/db.js';
import { authenticateToken, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// Admin Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email dan password wajib diisi'
        });
    }

    const admin = db.getAdmin();

    // Validate email
    if (email.trim().toLowerCase() !== admin.email.toLowerCase()) {
        return res.status(401).json({
            success: false,
            message: 'Email atau password salah'
        });
    }

    // Validate password
    const isMatch = bcrypt.compareSync(password, admin.password);
    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: 'Email atau password salah'
        });
    }

    // Generate JWT token (expires in 24 hours)
    const token = jwt.sign(
        { id: admin.id, email: admin.email, name: admin.name },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    return res.json({
        success: true,
        message: 'Login berhasil',
        token,
        user: { id: admin.id, name: admin.name, email: admin.email }
    });
});

// Verify token & get current profile
router.get('/me', authenticateToken, (req, res) => {
    const admin = db.getAdmin();
    res.json({
        success: true,
        user: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
        }
    });
});

export default router;

