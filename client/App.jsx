import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BatteryCharging,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleGauge,
  Disc3,
  Gauge,
  MapPin,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Wrench,
} from 'lucide-react';
import {
  clearAuthToken,
  fetchAdminProfile,
  fetchCategories,
  createOrder,
  fetchProducts,
  fetchStoreSettings,
  getAuthToken,
  setAuthToken,
} from './src/services/api';
import { AdminDashboard } from './src/components/AdminDashboard';
import { AdminLoginModal } from './src/components/AdminLoginModel';
import { CategoryPills } from './src/components/CategoryPills';
import { Header } from './src/components/Header';
import { OrderModal } from './src/components/OrderMOdal';
import { CartModal } from './src/components/CartModal';
import { ProductCard } from './src/components/ProductCard';
import { ProductDetailModal } from './src/components/ProductDetailModal';
import { SearchBar } from './src/components/SearchBar';

const categoryShortcuts = [
  { label: 'Oli Mesin', terms: ['oli'], icon: Gauge },
  { label: 'Sparepart Mesin', terms: ['sparepart', 'mesin', 'engine'], icon: Wrench },
  { label: 'Sistem Pengereman', terms: ['rem', 'pengereman', 'kampas', 'kaliper'], icon: Disc3 },
  { label: 'Ban dan Velg', terms: ['ban', 'velg', 'roda'], icon: CircleGauge },
  { label: 'Rantai dan Gear', terms: ['rantai', 'gear'], icon: CircleGauge },
  { label: 'Kelistrikan', terms: ['listrik', 'kelistrikan', 'ecu', 'aki'], icon: BatteryCharging },
  { label: 'Aksesoris Motor', terms: ['aksesoris', 'aksesori'], icon: Sparkles },
];

const isProductAvailable = (product) =>
  (product.stockStatus || product.stokStatus) === 'Tersedia';

const isNewArrival = (product) => {
  const createdAt = new Date(product.createdAt || '').getTime();
  const ageInDays = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
  return Number.isFinite(createdAt) && ageInDays >= 0 && ageInDays <= 30;
};

const PRODUCTS_PER_PAGE = 10;

