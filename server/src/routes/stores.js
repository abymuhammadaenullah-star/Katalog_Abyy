import express from 'express';
import { db } from '../db/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET Store settings (public)
router.get('/', (req, res) => {
    try {
        const settings = db.getSettings();

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Error mengambil pengaturan toko:', error);

        res.status(500).json({
            success: false,
            message: 'Gagal mengambil pengaturan toko'
        });
    }
});

// PUT update store settings (admin protected)
router.put('/', authenticateToken, (req, res) => {
    try {
        const { storeName, tagline, phone, address } = req.body;

        const current = db.getSettings();

        const updated = db.updateSettings({
            storeName: storeName || current.storeName,
            tagline: tagline || current.tagline,
            phone: phone
                ? phone.replace(/[^0-9]/g, '')
                : current.phone,
            address: address !== undefined
                ? address
                : current.address
        });

        res.json({
            success: true,
            message: 'Pengaturan toko berhasil disimpan',
            data: updated
        });
    } catch (error) {
        console.error('Error memperbarui pengaturan toko:', error);

        res.status(500).json({
            success: false,
            message: 'Gagal memperbarui pengaturan toko'
        });
    }
});

export default router;

