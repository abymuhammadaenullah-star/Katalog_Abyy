import { useEffect, useRef, useState } from 'react';
import { X, Upload, Image as ImageIcon, Save, AlertCircle } from 'lucide-react';
import { DEFAULT_PRODUCT_IMAGE, getProductImageUrl } from '../services/productImages';

export const ProductFormModal = ({ onClose, onSave, editingProduct, categories }) => {
  const [name, setName] = useState(editingProduct?.name || '');
  const [categoryId, setCategoryId] = useState(editingProduct?.categoryId || categories[0]?.id || '');
  const [price, setPrice] = useState(editingProduct?.price ? String(editingProduct.price) : '');
  const [stockQuantity, setStockQuantity] = useState(String(editingProduct?.stockQuantity ?? 0));
  const [stockStatus, setStockStatus] = useState(editingProduct?.stockStatus || 'Tersedia');
  const [description, setDescription] = useState(editingProduct?.description || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [previewSrc, setPreviewSrc] = useState(
    editingProduct ? getProductImageUrl(editingProduct) : DEFAULT_PRODUCT_IMAGE
  );
  const [previewError, setPreviewError] = useState('');
  const [removeImage, setRemoveImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => () => {
    if (previewSrc.startsWith('blob:')) URL.revokeObjectURL(previewSrc);
  }, [previewSrc]);

  // Handle file picker
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Ukuran gambar maksimal 5 MB.');
        e.target.value = '';
        return;
      }

      setErrorMsg('');
      setSelectedFile(file);
      setRemoveImage(false);
      setPreviewError('');
      setPreviewSrc(URL.createObjectURL(file));
    }
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setRemoveImage(true);
    setPreviewError('');
    setPreviewSrc(DEFAULT_PRODUCT_IMAGE);
  };

  const handlePreviewError = () => {
    setPreviewError('Gambar tidak dapat dimuat. Pilih gambar lain atau periksa file/path gambar.');
    if (previewSrc !== DEFAULT_PRODUCT_IMAGE) setPreviewSrc(DEFAULT_PRODUCT_IMAGE);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Nama produk wajib diisi.');
      return;
    }
    if (!categoryId) {
      setErrorMsg('Kategori produk wajib dipilih.');
      return;
    }
    if (!price || isNaN(price) || Number(price) <= 0) {
      setErrorMsg('Harga produk harus angka positif.');
      return;
    }
    if (!Number.isSafeInteger(Number(stockQuantity)) || Number(stockQuantity) < 0) {
      setErrorMsg('Jumlah stok harus bilangan bulat minimal 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('name', name.trim());
      payload.append('categoryId', categoryId);
      payload.append('price', price);
      payload.append('stockQuantity', stockQuantity);
      payload.append('stockStatus', stockStatus);
      payload.append('description', description.trim());
      payload.append('removeImage', removeImage ? 'true' : 'false');
      if (selectedFile) payload.append('photo', selectedFile);

      await onSave(payload, editingProduct?.id);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan produk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px' }}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">
              {editingProduct ? 'Edit Informasi Produk' : 'Tambah Produk Baru'}
            </h2>
            <p className="modal-subtitle">
              Lengkapi data produk untuk katalog BYY MOTORCYCLE
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} title="Tutup">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMsg && (
              <div className="form-alert-error animate-fade-in">
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Product Image Preview & Selector */}
            <div className="product-form-media-section">
              <div className="media-preview-box">
                <img
                  src={previewSrc || DEFAULT_PRODUCT_IMAGE}
                  alt={`Preview ${name || 'produk'}`}
                  className="media-preview-img"
                  onError={handlePreviewError}
                />
              </div>

              <div className="media-controls">
                {previewError && (
                  <div className="form-alert-error" role="status">
                    <AlertCircle size={16} />
                    <span>{previewError}</span>
                  </div>
                )}
                <div className="media-action-buttons">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm upload-file-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                  >
                    <Upload size={15} />
                    <span>{selectedFile || (previewSrc !== DEFAULT_PRODUCT_IMAGE && !removeImage) ? 'Ganti Foto Produk' : 'Upload Foto Produk'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  {(editingProduct && getProductImageUrl(editingProduct) !== DEFAULT_PRODUCT_IMAGE || selectedFile) && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleRemoveImage}>
                      <ImageIcon size={15} />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>
                <small className="media-help-text">Format JPG, PNG, WEBP, atau GIF. Maksimal 5 MB.</small>
              </div>
            </div>

            {/* Product Name */}
            <div className="form-group">
              <label className="form-label">
                <span>Nama Produk</span>
                <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="cth: Kampas Rem Racing"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Category & Price Row */}
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">
                  <span>Kategori</span>
                  <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Harga (Rp)</span>
                  <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="25000"
                  min="0"
                  step="500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="product-stock-quantity">Jumlah Stok (unit)</label>
                <input
                  id="product-stock-quantity"
                  type="number"
                  className="form-input"
                  min="0"
                  step="1"
                  value={stockQuantity}
                  onChange={(event) => setStockQuantity(event.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="product-stock-status">Status Ketersediaan</label>
                <select
                  id="product-stock-status"
                  className="form-select"
                  value={stockStatus}
                  onChange={(event) => setStockStatus(event.target.value)}
                  required
                >
                  <option value="Tersedia">Tersedia</option>
                  <option value="Habis">Habis</option>
                </select>
              </div>
            </div>
            <small className="media-help-text">
              Ubah jumlah dan status stok melalui formulir ini. Tabel produk hanya menampilkan jumlah stok.
            </small>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">
                <span>Deskripsi Produk</span>
              </label>
              <textarea
                rows="2"
                className="form-textarea"
                placeholder="Jelaskan kondisi, kompatibilitas, atau keunggulan produk ini..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              <Save size={16} />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};