export function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState('*');
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [sortOrder, setSortOrder] = useState('recommended');
  const [productPage, setProductPage] = useState(1);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState(null);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [prodRes, catRes, storeRes] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchStoreSettings(),
      ]);
      if (prodRes?.data) setProducts(prodRes.data);
      if (catRes?.data) setCategories(catRes.data);
      if (storeRes?.data) setStoreSettings(storeRes.data);
    } catch (err) {
      console.error('Gagal mengambil data katalog:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchProducts(), fetchCategories(), fetchStoreSettings()])
      .then(([prodRes, catRes, storeRes]) => {
        if (!isMounted) return;
        if (prodRes?.data) setProducts(prodRes.data);
        if (catRes?.data) setCategories(catRes.data);
        if (storeRes?.data) setStoreSettings(storeRes.data);
      })
      .catch((err) => {
        console.error('Gagal mengambil data katalog:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const token = getAuthToken();
    if (token) {
      fetchAdminProfile()
        .then((res) => {
          if (isMounted && res?.user) setAdminUser(res.user);
        })
        .catch(() => {
          clearAuthToken();
          if (isMounted) setAdminUser(null);
        });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    setAdminUser(null);
    setIsAdminView(false);
  };

  const addToCart = (product) => {
    if (!isProductAvailable(product)) return;
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.productId === product.id);
      if (existingItem) {
        return currentCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentCart, { productId: product.id, quantity: 1 }];
    });
  };

  const cartItems = cart
    .map((item) => ({
      ...item,
      product: products.find((product) => product.id === item.productId),
    }))
    .filter((item) => item.product);

  const updateCartQuantity = (productId, quantity) => {
    setCart((currentCart) => currentCart.flatMap((item) => {
      if (item.productId !== productId) return [item];
      if (quantity < 1) return [];
      const product = products.find((entry) => entry.id === productId);
      if (!product) return [];
      return [{ ...item, quantity }];
    }));
  };

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matching = products.filter((product) => {
      const matchesCategory =
        activeCategoryId === '*' || product.categoryId === activeCategoryId;
      const searchableText = [
        product.name,
        product.description,
        product.categoryName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = !query || searchableText.includes(query);
      const price = Number(product.price) || 0;
      const matchesPrice =
        priceRange === 'all' ||
        (priceRange === 'under-250' && price < 250000) ||
        (priceRange === '250-1m' && price >= 250000 && price <= 1000000) ||
        (priceRange === 'over-1m' && price > 1000000);
      return matchesCategory && matchesSearch && matchesPrice;
    });

    return [...matching].sort((a, b) => {
      if (sortOrder === 'price-asc') return Number(a.price) - Number(b.price);
      if (sortOrder === 'price-desc') return Number(b.price) - Number(a.price);
      if (sortOrder === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      return 0;
    });
  }, [products, activeCategoryId, search, priceRange, sortOrder]);

  const featuredProducts = useMemo(
    () =>
      [...products]
        .filter(isProductAvailable)
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        )
        .slice(0, 3),
    [products],
  );
  const pageCount = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const currentProductPage = Math.min(productPage, Math.max(pageCount, 1));
  const visibleProducts = filteredProducts.slice(
    (currentProductPage - 1) * PRODUCTS_PER_PAGE,
    currentProductPage * PRODUCTS_PER_PAGE,
  );

  const handleSearchChange = (value) => {
    setSearch(value);
    setProductPage(1);
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategoryId(categoryId);
    setProductPage(1);
  };

  const selectShortcut = (shortcut) => {
    const match = categories.find((category) => {
      const categoryName = category.name.toLowerCase();
      return shortcut.terms.some((term) => categoryName.includes(term));
    });
    setProductPage(1);
    setPriceRange('all');
    if (match) {
      setActiveCategoryId(match.id);
      setSearch('');
    } else {
      setActiveCategoryId('*');
      setSearch(shortcut.terms[0]);
    }
    document.getElementById('katalog')?.scrollIntoView({ behavior: 'smooth' });
  };

  const whatsappUrl = storeSettings?.phone
    ? `https://wa.me/${String(storeSettings.phone).replace(/\D/g, '')}`
    : undefined;

  if (isAdminView && adminUser) {
    return (
      <div className="app-layout">
        <AdminDashboard
          products={products}
          categories={categories}
          storeSettings={storeSettings}
          adminUser={adminUser}
          onAdminProfileUpdated={(result) => {
            setAuthToken(result.token);
            setAdminUser(result.user);
          }}
          onRefreshData={loadData}
          onBackToCatalog={() => setIsAdminView(false)}
          onLogout={handleLogout}
        />
        <AdminLoginModal
          isOpen={isAdminLoginOpen}
          onClose={() => setIsAdminLoginOpen(false)}
          onSuccess={(user) => {
            setAdminUser(user);
            setIsAdminView(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Header
        storeSettings={storeSettings}
        isAdminView={isAdminView}
        setIsAdminView={setIsAdminView}
        adminUser={adminUser}
        onOpenLogin={() => setIsAdminLoginOpen(true)}
        onLogout={handleLogout}
      />

      <main className="customer-catalog-view">
        <section className="hero-banner" id="beranda">
          <div className="container hero-layout">
            <div className="hero-copy">
              <span className="hero-badge">
                <Sparkles size={15} />
                <span>Partner terpercaya untuk motor Anda</span>
              </span>
              <h1 className="hero-title">
                Temukan Sparepart Motor <span>Berkualitas</span>
              </h1>
              <p className="hero-desc">
                Solusi kebutuhan sparepart motor Anda dengan pilihan produk
                berkualitas, harga bersahabat, dan pelayanan terpercaya.
              </p>
              <div className="hero-actions">
                <a className="btn btn-primary" href="#katalog">
                  Lihat Katalog <ArrowRight size={17} />
                </a>
                {whatsappUrl && (
                  <a
                    className="btn btn-wa"
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle size={17} /> Pesan via WhatsApp
                  </a>
                )}
              </div>
              <div className="hero-trust-row">
                <span><Check size={15} /> Harga bersahabat</span>
                <span><Check size={15} /> Pesan mudah via WhatsApp</span>
              </div>
            </div>
            <div className="hero-visual">
              <img
                className="hero-image"
                src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=85"
                alt="Motor bergaya racing untuk menemani perjalanan"
              />
              <div className="hero-image-shade" />
              <div className="hero-image-label">
                <span className="hero-label-icon"><ShieldCheck size={20} /></span>
                <span><strong>Siap menemani</strong><small>Setiap perjalanan Anda</small></span>
              </div>
              <span className="hero-visual-mark" aria-hidden="true">BYY / RACING</span>
            </div>
          </div>
        </section>

        <section className="category-section" id="kategori">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="section-kicker">PILIH KEBUTUHAN ANDA</span>
                <h2>Belanja berdasarkan kategori</h2>
                <p>Temukan komponen yang tepat untuk motor kesayangan.</p>
              </div>
              <a className="text-link" href="#katalog">Lihat semua produk <ChevronRight size={17} /></a>
            </div>
            <div className="category-card-grid">
              {categoryShortcuts.map(({ label, icon: Icon, ...shortcut }) => (
                <button
                  className="category-card"
                  key={label}
                  type="button"
                  onClick={() => selectShortcut(shortcut)}
                  aria-label={`Cari kategori ${label}`}
                >
                  <span className="category-card-icon"><Icon size={22} /></span>
                  <span className="category-card-label">{label}</span>
                  <ChevronRight className="category-card-arrow" size={17} />
                </button>
              ))}
            </div>
          </div>
        </section>

        {featuredProducts.length > 0 && (
          <section className="featured-section">
            <div className="container">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">REKOMENDASI UNTUK ANDA</span>
                  <h2>Produk pilihan</h2>
                  <p>Pilihan sparepart dari BYY Motorcycle Racing.</p>
                </div>
                <a className="text-link" href="#katalog">Jelajahi katalog <ChevronRight size={17} /></a>
              </div>
              <div className="catalog-grid featured-grid">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={`featured-${product.id}`}
                    product={product}
                    onAddToCart={addToCart}
                    featured
                    isNew={isNewArrival(product)}
                    onSelectProduct={setSelectedProductForOrder}
                    onViewDetails={setSelectedProductForDetails}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="catalog-section" id="katalog">
          <div className="container">
            <div className="section-heading catalog-heading">
              <div>
                <span className="section-kicker">KATALOG BYY MOTORCYCLE</span>
                <h2>Sparepart pilihan, siap menemani</h2>
                <p>Cari produk berdasarkan nama, kategori, atau kisaran harga.</p>
              </div>
              <div className="catalog-header-actions">
                <span className="catalog-count">{products.length} produk</span>
                <button className="btn btn-primary cart-open-button" type="button" onClick={() => setIsCartOpen(true)}>
                  <ShoppingCart size={17} />
                  <span>Keranjang</span>
                  <span className="cart-item-count">
                    {cartItems.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                </button>
              </div>
            </div>
            <div className="catalog-toolbar">
              <SearchBar
                search={search}
                setSearch={handleSearchChange}
                placeholder="Cari nama sparepart atau kategori..."
              />
              <div className="catalog-selects">
                <label className="filter-control">
                  <span>Rentang harga</span>
                  <select value={priceRange} onChange={(event) => {
                    setPriceRange(event.target.value);
                    setProductPage(1);
                  }}>
                    <option value="all">Semua harga</option>
                    <option value="under-250">Di bawah Rp250.000</option>
                    <option value="250-1m">Rp250.000 – Rp1.000.000</option>
                    <option value="over-1m">Di atas Rp1.000.000</option>
                  </select>
                </label>
                <label className="filter-control">
                  <span>Urutkan</span>
                  <select value={sortOrder} onChange={(event) => {
                    setSortOrder(event.target.value);
                    setProductPage(1);
                  }}>
                    <option value="recommended">Rekomendasi</option>
                    <option value="newest">Produk terbaru</option>
                    <option value="price-asc">Harga termurah</option>
                    <option value="price-desc">Harga termahal</option>
                  </select>
                </label>
              </div>
            </div>

            <CategoryPills
              categories={categories}
              activeCategoryId={activeCategoryId}
              onSelectCategory={handleCategoryChange}
              totalProductsCount={products.length}
            />

            {isLoading ? (
              <div className="catalog-loading" role="status">
                <RefreshCw size={28} className="animate-spin" />
                <p>Memuat katalog produk...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <p className="results-caption">
                  Menampilkan {(currentProductPage - 1) * PRODUCTS_PER_PAGE + 1}–
                  {Math.min(currentProductPage * PRODUCTS_PER_PAGE, filteredProducts.length)} dari {filteredProducts.length} produk
                </p>
                <div className="catalog-grid">
                  {visibleProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                      featured={featuredProducts.some((item) => item.id === product.id)}
                      isNew={isNewArrival(product)}
                      onSelectProduct={setSelectedProductForOrder}
                      onViewDetails={setSelectedProductForDetails}
                    />
                  ))}
                </div>
                {pageCount > 1 && (
                  <nav className="product-pagination" aria-label="Halaman produk">
                    <button
                      className="product-page-button"
                      type="button"
                      aria-label="Halaman sebelumnya"
                      disabled={currentProductPage === 1}
                      onClick={() => setProductPage(currentProductPage - 1)}
                    >
                      <ChevronLeft size={17} />
                      <span>Sebelumnya</span>
                    </button>
                    <span className="product-page-status" aria-live="polite">
                      Halaman {currentProductPage} dari {pageCount}
                    </span>
                    <button
                      className="product-page-button"
                      type="button"
                      aria-label="Halaman berikutnya"
                      disabled={currentProductPage >= pageCount}
                      onClick={() => setProductPage(currentProductPage + 1)}
                    >
                      <span>Berikutnya</span>
                      <ChevronRight size={17} />
                    </button>
                  </nav>
                )}
              </>
            ) : (
              <div className="catalog-empty-state">
                <Wrench size={34} />
                <h3 className="catalog-empty-title">Produk belum ditemukan</h3>
                <p className="catalog-empty-desc">
                  Coba kata kunci atau filter lain untuk menemukan sparepart yang Anda cari.
                </p>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSearch('');
                    setActiveCategoryId('*');
                    setPriceRange('all');
                    setProductPage(1);
                  }}
                  type="button"
                >
                  Tampilkan semua produk
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="store-section" id="tentang">
          <div className="container store-layout">
            <div className="store-copy">
              <span className="section-kicker">TENTANG TOKO KAMI</span>
              <h2>{storeSettings?.storeName || 'BYY Motorcycle Racing'}</h2>
              <p>
                {storeSettings?.tagline ||
                  'Solusi kebutuhan sparepart motor Anda dengan pilihan produk berkualitas dan pelayanan terpercaya.'}
              </p>
              <div className="store-contact">
                {storeSettings?.address && (
                  <p><MapPin size={18} /><span>{storeSettings.address}</span></p>
                )}
                {storeSettings?.phone && (
                  <p><MessageCircle size={18} /><span>{storeSettings.phone}</span></p>
                )}
              </div>
              {whatsappUrl && (
                <a className="btn btn-primary" href={whatsappUrl} target="_blank" rel="noreferrer">
                  Hubungi toko <ArrowRight size={17} />
                </a>
              )}
            </div>
            <div className="store-benefits">
              <h3>Belanja nyaman, urusan beres.</h3>
              {[
                'Harga bersahabat untuk kebutuhan Anda',
                'Pilihan sparepart motor beragam',
                'Pelayanan ramah dan terpercaya',
                'Pemesanan mudah langsung melalui WhatsApp',
              ].map((benefit) => (
                <div className="benefit-row" key={benefit}>
                  <span><Check size={16} /></span>{benefit}
                </div>
              ))}
              <div className="store-note">
                <ShieldCheck size={20} />
                <span>Tim kami siap membantu memilih komponen yang sesuai untuk motor Anda.</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-main">
          <div className="footer-brand">
            <a className="footer-logo" href="#beranda">BYY MOTORCYCLE RACING</a>
            <p>Kebutuhan sparepart motor berkualitas, dengan harga bersahabat dan layanan yang bisa diandalkan.</p>
          </div>
          <div className="footer-links">
            <h3>Navigasi</h3>
            <a href="#beranda">Beranda</a>
            <a href="#katalog">Katalog Produk</a>
            <a href="#kategori">Kategori</a>
            <a href="#tentang">Tentang Kami</a>
          </div>
          <div className="footer-contact" id="kontak">
            <h3>Hubungi kami</h3>
            {storeSettings?.address && <p><MapPin size={16} />{storeSettings.address}</p>}
            {storeSettings?.phone && <p><MessageCircle size={16} />{storeSettings.phone}</p>}
            {whatsappUrl && (
              <a className="footer-wa" href={whatsappUrl} target="_blank" rel="noreferrer">
                <MessageCircle size={16} /> Chat via WhatsApp
              </a>
            )}
            <button className="footer-admin-link" onClick={() => setIsAdminLoginOpen(true)} type="button">
              Login admin
            </button>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} {storeSettings?.storeName || 'BYY Motorcycle Racing'}. Hak cipta dilindungi.</span>
          <a href="#beranda">Kembali ke atas <ArrowRight size={14} /></a>
        </div>
      </footer>

      {selectedProductForOrder && (
        <OrderModal
          product={selectedProductForOrder}
          storeSettings={storeSettings}
          onCreateOrder={createOrder}
          onClose={() => setSelectedProductForOrder(null)}
        />
      )}
      {isCartOpen && (
        <CartModal
          items={cartItems}
          storeSettings={storeSettings}
          onCreateOrder={createOrder}
          onClose={() => setIsCartOpen(false)}
          onQuantityChange={updateCartQuantity}
          onRemoveItem={(productId) => updateCartQuantity(productId, 0)}
        />
      )}
      {selectedProductForDetails && (
        <ProductDetailModal
          product={selectedProductForDetails}
          onClose={() => setSelectedProductForDetails(null)}
          onAddToCart={(product) => {
            addToCart(product);
            setSelectedProductForDetails(null);
          }}
          onOrder={() => {
            setSelectedProductForOrder(selectedProductForDetails);
            setSelectedProductForDetails(null);
          }}
        />
      )}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={(user) => {
          setAdminUser(user);
          setIsAdminView(true);
        }}
      />
    </div>
  );
}

export default App;
