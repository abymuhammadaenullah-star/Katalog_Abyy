import { useState } from 'react';
import { X, MessageCircle, AlertCircle, Send } from 'lucide-react';
import { DEFAULT_PRODUCT_IMAGE, getProductImageUrl } from '../services/productImages';
import { getProductStockQuantity } from '../services/productStock';

export const OrderModal = ({ product, storeSettings, onClose, onCreateOrder }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showError, setShowError] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!product) return null;

  const storeName = storeSettings?.storeName || 'Toko Berkah Nusantara';
  const storePhone = (storeSettings?.phone || '').replace(/[^0-9]/g, '');

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const totalPrice = (product.price || 0) * quantity;

  // Build formatted WhatsApp message
  const generateMessage = (orderId = '[Nomor Pesanan]', savedOrder = null) => {
    const nameStr = customerName.trim() || '[Nama Pemesan]';
    const notesStr = customerNotes.trim() ? customerNotes.trim() : '-';
    const savedItem = savedOrder?.items?.[0];

    return `Halo ${storeName}, saya ${nameStr} ingin memesan:
- No. Pesanan: ${orderId}
- Produk: ${savedItem?.productName || product.name}
- Jumlah: ${savedItem?.quantity || quantity} item
- Total: ${formatRupiah(savedOrder?.total ?? totalPrice)}
- No. HP: ${customerPhone.trim() || '-'}
- Catatan / Alamat: ${notesStr}

Mohon diproses ya, terima kasih!`;
  };

  // Handle WhatsApp submission with validation check
  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    // Decision: Is Form Complete?
    if (!customerName.trim()) {
      setShowError(true);
      if (!customerName.trim()) document.getElementById('customer-name-input')?.focus();
      return;
    }

    if (!storePhone) {
      setSubmissionError('Nomor WhatsApp toko belum diatur di dashboard.');
      return;
    }

    setShowError(false);
    setSubmissionError('');
    setIsSubmitting(true);
    const whatsappWindow = window.open('about:blank', '_blank');
    try {
      const response = await onCreateOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerNotes: customerNotes.trim(),
        items: [{ productId: product.id, quantity }],
      });
      const finalMessage = generateMessage(response.data.id, response.data);
      const encodedText = encodeURIComponent(finalMessage);
      const whatsappUrl = `https://wa.me/${storePhone}?text=${encodedText}`;
      if (whatsappWindow) {
        whatsappWindow.opener = null;
        whatsappWindow.location.href = whatsappUrl;
      } else {
        window.location.assign(whatsappUrl);
      }
      onClose();
    } catch (error) {
      whatsappWindow?.close();
      setSubmissionError(error.message || 'Gagal menyimpan pesanan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">Pesan via WhatsApp</h2>
            <p className="modal-subtitle">Pesan langsung ke WhatsApp {storeName}</p>
          </div>
          <button className="btn-icon" onClick={onClose} title="Tutup">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmitOrder}>
          <div className="modal-body">
            {/* Selected Product Summary Box */}
            <div className="order-product-summary">
              <img
                src={getProductImageUrl(product)}
                alt={product.name}
                className="summary-img"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                }}
              />
              <div className="summary-details">
                <span className="summary-category">{product.categoryName}</span>
                <h4 className="summary-name">{product.name}</h4>
                <div className="summary-price-row">
                  <span className="summary-unit-price">{formatRupiah(product.price)} / item</span>
                  <div className="quantity-control">
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </button>
                    <span className="qty-number">{quantity}</span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <small className="order-stock-note">
                  Jumlah stok tercatat: {getProductStockQuantity(product)} unit
                </small>
              </div>
            </div>

            {/* Total Price Banner */}
            <div className="order-total-bar">
              <span>Total Perkiraan:</span>
              <span className="total-amount">{formatRupiah(totalPrice)}</span>
            </div>

            {/* Validation Error Alert if Name missing */}
            {showError && (
              <div className="form-alert-error animate-fade-in" id="name-validation-alert">
                <AlertCircle size={18} />
                <span>Nama pemesan wajib diisi untuk memesan via WhatsApp.</span>
              </div>
            )}
            {submissionError && (
              <div className="form-alert-error animate-fade-in" role="alert" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={18} />
                <span>{submissionError}</span>
              </div>
            )}

            {/* Input: Customer Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="customer-name-input">
                <span>Nama Lengkap Anda</span>
                <span className="text-danger">*</span>
              </label>
              <input
                id="customer-name-input"
                type="text"
                className={`form-input ${showError && !customerName.trim() ? 'error' : ''}`}
                placeholder="Contoh: Budi Pratama"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (e.target.value.trim()) setShowError(false);
                }}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="customer-phone-input">Nomor HP / WhatsApp (opsional)</label>
              <input
                id="customer-phone-input"
                type="tel"
                className="form-input"
                placeholder="Nomor yang bisa dihubungi"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            {/* Input: Notes / Delivery Address */}
            <div className="form-group">
              <label className="form-label" htmlFor="customer-notes-input">
                <span>Catatan Khusus / Alamat Pengiriman</span>
                <span className="text-muted" style={{ fontWeight: 400 }}>(Opsional)</span>
              </label>
              <textarea
                id="customer-notes-input"
                rows="2"
                className="form-textarea"
                placeholder="Contoh: tipe motor, alamat pengiriman, atau catatan lainnya"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
              />
            </div>

            {/* Live WhatsApp Message Preview Bubble */}
            <div className="wa-preview-box">
              <div className="wa-preview-header">
                <MessageCircle size={16} />
                <span>PREVIEW PESAN WHATSAPP OTOMATIS:</span>
              </div>
              <div className="wa-bubble">
                {generateMessage()}
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-wa"
              id="submit-wa-order-btn"
              disabled={isSubmitting}
            >
              <Send size={16} />
              <span>{isSubmitting ? 'Menyimpan pesanan...' : 'Kirim Pesanan ke WhatsApp'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};