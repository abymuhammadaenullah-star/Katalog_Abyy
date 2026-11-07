import express from 'express';
import { db } from '../db/db.js';
import { authenticateToken } from '../middleware/auth.js';

const ORDER_STATUSES = [
  'Menunggu Konfirmasi',
  'Diproses',
  'Dikirim',
  'Selesai',
  'Dibatalkan',
];

const router = express.Router();

router.post('/', (req, res, next) => {
  const { customerName, customerPhone = '', customerNotes = '', items } = req.body || {};
  if (
    typeof customerName !== 'string' ||
    !customerName.trim() ||
    customerName.trim().length > 120 ||
    typeof customerPhone !== 'string' ||
    customerPhone.length > 40 ||
    typeof customerNotes !== 'string' ||
    customerNotes.length > 1000 ||
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 50
  ) {
    return res.status(400).json({
      success: false,
      message: 'Data pemesan dan daftar produk wajib diisi dengan format yang valid',
    });
  }

  const seenProductIds = new Set();
  for (const item of items) {
    if (
      !item ||
      typeof item.productId !== 'string' ||
      !item.productId.trim() ||
      item.productId.length > 100 ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      seenProductIds.has(item.productId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Daftar produk atau jumlah pesanan tidak valid',
      });
    }
    seenProductIds.add(item.productId);
  }

  try {
    const order = db.createOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerNotes: customerNotes.trim(),
      items,
    });
    return res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dicatat',
      data: order,
    });
  } catch (error) {
    if (error.code === 'ORDER_PRODUCT_NOT_FOUND') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.code === 'ORDER_PRODUCT_UNAVAILABLE') {
      return res.status(409).json({ success: false, message: error.message });
    }
    if (error.code === 'ORDER_TOTAL_INVALID') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return next(error);
  }
});

router.get('/', authenticateToken, (req, res) => {
  res.json({ success: true, data: db.getOrders() });
});

router.patch('/:id/status', authenticateToken, (req, res) => {
  const status = req.body?.status;
  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: 'Status pesanan tidak valid' });
  }

  const order = db.updateOrderStatus(req.params.id, status);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
  }
  return res.json({
    success: true,
    message: 'Status pesanan berhasil diperbarui',
    data: order,
  });
});

router.delete('/:id', authenticateToken, (req, res) => {
  const deleted = db.deleteOrder(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
  }
  return res.json({ success: true, message: 'Riwayat pesanan berhasil dihapus' });
});

export default router;
