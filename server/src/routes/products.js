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
        const mime = allowed.test(file.mimetype);
        if (ext && mime) {
            return cb(null, true);
        }
        cb(new Error('Format file tidak didukung! Gunakan gambar JPEG, PNG, WEBP, atau GIF'));
    }
});

const router = express.Router();
const uploadProductPhoto = (req, res, next) => {
    upload.single('photo')(req, res, (error) => {
        if (!error) return next();
        const message = error instanceof multer.MulterError
            ? error.code === 'LIMIT_FILE_SIZE'
                ? 'Ukuran gambar maksimal 5 MB'
                : error.message
            : error.message || 'Gagal mengunggah gambar produk';
        return res.status(400).json({ success: false, message });
    });
};

const removeUploadedFile = (filename) => {
    if (!filename) return;
    try {
        fs.unlinkSync(path.join(uploadsDir, path.basename(filename)));
    } catch (error) {
        if (error.code !== 'ENOENT') console.error('Gagal menghapus file upload:', error);
    }
};

const removeUnusedProductImage = (image) => {
    if (typeof image !== 'string' || !image.startsWith('/uploads/')) return;
    const filename = image.slice('/uploads/'.length);
    if (!filename || path.basename(filename) !== filename) return;
    if (db.getProductImageUsageCount(image) > 0) return;
    removeUploadedFile(filename);
};

// GET all products with filtering & search (public)
router.get('/', (req, res) => {
    const { categoryId, search } = req.query;
    const stockStatus = req.query.stockStatus || req.query.stokStatus;
    const products = db.getProducts({ categoryId, search, stockStatus });

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
router.post('/', authenticateToken, uploadProductPhoto, (req, res) => {
    const { name, categoryId, price, description, imageUrl } = req.body;
    const stockStatus = req.body.stockStatus ?? req.body.stokStatus ?? 'Tersedia';
    const stockQuantity = req.body.stockQuantity === undefined
        ? 1
        : Number(req.body.stockQuantity);

    if (!name || !name.trim()) {
        removeUploadedFile(req.file?.filename);
        return res.status(400).json({ success: false, message: 'Nama produk wajib diisi' });
    }
    if (!categoryId) {
        removeUploadedFile(req.file?.filename);
        return res.status(400).json({ success: false, message: 'Kategori wajib dipilih' });
    }
    if (!price || isNaN(price) || Number(price) < 0) {
        removeUploadedFile(req.file?.filename);
        return res.status(400).json({ success: false, message: 'Harga produk harus angka positif' });
    }
    if (!Number.isSafeInteger(stockQuantity) || stockQuantity < 0) {
        removeUploadedFile(req.file?.filename);
        return res.status(400).json({ success: false, message: 'Jumlah stok harus bilangan bulat minimal 0' });
    }
    if (!['Tersedia', 'Habis'].includes(stockStatus)) {
        removeUploadedFile(req.file?.filename);
        return res.status(400).json({ success: false, message: 'Status stok tidak valid' });
    }

    let finalImage = imageUrl;
    if (req.file) {
        finalImage = `/uploads/${req.file.filename}`;
    }

    let newProduct;
    try {
        newProduct = db.addProduct({
            name: name.trim(),
            categoryId,
            price: Number(price),
            stockQuantity,
            stockStatus,
            description: description ? description.trim() : '',
            image: finalImage || ''
        });
    } catch (error) {
        removeUploadedFile(req.file?.filename);
        throw error;
    }

    res.status(201).json({
        success: true,
        message: 'Produk berhasil ditambahkan',
        data: newProduct,
    });
});

// PUT update product (admin protected)
router.put('/:id', authenticateToken, uploadProductPhoto, (req, res) => {
    const { id } = req.params;
    const { name, categoryId, price, description, imageUrl } = req.body;
    const stockStatus = req.body.stockStatus ?? req.body.stokStatus;
    const stockQuantity = req.body.stockQuantity === undefined ? undefined : Number(req.body.stockQuantity);

    const existing = db.getProductById(id);
    if (!existing) {
        removeUploadedFile(req.file?.filename);
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }
    if (stockQuantity !== undefined && (!Number.isSafeInteger(stockQuantity) || stockQuantity < 0)) {
        removeUploadedFile(req.file?.filename);
        return res.status(400).json({ success: false, message: 'Jumlah stok harus bilangan bulat minimal 0' });
    }
    if (stockStatus !== undefined && !['Tersedia', 'Habis'].includes(stockStatus)) {
        removeUploadedFile(req.file?.filename);
        return res.status(400).json({ success: false, message: 'Status stok tidak valid' });
    }

    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (categoryId !== undefined) updatePayload.categoryId = categoryId;
    if (price !== undefined) updatePayload.price = Number(price);
    if (stockStatus !== undefined) updatePayload.stockStatus = stockStatus;
    if (stockQuantity !== undefined) updatePayload.stockQuantity = stockQuantity;
    if (description !== undefined) updatePayload.description = description.trim();

    if (req.file) {
        updatePayload.image = `/uploads/${req.file.filename}`;
    } else if (req.body.removeImage === 'true') {
        updatePayload.image = null;
    } else if (imageUrl !== undefined && imageUrl.trim()) {
        updatePayload.image = imageUrl.trim();
    }

    let updated;
    try {
        updated = db.updateProduct(id, updatePayload);
    } catch (error) {
        removeUploadedFile(req.file?.filename);
        throw error;
    }
    if (updatePayload.image !== undefined && updatePayload.image !== existing.image) {
        removeUnusedProductImage(existing.image);
    }

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
        message: `Stok berhasil diubah menjadi ${updated.stockQuantity} unit`,
        data: updated
    });
});

// DELETE product (admin protected)
router.delete('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const existing = db.getProductById(id);
    const deleted = db.deleteProduct(id);
    if (!deleted) {
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }
    removeUnusedProductImage(existing?.image);
    res.json({
        success: true,
        message: 'Produk berhasil dihapus'
    });
});

export default router;