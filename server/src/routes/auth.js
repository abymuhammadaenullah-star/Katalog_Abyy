import express from 'express';
import bcrypt from 'bcryptjs';
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

// Update current admin profile
router.put('/profile', authenticateToken, (req, res, next) => {
    const { name, email, currentPassword, newPassword } = req.body;
    const admin = db.getAdmin();

    if (!admin || admin.id !== req.user.id) {
        return res.status(401).json({ success: false, message: 'Sesi admin tidak valid' });
    }
    if (
        typeof name !== 'string' ||
        !name.trim() ||
        name.trim().length > 100 ||
        typeof email !== 'string' ||
        !email.trim() ||
        email.trim().length > 254 ||
        typeof currentPassword !== 'string' ||
        !currentPassword ||
        (newPassword !== undefined && typeof newPassword !== 'string')
    ) {
        return res.status(400).json({
            success: false,
            message: 'Nama, email, dan password saat ini wajib diisi dengan format yang valid'
        });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ success: false, message: 'Format email tidak valid' });
    }
    if (newPassword && newPassword.length < 8) {
        return res.status(400).json({
            success: false,
            message: 'Password baru minimal 8 karakter'
        });
    }
    if (!bcrypt.compareSync(currentPassword, admin.password)) {
        return res.status(401).json({ success: false, message: 'Password saat ini tidak sesuai' });
    }

    const hashedPassword = newPassword
        ? bcrypt.hashSync(newPassword, 10)
        : admin.password;

    let user;
    try {
        user = db.updateAdmin(admin.id, {
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ success: false, message: 'Email sudah digunakan' });
        }
        return next(error);
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    return res.json({
        success: true,
        message: 'Profil admin berhasil diperbarui',
        token,
        user
    });
});

export default router;
