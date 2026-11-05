import { useState } from 'react';
import {
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  MessageCircle,
  Store,
  X,
} from 'lucide-react';
import Logo from '../assets/BYY Motorcycle Racing Emblem.png';

const navigation = [
  ['Beranda', '#beranda'],
  ['Katalog Produk', '#katalog'],
  ['Kategori', '#kategori'],
  ['Tentang Kami', '#tentang'],
];

export const Header = ({
  storeSettings,
  isAdminView,
  setIsAdminView,
  adminUser,
  onOpenLogin,
  onLogout,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const whatsappUrl = storeSettings?.phone
    ? `https://wa.me/${String(storeSettings.phone).replace(/\D/g, '')}`
    : undefined;

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="site-header">
      <div className="container header-container">
        <a
          className="brand-group"
          href="#beranda"
          onClick={() => {
            setIsAdminView(false);
            closeMenu();
          }}
          aria-label="BYY Motorcycle Racing, beranda"
        >
          <div className="logo-brand">
            <img src={Logo} width={48} height={48} alt="Logo BYY Motorcycle Racing" />
            <div className="brand-info">
              <span className="brand-name">BYY MOTORCYCLE</span>
              <span className="store-subtext">MOTORCYCLE RACING</span>
            </div>
          </div>
        </a>

        <button
          className="mobile-menu-toggle"
          type="button"
          aria-label={isMenuOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={`primary-nav ${isMenuOpen ? 'is-open' : ''}`} aria-label="Navigasi utama">
          {navigation.map(([label, href]) => (
            <a key={href} href={href} onClick={closeMenu}>{label}</a>
          ))}
          {whatsappUrl && (
            <a
              className="header-contact-link"
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              onClick={closeMenu}
            >
              <MessageCircle size={16} /> Hubungi Kami
            </a>
          )}
          {adminUser ? (
            <div className="admin-status-bar">
              <span className="admin-badge">
                <span className="admin-dot" />
                Admin: {adminUser.name || 'Owner'}
              </span>
              {isAdminView ? (
                <button className="btn btn-secondary btn-sm" onClick={() => { setIsAdminView(false); closeMenu(); }}>
                  <Store size={16} /><span>Lihat Katalog</span>
                </button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => { setIsAdminView(true); closeMenu(); }}>
                  <LayoutDashboard size={16} /><span>Dashboard Admin</span>
                </button>
              )}
              <button className="btn btn-danger-soft btn-sm" onClick={() => { onLogout(); closeMenu(); }}>
                <LogOut size={16} /><span>Logout</span>
              </button>
            </div>
          ) : (
            <button className="admin-login-btn" onClick={() => { onOpenLogin(); closeMenu(); }} type="button">
              <Lock size={15} /> Login Admin
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
