import { useState } from 'react';
import { Minus, Plus, Send, ShoppingCart, Trash2, X } from 'lucide-react';
import { DEFAULT_PRODUCT_IMAGE, getProductImageUrl } from '../services/productImages';
import { getProductStockQuantity } from '../services/productStock';

const isProductAvailable = (product) =>
  (product.stockStatus || product.stokStatus) === 'Tersedia';

const formatRupiah = (number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(number) || 0);

export const CartModal = ({
  items,
  storeSettings,
  onClose,
  onQuantityChange,
  onRemoveItem,
  onCreateOrder,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [showError, setShowError] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPrice = items.reduce(
    (total, item) => total + (Number(item.product.price) || 0) * item.quantity,
    0
  );
  const hasUnavailableProducts = items.some(
    (item) => !isProductAvailable(item.product)
  );

  const handleCheckout = async (event) => {
    event.preventDefault();
    if (!customerName.trim() || hasUnavailableProducts || items.length === 0) {
      setShowError(true);
      if (!customerName.trim()) document.getElementById('cart-customer-name')?.focus();
      return;
    }

    const storeName = storeSettings?.storeName || 'BYY MOTORCYCLE';
    const storePhone = (storeSettings?.phone || '').replace(/\D/g, '');
    if (!storePhone) {
      setShowError(true);
      setSubmissionError('Nomor WhatsApp toko belum diatur di dashboard.');
      return;
    }

    setSubmissionError('');
    setIsSubmitting(true);
    const whatsappWindow = window.open('about:blank', '_blank');
    try {
      const response = await onCreateOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerNotes: customerNotes.trim(),
        items: items.map(({ product, quantity }) => ({
          productId: product.id,
          quantity,
        })),
      });
      const orderLines = response.data.items
        .map((item) =>
          `- ${item.productName} x${item.quantity} = ${formatRupiah(item.lineTotal)}`
        )
        .join('\n');
      const message = `Halo ${storeName}, saya ${customerName.trim()} ingin memesan:\nNo. Pesanan: ${response.data.id}\n${orderLines}\n\nTotal: ${formatRupiah(response.data.total)}\nNo. HP: ${customerPhone.trim() || '-'}\nCatatan / Alamat: ${customerNotes.trim() || '-'}\n\nMohon diproses, terima kasih!`;
      const whatsappUrl = `https://wa.me/${storePhone}?text=${encodeURIComponent(message)}`;
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
      <section
        className="modal-content cart-modal animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title" id="cart-modal-title">Keranjang Belanja</h2>
            <p className="modal-subtitle">{items.length} jenis produk</p>
          </div>
          <button className="btn-icon" type="button" onClick={onClose} aria-label="Tutup keranjang">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleCheckout}>
          <div className="modal-body">
            {items.length === 0 ? (
              <div className="cart-empty-state">
                <ShoppingCart size={32} />
                <p>Keranjang masih kosong. Tambahkan produk dari katalog.</p>
              </div>
            ) : (
              <div className="cart-items-list">
                {items.map(({ product, quantity }) => {
                  const stockQuantity = getProductStockQuantity(product);
                  const available = isProductAvailable(product);
                  return (
                    <article className="cart-line-item" key={product.id}>
                      <img
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                        }}
                      />
                      <div className="cart-line-info">
                        <strong>{product.name}</strong>
                        <span>{formatRupiah(product.price)} / unit</span>
                        <span className="cart-line-stock">
                          Jumlah stok: {stockQuantity} unit · {available ? 'Tersedia' : 'Habis'}
                        </span>
                        <div className="cart-line-controls">
                          <div className="quantity-control">
                            <button
                              className="qty-btn"
                              type="button"
                              aria-label={`Kurangi ${product.name}`}
                              onClick={() => onQuantityChange(product.id, quantity - 1)}
                            >
                              <Minus size={13} />
                            </button>
                            <span className="qty-number">{quantity}</span>
                            <button
                              className="qty-btn"
                              type="button"
                              aria-label={`Tambah ${product.name}`}
                              onClick={() => onQuantityChange(product.id, quantity + 1)}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <button
                            className="btn-icon btn-icon-danger"
                            type="button"
                            aria-label={`Hapus ${product.name} dari keranjang`}
                            onClick={() => onRemoveItem(product.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <strong className="cart-line-total">
                        {formatRupiah((Number(product.price) || 0) * quantity)}
                      </strong>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="cart-total-row">
              <span>Total belanja</span>
              <strong>{formatRupiah(totalPrice)}</strong>
            </div>

            {(hasUnavailableProducts || (showError && !customerName.trim())) && (
              <p className="cart-error-message" role="alert">
                {hasUnavailableProducts
                  ? 'Ada produk yang berstatus habis. Hapus produk tersebut untuk melanjutkan.'
                  : 'Nama pemesan wajib diisi.'}
              </p>
            )}
            {submissionError && <p className="cart-error-message" role="alert">{submissionError}</p>}

            <div className="form-group">
              <label className="form-label" htmlFor="cart-customer-name">Nama pemesan *</label>
              <input
                id="cart-customer-name"
                className="form-input"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Nama lengkap"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cart-customer-phone">Nomor HP / WhatsApp</label>
              <input
                id="cart-customer-phone"
                className="form-input"
                type="tel"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="Nomor yang bisa dihubungi (opsional)"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cart-customer-notes">Catatan / alamat</label>
              <textarea
                id="cart-customer-notes"
                className="form-textarea"
                rows="2"
                value={customerNotes}
                onChange={(event) => setCustomerNotes(event.target.value)}
                placeholder="Alamat pengiriman atau catatan pesanan"
              />
            </div>
          </div>

          <footer className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Lanjut belanja</button>
            <button
              type="submit"
              className="btn btn-wa"
              disabled={items.length === 0 || hasUnavailableProducts || isSubmitting}
            >
              <Send size={16} /> {isSubmitting ? 'Menyimpan pesanan...' : 'Pesan via WhatsApp'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};
