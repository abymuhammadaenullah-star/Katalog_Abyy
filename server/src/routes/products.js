import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db/db.js';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads/images');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `product-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, //5MB limit
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp|gif/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetpye);
        if (ext && mime) {
            return cb(null, true);
        }
        cb(new Error('Format file tidak didukung! Hanya gambar JPEG, PNG, WEBP'));
    }
});

const router = express.Router();

// GET all products with filtering & search (public)
router.get('/', (req, res) => {
    const { categoryId, search, stokStatus } = req.query;
    const products = db.getProducts({ categoryId, search, stokStatus });

    res.json({
        success: true,
        total: products.length,
        data: products
    });
});

// GET single product (public)
router.get('/:id', (req, res) => {
    const product = db.getProductById(req.params.id);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }
    res.json({ success: true, data: product });
});

// POST Create product (admin protected)
router.post('/', authenticateToken, upload.single('photo'), (req, res) => {
    const { name, categoryId, price, stokStatus, description, imageUrl } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Nama produk wajib diisi' });
    }
    if (!categoryId) {
        return res.status(400).json({ success: false, message: 'Kategori wajib dipilih' });
    }
    if (!price || isNaN(price) || Number(price) < 0) {
        return res.status(400).json({ success: false, message: 'Harga produk harus angka positif' });
    }

    let finalImage = imageUrl;
    if (req.file) {
        finalImage = `/uploads/${req.file.filename}`;
    }

    const newProduct = db.addProduct({
        name: name.trim(),
        categoryId,
        price: Number(price),
        stokStatus: stokStatus || 'Tersedia',
        description: description ? description.trim() : '',
        image: finalImage || ''
    });

    res.status(201).json({
        success: true,
        message: 'Produk berhasil ditambahkan',
        data: newProduct,
    });
});

// PUT update product (admin protected)
router.put('/:id', authenticateToken, upload.single('photo'), (req, res) => {
    const { id } = req.params;
    const { name, categoryId, price, stokStatus, description, imageUrl } = req.body;

    const existing = db.getProductById(id);
    if (!existing) {
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (categoryId !== undefined) updatePayload.categoryId = categoryId;
    if (price !== undefined) updatePayload.price = Number(price);
    if (stokStatus !== undefined) updatePayload.stokStatus = stokStatus;
    if (description !== undefined) updatePayload.description = description.trim();

    if (req.file) {
        updatePayload.image = `/uploads/${req.file.filename}`;
    } else if (imageUrl !== undefined && imageUrl.trim()) {
        updatePayload.image = imageUrl.trim();
    }

    const updated = db.updateProduct(id, updatePayload);

    res.json({
        success: true,
        message: 'Produk berhasil diperbarui',
        data: updated
    });
});

// PATCH toggle stok status (admin protected)
router.patch('/:id/stock', authenticateToken, (req, res) => {
    const { id } = req.params;
    const updated = db.toggleStock(id);

    if (!updated) {
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    res.json({
        success: true,
        message: `Status stok berhasil diubah menjadi ${updated.stokStatus}`,
        data: updated
    });
});

// DELETE product (admin protected)
router.delete('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const deleted = db.deleteProduct(id);
    if (!deleted) {
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }
    res.json({
        success: true,
        message: 'Produk berhasil dihapus'
    });
});

export default router;