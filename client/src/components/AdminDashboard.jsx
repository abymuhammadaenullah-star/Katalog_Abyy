import { useState } from 'react';
import {
  Package,
  Layers,
  Settings,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  PhoneCall,
  Save,
  AlertCircle,
  Check,
  Store,
  LogOut,
  ShoppingBag,
  Database,
  Menu,
  X,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { ProductFormModal } from './ProductFormModal';
import { ConfirmModal } from './ConfirmModal';
import {
  createProduct,
  updateProduct,
  toggleProductStock,
  deleteProduct,
  createCategory,
  updateCategory,
  deleteCategory,
  updateStoreSettings
} from '../services/api';

export const AdminDashboard = ({
  products,
  categories,
  storeSettings,
  adminUser,
  onRefreshData,
  onBackToCatalog,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories' | 'settings'
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  // Product states
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Category states
  const [newCatName, setNewCatName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [catError, setCatError] = useState('');

  // Settings states
  const [settingsForm, setSettingsForm] = useState({
    storeName: storeSettings?.storeName || '',
    tagline: storeSettings?.tagline || '',
    phone: storeSettings?.phone || '',
    address: storeSettings?.address || ''
  });
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Currency Formatter
  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // Filter products for admin table
  const filteredProducts = products.filter((p) => {
    const matchesCat = !productCategoryFilter || p.categoryId === productCategoryFilter;
    const matchesSearch = !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.categoryName?.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Stock counts
  const totalCount = products.length;
  const availableCount = products.filter((p) => p.stockStatus === 'Tersedia').length;
  const outCount = totalCount - availableCount;

  // --- Handlers: Product Management ---
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (payload, id) => {
    if (id) {
      await updateProduct(id, payload);
    } else {
      await createProduct(payload);
    }
    await onRefreshData();
  };

  const handleToggleStock = async (id) => {
    try {
      await toggleProductStock(id);
      await onRefreshData();
    } catch (err) {
      alert(`Gagal mengubah stok: ${err.message}`);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      await deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
      await onRefreshData();
    } catch (err) {
      alert(`Gagal menghapus produk: ${err.message}`);
    }
  };

  // --- Handlers: Category Management ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    setCatError('');
    if (!newCatName.trim()) return;

    try {
      await createCategory(newCatName.trim());
      setNewCatName('');
      await onRefreshData();
    } catch (err) {
      setCatError(err.message);
    }
  };

  const handleStartEditCategory = (cat) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setCatError('');
  };

  const handleSaveEditCategory = async (id) => {
    if (!editCatName.trim()) return;
    try {
      await updateCategory(id, editCatName.trim());
      setEditingCategory(null);
      await onRefreshData();
    } catch (err) {
      setCatError(err.message);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategory(deletingCategory.id);
      setDeletingCategory(null);
      await onRefreshData();
    } catch (err) {
      alert(err.message);
      setDeletingCategory(null);
    }
  };

  // --- Handlers: Store Settings ---
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await updateStoreSettings(settingsForm);
      setSettingsSuccess(true);
      await onRefreshData();
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      alert(`Gagal menyimpan pengaturan: ${err.message}`);
    }
  };

  return (
    <div className="admin-sidebar-layout animate-fade-in">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpenMobile && (
        <div
          className="sidebar-backdrop-mobile"
          onClick={() => setIsSidebarOpenMobile(false)}
        />
      )}

      {/* ===========================================================
          ADMIN SIDEBAR NAVIGATION
         =========================================================== */}
      <aside className={`admin-sidebar ${isSidebarOpenMobile ? 'open' : ''}`}>
        {/* Sidebar Header / Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <ShoppingBag size={22} color="#ffffff" />
          </div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-title">KatalogWA</div>
            <div className="sidebar-brand-badge">Admin Back-Office</div>
          </div>
          <button
            className="sidebar-close-mobile"
            onClick={() => setIsSidebarOpenMobile(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Database Status Indicator */}
        <div className="sidebar-db-badge">
          <Database size={13} className="text-emerald" />
          <span>Database: <strong>SQLite (SQL)</strong></span>
          <span className="db-live-dot"></span>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">Menu Utama</div>

          <button
            className={`sidebar-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('products');
              setIsSidebarOpenMobile(false);
            }}
            id="sidebar-link-products"
          >
            <Package size={18} />
            <span className="nav-item-label">Manajemen Produk</span>
            <span className="nav-badge-count">{totalCount}</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('categories');
              setIsSidebarOpenMobile(false);
            }}
            id="sidebar-link-categories"
          >
            <Layers size={18} />
            <span className="nav-item-label">Manajemen Kategori</span>
            <span className="nav-badge-count">{categories.length}</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('settings');
              setIsSidebarOpenMobile(false);
            }}
            id="sidebar-link-settings"
          >
            <Settings size={18} />
            <span className="nav-item-label">Pengaturan Toko & WA</span>
          </button>

          <div className="nav-section-title" style={{ marginTop: '1.25rem' }}>Akses Cepat</div>

          <button
            className="sidebar-nav-item nav-item-ghost"
            onClick={onBackToCatalog}
            id="sidebar-link-view-catalog"
          >
            <Store size={18} />
            <span className="nav-item-label">Lihat Katalog Pelanggan</span>
            <ChevronRight size={14} className="nav-arrow" />
          </button>
        </nav>

        {/* Sidebar Footer User Info & Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="user-avatar">
              <ShieldCheck size={18} color="#10b981" />
            </div>
            <div className="user-info">
              <strong className="user-name">{adminUser?.name || 'Store Owner'}</strong>
              <span className="user-email">{adminUser?.email || 'admin@katalogwa.com'}</span>
            </div>
          </div>

          <button
            className="sidebar-logout-btn"
            onClick={onLogout}
            id="sidebar-logout-btn"
            title="Keluar dari sesi admin"
          >
            <LogOut size={16} />
            <span>Logout Sesi</span>
          </button>
        </div>
      </aside>

      {/* ===========================================================
          MAIN VIEWPORT CONTENT
         =========================================================== */}
      <div className="admin-main-viewport">
        {/* Top Navbar */}
        <header className="viewport-top-bar">
          <div className="top-bar-left">
            <button
              className="mobile-hamburger-btn"
              onClick={() => setIsSidebarOpenMobile(true)}
              title="Buka menu navigasi"
            >
              <Menu size={22} />
            </button>
            <div>
              <h2 className="viewport-title">
                {activeTab === 'products' && 'Manajemen Produk Katalog'}
                {activeTab === 'categories' && 'Manajemen Kategori'}
                {activeTab === 'settings' && 'Pengaturan Toko & Nomor WhatsApp'}
              </h2>
              <span className="viewport-breadcrumb">
                Admin Panel / {activeTab === 'products' ? 'Produk' : activeTab === 'categories' ? 'Kategori' : 'Pengaturan'}
              </span>
            </div>
          </div>

          <div className="top-bar-right">
            <button className="btn btn-secondary btn-sm" onClick={onBackToCatalog}>
              <Store size={15} />
              <span>Katalog Publik</span>
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="viewport-content-container">
          {/* Metrics Summary Strip */}
          <div className="metrics-grid" style={{ marginBottom: '1.75rem' }}>
            <div className="metric-card">
              <div className="metric-icon-box bg-emerald">
                <Package size={22} color="#059669" />
              </div>
              <div>
                <span className="metric-label">Total Produk</span>
                <h3 className="metric-value">{totalCount}</h3>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box bg-green">
                <CheckCircle size={22} color="#10b981" />
              </div>
              <div>
                <span className="metric-label">Produk Tersedia</span>
                <h3 className="metric-value text-emerald">{availableCount}</h3>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box bg-red">
                <XCircle size={22} color="#ef4444" />
              </div>
              <div>
                <span className="metric-label">Stok Habis</span>
                <h3 className="metric-value text-danger">{outCount}</h3>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box bg-slate">
                <Layers size={22} color="#475569" />
              </div>
              <div>
                <span className="metric-label">Total Kategori</span>
                <h3 className="metric-value">{categories.length}</h3>
              </div>
            </div>
          </div>

          {/* ===========================================================
              MODULE 1: PRODUCT MANAGEMENT
             =========================================================== */}
          {activeTab === 'products' && (
            <div className="admin-tab-content animate-fade-in">
              <div className="table-controls-bar">
                <div className="table-search-group">
                  <div className="search-input-wrapper" style={{ width: '280px' }}>
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Cari nama produk..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>

                  <select
                    className="form-select filter-select"
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleOpenAddProduct}
                  id="btn-add-product"
                >
                  <Plus size={18} />
                  <span>+ Tambah Produk</span>
                </button>
              </div>

              {/* Products Table */}
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Foto</th>
                      <th>Nama & Deskripsi</th>
                      <th>Kategori</th>
                      <th>Harga</th>
                      <th style={{ textAlign: 'center' }}>Status Stok (Saklar)</th>
                      <th style={{ textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="table-empty-cell">
                          Tidak ada produk yang cocok dengan pencarian / filter SQL.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((prod) => {
                        const isAvailable = prod.stockStatus === 'Tersedia';
                        return (
                          <tr key={prod.id} className={!isAvailable ? 'row-out-of-stock' : ''}>
                            {/* Image */}
                            <td style={{ width: '64px' }}>
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="table-product-thumb"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                                }}
                              />
                            </td>

                            {/* Name & Desc */}
                            <td>
                              <strong className="table-product-name">{prod.name}</strong>
                              {prod.description && (
                                <p className="table-product-desc">{prod.description}</p>
                              )}
                            </td>

                            {/* Category */}
                            <td>
                              <span className="badge badge-category">
                                {prod.categoryName}
                              </span>
                            </td>

                            {/* Price */}
                            <td>
                              <strong className="table-product-price">
                                {formatRupiah(prod.price)}
                              </strong>
                            </td>

                            {/* Toggle Stock Switch */}
                            <td style={{ textAlign: 'center' }}>
                              <div className="stock-toggle-cell">
                                <label className="switch" title="Ubah status ketersediaan stok di SQL database">
                                  <input
                                    type="checkbox"
                                    checked={isAvailable}
                                    onChange={() => handleToggleStock(prod.id)}
                                  />
                                  <span className="slider"></span>
                                </label>
                                <span className={`stock-text-status ${isAvailable ? 'text-emerald' : 'text-danger'}`}>
                                  {prod.stockStatus}
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td style={{ textAlign: 'right' }}>
                              <div className="table-actions-group">
                                <button
                                  className="btn-icon"
                                  onClick={() => handleOpenEditProduct(prod)}
                                  title="Edit Produk"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  className="btn-icon btn-icon-danger"
                                  onClick={() => setDeletingProduct(prod)}
                                  title="Hapus Produk"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===========================================================
              MODULE 2: CATEGORY MANAGEMENT
             =========================================================== */}
          {activeTab === 'categories' && (
            <div className="admin-tab-content animate-fade-in">
              <div className="category-manager-grid">
                {/* Form Add Category */}
                <div className="card-box">
                  <h3 className="box-title">Tambah Kategori Baru</h3>
                  <p className="box-subtitle">
                    Kategori tersimpan di tabel SQL <code>categories</code> dan tampil sebagai tombol filter pill di katalog pelanggan.
                  </p>

                  {catError && (
                    <div className="form-alert-error" style={{ marginBottom: '1rem' }}>
                      <AlertCircle size={16} />
                      <span>{catError}</span>
                    </div>
                  )}

                  <form onSubmit={handleAddCategory}>
                    <div className="form-group">
                      <label className="form-label">Nama Kategori</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="cth: Paket Hemat, Minuman Boba..."
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                      <Plus size={16} />
                      <span>Tambah Kategori ke Database SQL</span>
                    </button>
                  </form>
                </div>

                {/* List of Categories */}
                <div className="card-box">
                  <h3 className="box-title">Daftar Kategori ({categories.length})</h3>
                  <div className="category-items-list">
                    {categories.map((cat) => (
                      <div key={cat.id} className="category-item-row">
                        {editingCategory?.id === cat.id ? (
                          <div className="category-inline-edit">
                            <input
                              type="text"
                              className="form-input"
                              value={editCatName}
                              onChange={(e) => setEditCatName(e.target.value)}
                              autoFocus
                            />
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleSaveEditCategory(cat.id)}
                            >
                              <Save size={14} />
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setEditingCategory(null)}
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="cat-name-info">
                              <strong>{cat.name}</strong>
                              <span className="badge badge-category" style={{ fontSize: '0.75rem' }}>
                                {cat.productCount || 0} Produk Terdaftar
                              </span>
                            </div>

                            <div className="cat-actions">
                              <button
                                className="btn-icon"
                                onClick={() => handleStartEditCategory(cat)}
                                title="Ubah Nama"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                className="btn-icon btn-icon-danger"
                                onClick={() => setDeletingCategory(cat)}
                                title="Hapus Kategori"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===========================================================
              MODULE 3: STORE SETTINGS
             =========================================================== */}
          {activeTab === 'settings' && (
            <div className="admin-tab-content animate-fade-in">
              <div className="card-box" style={{ maxWidth: '640px' }}>
                <h3 className="box-title">Pengaturan Profil & WhatsApp Toko</h3>
                <p className="box-subtitle">
                  Konfigurasi disimpan di tabel SQL <code>settings</code>. Digunakan untuk redirect WhatsApp pesanan pelanggan.
                </p>

                {settingsSuccess && (
                  <div className="form-alert-success animate-fade-in" style={{ marginBottom: '1rem' }}>
                    <Check size={18} />
                    <span>Pengaturan toko berhasil diperbarui ke database SQL!</span>
                  </div>
                )}

                <form onSubmit={handleSaveSettings}>
                  <div className="form-group">
                    <label className="form-label">Nama Bisnis / Toko</label>
                    <input
                      type="text"
                      className="form-input"
                      value={settingsForm.storeName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tagline Toko</label>
                    <input
                      type="text"
                      className="form-input"
                      value={settingsForm.tagline}
                      onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <PhoneCall size={15} />
                      <span>Nomor WhatsApp Tujuan (Gunakan kode negara, cth: 6281234567890)</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="6281234567890"
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      required
                    />
                    <small style={{ color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                      Nomor ini yang akan menerima chat otomatis saat pelanggan mengklik "Kirim Pesanan ke WhatsApp".
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Alamat Toko</label>
                    <textarea
                      rows="2"
                      className="form-textarea"
                      value={settingsForm.address}
                      onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                    <Save size={16} />
                    <span>Simpan Pengaturan ke SQL</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Product Form Modal (Add / Edit) */}
      {isProductModalOpen && (
        <ProductFormModal
          onClose={() => setIsProductModalOpen(false)}
          onSave={handleSaveProduct}
          editingProduct={editingProduct}
          categories={categories}
        />
      )}

      {/* Confirm Delete Product Modal */}
      <ConfirmModal
        isOpen={!!deletingProduct}
        title="Hapus Produk Ini?"
        message={`Apakah Anda yakin ingin menghapus "${deletingProduct?.name}" dari database SQL? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleConfirmDeleteProduct}
        onCancel={() => setDeletingProduct(null)}
        confirmText="Hapus Produk"
      />

      {/* Confirm Delete Category Modal */}
      <ConfirmModal
        isOpen={!!deletingCategory}
        title="Hapus Kategori Ini?"
        message={`Apakah Anda yakin ingin menghapus kategori "${deletingCategory?.name}" dari database SQL?`}
        onConfirm={handleConfirmDeleteCategory}
        onCancel={() => setDeletingCategory(null)}
        confirmText="Hapus Kategori"
      />
    </div>
  );
};