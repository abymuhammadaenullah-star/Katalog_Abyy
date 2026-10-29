import express from 'express';
import { db } from '../db/db.js'
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all categories (public)
router.get('/', (req, res) => {
    const categories = db.getCategories();
    res.json({
        success: true,
        data: categories
    });
});

// POST Create Category (Admin protected)
router.post('/', authenticateToken, (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({
            success: false,
            message: 'Nama kategori wajib diisi'
        });
    }

    // Check duplicate
    const existing = db.getCategories().find(c => c.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) {
        return res.status(400).json({
            success: false,
            message: 'Kategori dengan nama tersebut sudah ada'
        });
    }

    try {
        const newCat = db.addCategory(name.trim());
        res.status(201).json({
            success: true,
            message: 'Kategori berhasil ditambahkan',
            data: newCat,
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// PUT Update Category (Admin protected)
router.put('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({
            success: false,
            message: 'Nama kategori wajib diisi'
        });
    }

    try {
        const updated = db.updateCategory(id, name.trim());
        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Kategori tidak ditemukan'
            })
        }

        res.json({
            success: true,
            message: 'Kategori berhasil diperbarui',
            data: updated
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

//DELETE category (admin protected)
router.delete('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const products = db.getProducts({ categoryId: id });

    if (products.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Tidak dapat menghapus kategori karena memiliki ${products.length} produk terkait. Hapus atau pindahkan produk terlebih dahulu.`
        });
    }

    const deleted = db.deleteCategory(id);
    if (!deleted) {
        return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    res.json({
        success: true,
        message: 'Kategori berhasil dihapus'
    });
});

export default router;
