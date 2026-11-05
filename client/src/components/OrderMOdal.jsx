import { useState } from 'react';
import { X, MessageCircle, AlertCircle, Send } from 'lucide-react';

export const OrderModal = ({ product, storeSettings, onClose }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showError, setShowError] = useState(false);

  if (!product) return null;

  const storeName = storeSettings?.storeName || 'Toko Berkah Nusantara';
  const storePhone = (storeSettings?.phone || '6281234567890').replace(/[^0-9]/g, '');

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const totalPrice = (product.price || 0) * quantity;

  // Build formatted WhatsApp message
  const generateMessage = () => {
    const nameStr = customerName.trim() || '[Nama Pemesan]';
    const notesStr = customerNotes.trim() ? customerNotes.trim() : '-';

    return `Halo ${storeName}, saya ${nameStr} ingin memesan:
- Produk: ${product.name}
- Jumlah: ${quantity} item
- Total: ${formatRupiah(totalPrice)}
- Catatan / Alamat: ${notesStr}

Mohon diproses ya, terima kasih!`;
  };

  // Handle WhatsApp submission with validation check
  const handleSubmitOrder = (e) => {
    e.preventDefault();

    // Decision: Is Form Complete?
    if (!customerName.trim()) {
      setShowError(true);
      const input = document.getElementById('customer-name-input');
      if (input) input.focus();
      return;
    }

    setShowError(false);

    // Final clean message for redirect
    const finalMessage = generateMessage();
    const encodedText = encodeURIComponent(finalMessage);
    const waUrl = `https://wa.me/${storePhone}?text=${encodedText}`;

    // System Action: Redirect user directly to wa.me URL with pre-filled text
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    onClose();
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
                src={product.image}
                alt={product.name}
                className="summary-img"
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
            >
              <Send size={16} />
              <span>Kirim Pesanan ke WhatsApp</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};