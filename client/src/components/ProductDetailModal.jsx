import { useState } from 'react';
import { CheckCircle2, MessageCircle, PackageCheck, X, XCircle } from 'lucide-react';

const isAvailable = (product) =>
  (product.stockStatus || product.stokStatus) === 'Tersedia';

export const ProductDetailModal = ({ product, onClose, onOrder }) => {
  const [imageFailed, setImageFailed] = useState(false);
  if (!product) return null;

  const available = isAvailable(product);
  const formatRupiah = (number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(number) || 0);

  const imageIsValid =
    product.image && product.image !== '-' && product.image !== 'null' && !imageFailed;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="modal-content product-detail-modal animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="product-detail-close" type="button" onClick={onClose} aria-label="Tutup detail">
          <X size={20} />
        </button>
        <div className="product-detail-image">
          {imageIsValid ? (
            <img src={product.image} alt={product.name} onError={() => setImageFailed(true)} />
          ) : (
            <div className="product-image-placeholder"><PackageCheck size={52} /><span>BYY MOTORCYCLE</span></div>
          )}
        </div>
        <div className="product-detail-content">
          <span className="product-detail-category">{product.categoryName || 'Sparepart Motor'}</span>
          <h2 id="product-detail-title">{product.name}</h2>
          <span className={`detail-stock ${available ? 'available' : 'unavailable'}`}>
            {available ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {available ? 'Stok tersedia' : 'Stok sedang habis'}
          </span>
          <p className="product-detail-description">
            {product.description || 'Hubungi kami untuk informasi lebih lanjut mengenai produk ini.'}
          </p>
          <strong className="product-detail-price">{formatRupiah(product.price)}</strong>
          <div className="product-detail-actions">
            <button className="btn btn-secondary" type="button" onClick={onClose}>Kembali ke katalog</button>
            <button className="btn btn-wa" type="button" onClick={onOrder} disabled={!available}>
              <MessageCircle size={17} /> Pesan via WhatsApp
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
