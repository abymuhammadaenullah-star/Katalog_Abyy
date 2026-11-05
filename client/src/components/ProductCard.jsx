import { useState } from 'react';
import { CheckCircle2, Eye, MessageCircle, PackageCheck, XCircle } from 'lucide-react';

const isAvailable = (product) =>
  (product.stockStatus || product.stokStatus) === 'Tersedia';

export const ProductCard = ({
  product,
  onSelectProduct,
  onViewDetails,
  featured = false,
  isNew = false,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const available = isAvailable(product);
  const hasProductImage =
    product.image && product.image !== '-' && product.image !== 'null' && !imageFailed;

  const formatRupiah = (number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(number) || 0);

  return (
    <article className={`product-card ${!available ? 'out-of-stock' : ''}`} id={`product-${product.id}`}>
      <div className="product-image-box">
        {hasProductImage ? (
          <img
            src={product.image}
            alt={product.name}
            className="product-img"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="product-image-placeholder" aria-label={`Foto ${product.name} belum tersedia`}>
            <PackageCheck size={42} strokeWidth={1.4} />
            <span>BYY MOTORCYCLE</span>
          </div>
        )}
        {(featured || isNew) && (
          <div className="product-badges">
            {featured && !isNew && <span className="product-feature-tag">BYY PICK</span>}
            {isNew && <span className="product-new-tag">NEW ARRIVAL</span>}
          </div>
        )}
        <span className="product-cat-tag">{product.categoryName || 'Sparepart Motor'}</span>
        <span className={`product-stock-tag ${available ? 'available' : 'unavailable'}`}>
          {available ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          <span>{available ? 'Tersedia' : 'Stok Habis'}</span>
        </span>
      </div>
      <div className="product-content">
        <h3 className="product-title" title={product.name}>{product.name}</h3>
        <p className="product-desc">{product.description || 'Sparepart pilihan dari BYY Motorcycle Racing.'}</p>
        <div className="product-price-group">
          <span className="price-label">Harga</span>
          <span className="product-price">{formatRupiah(product.price)}</span>
        </div>
        <div className="product-actions">
          <button
            className="btn btn-detail"
            type="button"
            onClick={() => onViewDetails(product)}
            aria-label={`Detail produk ${product.name}`}
          >
            <Eye size={16} /><span>Detail</span>
          </button>
          <button
            className="btn btn-wa order-btn"
            disabled={!available}
            type="button"
            onClick={() => onSelectProduct(product)}
            id={`btn-order-${product.id}`}
            title={available ? 'Pesan produk ini via WhatsApp' : 'Produk sedang habis'}
          >
            <MessageCircle size={16} /><span>Pesan</span>
          </button>
        </div>
      </div>
    </article>
  );
};
