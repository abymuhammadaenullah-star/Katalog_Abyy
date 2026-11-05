import { useState } from 'react';
import { X, Upload, Image as ImageIcon, Save, AlertCircle } from 'lucide-react';

const PRESET_FOOD_IMAGES = [
  { label: 'Nasi Goreng', url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80' },
  { label: 'Ayam Bakar', url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80' },
  { label: 'Kopi Susu', url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80' },
  { label: 'Matcha Frappe', url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80' },
  { label: 'Pisang Keju', url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80' },
  { label: 'Dimsum Mentai', url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80' }
];

export const ProductFormModal = ({ onClose, onSave, editingProduct, categories }) => {
  const initialImage = editingProduct?.image || PRESET_FOOD_IMAGES[0].url;
  const [name, setName] = useState(editingProduct?.name || '');
  const [categoryId, setCategoryId] = useState(editingProduct?.categoryId || categories[0]?.id || '');
  const [price, setPrice] = useState(editingProduct?.price ? String(editingProduct.price) : '');
  const [stockStatus, setStockStatus] = useState(editingProduct?.stockStatus || 'Tersedia');
  const [description, setDescription] = useState(editingProduct?.description || '');
  const [imageUrl, setImageUrl] = useState(initialImage);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(initialImage);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle file picker
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewSrc(objectUrl);
    }
  };

  // Handle preset image click
  const handleSelectPreset = (url) => {
    setSelectedFile(null);
    setImageUrl(url);
    setPreviewSrc(url);
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

    setIsSubmitting(true);
    try {
      let payload;
      if (selectedFile) {
        payload = new FormData();
        payload.append('name', name.trim());
        payload.append('categoryId', categoryId);
        payload.append('price', price);
        payload.append('stockStatus', stockStatus);
        payload.append('description', description.trim());
        payload.append('photo', selectedFile);
      } else {
        payload = {
          name: name.trim(),
          categoryId,
          price: Number(price),
          stockStatus,
          description: description.trim(),
          imageUrl: previewSrc || imageUrl
        };
      }

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
              Lengkapi data produk untuk katalog KatalogWA
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
                {previewSrc ? (
                  <img src={previewSrc} alt="Preview" className="media-preview-img" />
                ) : (
                  <div className="media-placeholder">
                    <ImageIcon size={32} />
                    <span>Belum ada foto</span>
                  </div>
                )}
              </div>

              <div className="media-controls">
                <label className="btn btn-secondary btn-sm upload-file-btn">
                  <Upload size={15} />
                  <span>Upload Foto dari Perangkat</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>

                <div className="preset-images-row">
                  <span className="preset-label">Atau pilih sampel cepat:</span>
                  <div className="preset-thumbs">
                    {PRESET_FOOD_IMAGES.map((preset, idx) => (
                      <button
                        type="button"
                        key={idx}
                        className={`preset-thumb-btn ${previewSrc === preset.url ? 'active' : ''}`}
                        onClick={() => handleSelectPreset(preset.url)}
                        title={preset.label}
                      >
                        <img src={preset.url} alt={preset.label} />
                      </button>
                    ))}
                  </div>
                </div>
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
                placeholder="cth: Nasi Goreng Spesial"
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

            {/* Stock Status Selector */}
            <div className="form-group">
              <label className="form-label">
                <span>Status Stok</span>
              </label>
              <div className="stock-radio-group">
                <label className={`stock-radio-card ${stockStatus === 'Tersedia' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="stockStatus"
                    value="Tersedia"
                    checked={stockStatus === 'Tersedia'}
                    onChange={() => setStockStatus('Tersedia')}
                  />
                  <div>
                    <strong>Tersedia</strong>
                    <p>Produk dapat dipesan pelanggan via WhatsApp</p>
                  </div>
                </label>

                <label className={`stock-radio-card ${stockStatus === 'Habis' ? 'selected-out' : ''}`}>
                  <input
                    type="radio"
                    name="stockStatus"
                    value="Habis"
                    checked={stockStatus === 'Habis'}
                    onChange={() => setStockStatus('Habis')}
                  />
                  <div>
                    <strong>Habis</strong>
                    <p>Tombol pemesanan dinonaktifkan di katalog</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">
                <span>Deskripsi Menu</span>
              </label>
              <textarea
                rows="2"
                className="form-textarea"
                placeholder="Jelaskan bumbu, bahan, porsi, atau keunikan rasa menu ini..."
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