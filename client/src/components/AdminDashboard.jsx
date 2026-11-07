import { useState } from 'react';
import Logo from '../assets/BYY Motorcycle Racing Emblem.png';
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
  ShieldCheck,
  UserRound,
  ClipboardList,
  RefreshCw
} from 'lucide-react';
import { ProductFormModal } from './ProductFormModal';
import { ConfirmModal } from './ConfirmModal';
import { DEFAULT_PRODUCT_IMAGE, getProductImageUrl } from '../services/productImages';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  createCategory,
  updateCategory,
  deleteCategory,
  updateStoreSettings,
  updateAdminProfile,
  fetchOrders,
  updateOrderStatus,
  deleteOrder
} from '../services/api';

const ORDER_STATUSES = [
  'Menunggu Konfirmasi',
  'Diproses',
  'Dikirim',
  'Selesai',
  'Dibatalkan',
];

export const AdminDashboard = ({
  products,
  categories,
  storeSettings,
  adminUser,
  onAdminProfileUpdated,
  onRefreshData,
  onBackToCatalog,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState('products');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [orders, setOrders] = useState([]);
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [savingOrderId, setSavingOrderId] = useState('');
  const [ordersError, setOrdersError] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');

  // Product states
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [productSuccess, setProductSuccess] = useState('');

  // Category states
  const [newCatName, setNewCatName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [catError, setCatError] = useState('');

  // Settings states
  const [settingsForm, setSettingsForm] = useState({
    storeName: storeSettings?.storeName || '',
    ownerName: storeSettings?.ownerName || '',
    tagline: storeSettings?.tagline || '',
    phone: storeSettings?.phone || '',
    address: storeSettings?.address || ''
  });
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: adminUser?.name || '',
    email: adminUser?.email || '',
    currentPassword: '',
    newPassword: ''
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = !orderStatusFilter || order.status === orderStatusFilter;
    const searchText = [
      order.id,
      order.customerName,
      order.customerPhone,
      order.customerNotes,
      ...order.items.map((item) => item.productName),
    ].join(' ').toLowerCase();
    return matchesStatus && (!orderSearch || searchText.includes(orderSearch.toLowerCase()));
  });

  const loadOrders = async () => {
    setIsLoadingOrders(true);
    setOrdersError('');
    try {
      const response = await fetchOrders();
      setOrders(response.data || []);
    } catch (error) {
      setOrdersError(error.message || 'Gagal memuat riwayat pemesanan.');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleOpenOrders = () => {
    setActiveTab('orders');
    setIsSidebarOpenMobile(false);
    loadOrders();
  };

  const handleOrderStatusChange = async (orderId, status) => {
    setSavingOrderId(orderId);
    setOrdersError('');
    try {
      const response = await updateOrderStatus(orderId, status);
      setOrders((currentOrders) =>
        currentOrders.map((order) => order.id === orderId ? response.data : order)
      );
    } catch (error) {
      setOrdersError(error.message || 'Gagal memperbarui status pesanan.');
    } finally {
      setSavingOrderId('');
    }
  };

  const handleConfirmDeleteOrder = async () => {
    if (!deletingOrder) return;
    setOrdersError('');
    try {
      await deleteOrder(deletingOrder.id);
      setOrders((currentOrders) =>
        currentOrders.filter((order) => order.id !== deletingOrder.id)
      );
      setDeletingOrder(null);
    } catch (error) {
      setOrdersError(error.message || 'Gagal menghapus riwayat pesanan.');
    }
  };

  const formatOrderDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('id-ID');
  };

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
    setProductSuccess('');
    if (id) {
      await updateProduct(id, payload);
    } else {
      await createProduct(payload);
    }
    await onRefreshData();
    setProductSuccess(id ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.');
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
      const response = await updateStoreSettings(settingsForm);
      if (response?.data) {
        setSettingsForm({
          storeName: response.data.storeName || '',
          ownerName: response.data.ownerName || '',
          tagline: response.data.tagline || '',
          phone: response.data.phone || '',
          address: response.data.address || ''
        });
      }
      setSettingsSuccess(true);
      await onRefreshData();
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      alert(`Gagal menyimpan pengaturan: ${err.message}`);
    }
  };

  const handleSaveAdminProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setIsSavingProfile(true);

    try {
      const response = await updateAdminProfile(profileForm);
      onAdminProfileUpdated(response);
      setProfileForm({
        name: response.user.name,
        email: response.user.email,
        currentPassword: '',
        newPassword: ''
      });
      setProfileSuccess('Profil admin berhasil diperbarui.');
    } catch (err) {
      setProfileError(err.message || 'Gagal memperbarui profil admin.');
    } finally {
      setIsSavingProfile(false);
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
          <div className="sidebar-brand">
            <img src={Logo} width={36} style={{ borderRadius: '10%' }} height={36} alt="Logo BYY Motorcycle Racing" />
            {/* <ShoppingBag size={22} color="#ffffff" /> */}
          </div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-title">{storeSettings?.storeName || 'BYY MOTORCYCLE'}</div>
            <div className="sidebar-brand-badge">{adminUser.name || storeSettings?.ownerName || 'Admin Toko'}</div>
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
            className={`sidebar-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={handleOpenOrders}
            id="sidebar-link-orders"
          >
            <ClipboardList size={18} />
            <span className="nav-item-label">Riwayat Pemesanan</span>
            <span className="nav-badge-count">{orders.length}</span>
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

          <button
            className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('profile');
              setIsSidebarOpenMobile(false);
            }}
            id="sidebar-link-admin-profile"
          >
            <UserRound size={18} />
            <span className="nav-item-label">Profil Admin</span>
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
              <strong className="user-name">
                {adminUser?.name || storeSettings?.ownerName || 'Admin Toko'}
              </strong>
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
                {activeTab === 'orders' && 'Riwayat Pemesanan'}
                {activeTab === 'categories' && 'Manajemen Kategori'}
                {activeTab === 'settings' && 'Pengaturan Toko & Nomor WhatsApp'}
                {activeTab === 'profile' && 'Profil Admin'}
              </h2>
              <span className="viewport-breadcrumb">
                Admin Panel / {activeTab === 'products'
                  ? 'Produk'
                  : activeTab === 'orders'
                  ? 'Riwayat Pemesanan'
                  : activeTab === 'categories'
                  ? 'Kategori'
                  : activeTab === 'settings'
                  ? 'Pengaturan'
                  : 'Profil Admin'}
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
              {productSuccess && (
                <div className="form-alert-success animate-fade-in" role="status" style={{ marginBottom: '1rem' }}>
                  <Check size={18} />
                  <span>{productSuccess}</span>
                </div>
              )}
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
                      <th style={{ textAlign: 'center' }}>Jumlah Stok</th>
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
                        return (
                          <tr key={prod.id}>
                            {/* Image */}
                            <td style={{ width: '64px' }}>
                              <img
                                src={getProductImageUrl(prod)}
                                alt={prod.name}
                                className="table-product-thumb"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = DEFAULT_PRODUCT_IMAGE;
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

                            {/* Stock quantity is edited in the product form */}
                            <td style={{ textAlign: 'center' }}>
                              <span className="stock-quantity-value">{Number(prod.stockQuantity) || 0} unit</span>
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

          {activeTab === 'orders' && (
            <div className="admin-tab-content animate-fade-in">
              <div className="table-controls-bar">
                <div>
                  <h3 className="box-title">Daftar Pesanan ({filteredOrders.length})</h3>
                  <p className="box-subtitle">Data pesanan tersimpan dari checkout keranjang dan pesan langsung.</p>
                </div>
                <div className="table-search-group">
                  <input
                    className="form-input"
                    type="search"
                    placeholder="Cari pemesan, produk, atau ID..."
                    value={orderSearch}
                    onChange={(event) => setOrderSearch(event.target.value)}
                    aria-label="Cari riwayat pemesanan"
                  />
                  <select
                    className="form-select filter-select"
                    value={orderStatusFilter}
                    onChange={(event) => setOrderStatusFilter(event.target.value)}
                    aria-label="Filter status pesanan"
                  >
                    <option value="">Semua Status</option>
                    {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                  <button className="btn btn-secondary btn-sm" type="button" onClick={loadOrders} disabled={isLoadingOrders}>
                    <RefreshCw size={15} />
                    <span>{isLoadingOrders ? 'Memuat...' : 'Muat Ulang'}</span>
                  </button>
                </div>
              </div>

              {ordersError && (
                <div className="form-alert-error" role="alert" style={{ marginBottom: '1rem' }}>
                  <AlertCircle size={16} />
                  <span>{ordersError}</span>
                </div>
              )}

              <div className="table-container">
                <table className="admin-table order-history-table">
                  <thead>
                    <tr>
                      <th>Waktu / ID Pesanan</th>
                      <th>Data Pemesan</th>
                      <th>Produk & Catatan</th>
                      <th>Total</th>
                      <th>Status Pesanan</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingOrders && orders.length === 0 ? (
                      <tr><td colSpan="6" className="table-empty-cell">Memuat riwayat pemesanan...</td></tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="table-empty-cell">
                          {orders.length ? 'Tidak ada pesanan sesuai pencarian atau filter.' : 'Belum ada riwayat pemesanan.'}
                        </td>
                      </tr>
                    ) : filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong className="table-product-name">{formatOrderDate(order.createdAt)}</strong>
                          <small className="order-id">{order.id}</small>
                        </td>
                        <td>
                          <strong>{order.customerName}</strong>
                          {order.customerPhone && <small className="order-detail">{order.customerPhone}</small>}
                        </td>
                        <td>
                          <ul className="order-item-lines">
                            {order.items.map((item) => (
                              <li key={`${order.id}-${item.productId}`}>
                                {item.productName} × {item.quantity} — {formatRupiah(item.lineTotal)}
                              </li>
                            ))}
                          </ul>
                          {order.customerNotes && <small className="order-detail">Catatan/alamat: {order.customerNotes}</small>}
                        </td>
                        <td><strong className="table-product-price">{formatRupiah(order.total)}</strong></td>
                        <td>
                          <select
                            className="form-select order-status-select"
                            value={order.status}
                            onChange={(event) => handleOrderStatusChange(order.id, event.target.value)}
                            disabled={savingOrderId === order.id}
                            aria-label={`Status pesanan ${order.id}`}
                          >
                            {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                          {savingOrderId === order.id && <small className="order-detail">Menyimpan status...</small>}
                        </td>
                        <td>
                          <button
                            className="btn-icon btn-icon-danger"
                            type="button"
                            onClick={() => setDeletingOrder(order)}
                            title={`Hapus riwayat pesanan ${order.id}`}
                            aria-label={`Hapus riwayat pesanan ${order.id}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
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
                        placeholder="cth: Sparepart Racing, Oli..."
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
                  Nama toko dan nama pemilik disimpan terpisah di tabel SQL <code>settings</code>.
                </p>

                {settingsSuccess && (
                  <div className="form-alert-success animate-fade-in" style={{ marginBottom: '1rem' }}>
                    <Check size={18} />
                    <span>Pengaturan toko berhasil diperbarui ke database SQL!</span>
                  </div>
                )}

                <form onSubmit={handleSaveSettings}>
                  <div className="form-group">
                    <label className="form-label">Nama Brand Dashboard / Bisnis</label>
                    <input
                      type="text"
                      className="form-input"
                      value={settingsForm.storeName}
                      placeholder="BYY MOTORCYCLE"
                      onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                      required
                    />
                    <small style={{ color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                      Nama ini ditampilkan di dashboard dan katalog, lalu tersimpan sebagai nama toko.
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nama Pemilik / Admin Toko</label>
                    <input
                      type="text"
                      className="form-input"
                      value={settingsForm.ownerName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, ownerName: e.target.value })}
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

          {activeTab === 'profile' && (
            <div className="admin-tab-content animate-fade-in">
              <div className="card-box" style={{ maxWidth: '640px' }}>
                <h3 className="box-title">Edit Profil Admin</h3>
                <p className="box-subtitle">
                  Perbarui nama pengguna, email, atau password akun admin. Password saat ini diperlukan untuk mengonfirmasi perubahan.
                </p>

                {profileSuccess && (
                  <div className="form-alert-success animate-fade-in" role="status" style={{ marginBottom: '1rem' }}>
                    <Check size={18} />
                    <span>{profileSuccess}</span>
                  </div>
                )}
                {profileError && (
                  <div className="form-alert-error animate-fade-in" role="alert" style={{ marginBottom: '1rem' }}>
                    <AlertCircle size={18} />
                    <span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveAdminProfile}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="admin-profile-name">Nama Pengguna Admin</label>
                    <input
                      id="admin-profile-name"
                      type="text"
                      className="form-input"
                      autoComplete="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="admin-profile-email">Email</label>
                    <input
                      id="admin-profile-email"
                      type="email"
                      className="form-input"
                      autoComplete="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="admin-profile-current-password">Password Saat Ini</label>
                    <input
                      id="admin-profile-current-password"
                      type="password"
                      className="form-input"
                      autoComplete="current-password"
                      value={profileForm.currentPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="admin-profile-new-password">Password Admin Baru (opsional)</label>
                    <input
                      id="admin-profile-new-password"
                      type="password"
                      className="form-input"
                      autoComplete="new-password"
                      minLength={8}
                      placeholder="Minimal 8 karakter"
                      value={profileForm.newPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                    />
                    <small style={{ color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                      Kosongkan jika tidak ingin mengganti password.
                    </small>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }} disabled={isSavingProfile}>
                    <Save size={16} />
                    <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan Profil Admin'}</span>
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
          key={editingProduct?.id || 'new-product'}
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

      <ConfirmModal
        isOpen={!!deletingOrder}
        title="Hapus Riwayat Pesanan?"
        message={`Apakah Anda yakin ingin menghapus pesanan ${deletingOrder?.id} atas nama ${deletingOrder?.customerName}? Data ini tidak dapat dipulihkan.`}
        onConfirm={handleConfirmDeleteOrder}
        onCancel={() => setDeletingOrder(null)}
        confirmText="Hapus Riwayat"
      />
    </div>
  );
};