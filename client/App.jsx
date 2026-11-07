import React from 'react';
import { MessageCircle, CheckCircle2, AlertTriangle, XCircle, Eye, ShieldCheck, Package } from 'lucide-react';
import { getImageUrl, SERVER_URL } from '../services/api';

export const ProductCard = ({ product, onSelectProduct, onViewDetail }) => {
    const stock = Number(product.stock !== undefined ? product.stock : (product.stockStatus === 'Habis' ? 0 : 10));

    // Status otomatis:
    // stock > 5 → "Tersedia"
    // stock 1 - 5 → "Stok Terbatas"
    // stock === 0 → "Habis"
    let statusText = 'Tersedia';
    let statusClass = 'available';
    if (stock === 0) {
        statusText = 'Habis';
        statusClass = 'unavailable';
    } else if (stock <= 5) {
        statusText = 'Stok Terbatas';
        statusClass = 'limited';
    }

    const isAvailable = stock > 0;

    // Format Indonesian Rupiah
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };

    const fallbackImage = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80';
    const displayImage = getImageUrl(product.image) || fallbackImage;

    return (
        <div className={`product-card ${!isAvailable ? 'out-of-stock' : ''}`} id={`product-${product.id}`}>
            {/* Product Image Box */}
            <div className="product-image-box" onClick={() => onViewDetail && onViewDetail(product)} style={{ cursor: 'pointer' }}>
                <img
                    src={displayImage}
                    alt={product.name}
                    className="product-img"
                    loading="lazy"
                    onError={(e) => {
                        // Jika akses via SERVER_URL gagal, coba relative path /uploads/... (lewat Nginx proxy)
                        if (!e.target.dataset.triedRelative && product.image && product.image.includes('product-')) {
                            e.target.dataset.triedRelative = 'true';
                            const filename = product.image.split('/').pop().trim();
                            e.target.src = `/uploads/${filename}`;
                            return;
                        }
                        // Jika akses via relative gagal, coba SERVER_URL langsung
                        if (!e.target.dataset.triedServer && product.image && product.image.includes('product-')) {
                            e.target.dataset.triedServer = 'true';
                            const filename = product.image.split('/').pop().trim();
                            const base = SERVER_URL.replace(/\/+$/, '');
                            e.target.src = `${base}/uploads/${filename}`;
                            return;
                        }
                        e.target.onerror = null;
                        e.target.src = fallbackImage;
                    }}
                />

                {/* Category Pill Tag */}
                <span className="product-cat-tag">
                    {product.categoryName || 'Obat / Farmasi'}
                </span>

                {/* BPOM Pill */}
                <span className="product-bpom-badge" title="Tervalidasi BPOM RI">
                    <ShieldCheck size={11} />
                    <span>BPOM</span>
                </span>

                {/* Stock Status Badge */}
                <span className={`product-stock-tag ${statusClass}`}>
                    {stock > 5 ? (
                        <>
                            <CheckCircle2 size={12} />
                            <span>Tersedia</span>
                        </>
                    ) : stock > 0 ? (
                        <>
                            <AlertTriangle size={12} />
                            <span>Stok Terbatas</span>
                        </>
                    ) : (
                        <>
                            <XCircle size={12} />
                            <span>Habis</span>
                        </>
                    )}
                </span>
            </div>

            {/* Product Details */}
            <div className="product-content">
                <div className="product-header-group">
                    <h3
                        className="product-title"
                        title={product.name}
                        onClick={() => onViewDetail && onViewDetail(product)}
                        style={{ cursor: 'pointer' }}
                    >
                        {product.name}
                    </h3>

                    {/* Badge / Label Jumlah Stok Pcs */}
                    <div className="product-stock-count-indicator">
                        <span className={`stock-dot stock-dot-${statusClass}`}></span>
                        <span className="stock-count-text">
                            <strong>Stok:</strong> {stock} pcs {stock === 0 && <span className="stock-zero-tag">(Habis)</span>}
                        </span>
                    </div>

                    <p className="product-desc">
                        {product.description || 'Sediaan farmasi resmi berstandar apotek. Konsultasikan penggunaan dengan apoteker kami.'}
                    </p>
                </div>

                {/* Price & Action Row */}
                <div className="product-bottom-row">
                    <div className="product-price-group">
                        <span className="price-label">Harga Resmi</span>
                        <span className="product-price">{formatRupiah(product.price)}</span>
                    </div>

                    <div className="product-actions-group">
                        {onViewDetail && (
                            <button
                                type="button"
                                className="btn btn-secondary-subtle btn-sm"
                                onClick={() => onViewDetail(product)}
                                title="Lihat detail & indikasi"
                            >
                                <Eye size={15} />
                                <span>Detail</span>
                            </button>
                        )}

                        <button
                            type="button"
                            className="btn btn-wa order-btn"
                            disabled={!isAvailable}
                            onClick={() => onSelectProduct(product)}
                            id={`btn-order-${product.id}`}
                            title={isAvailable ? 'Pesan produk ini (Diantar ke Alamat)' : 'Stok habis - pemesanan dinonaktifkan'}
                        >
                            <MessageCircle size={16} />
                            <span>{isAvailable ? 'Pesan' : 'Habis'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};