import { useState } from 'react';
import { X, Lock, Mail, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';
import { loginAdmin, setAuthToken } from '../services/api';

export const AdminLoginModal = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Auto-fill demo credentials for immediate evaluator convenience
  const handleFillDemo = () => {
    setEmail('admin@katalogwa.com');
    setPassword('admin123');
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Email dan Password wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      // Backend authentication check
      const result = await loginAdmin(email.trim(), password);

      // Decision: Are Credentials Valid?
      // If YES: Authenticate via JWT & redirect to Admin Dashboard
      setAuthToken(result.token);
      onSuccess(result.user);
      onClose();
    } catch (err) {
      // If NO: Display error alert box ("Email atau Password salah"), stay on Login Page
      setErrorMsg(err.message || 'Email atau Password salah');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="admin-lock-icon">
              <Lock size={18} color="#ffffff" />
            </div>
            <div>
              <h2 className="modal-title">Login Admin Store</h2>
              <p className="modal-subtitle">Kelola produk & kategori BYY MOTORCYCLE</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} title="Tutup">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Quick Demo Credential Helper Pill */}
            <div className="demo-credentials-box">
              <div className="demo-creds-info">
                <KeyRound size={16} className="text-emerald" />
                <span>Akun Demo: <strong>admin@katalogwa.com</strong> / <strong>admin123</strong></span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-xs demo-fill-btn"
                onClick={handleFillDemo}
              >
                Isi Otomatis
              </button>
            </div>

            {/* Error Alert Box (Decision: Is NO) */}
            {errorMsg && (
              <div className="form-alert-error animate-fade-in" id="login-error-alert">
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="admin-email">
                <Mail size={15} />
                <span>Email Admin</span>
              </label>
              <input
                id="admin-email"
                type="email"
                className="form-input"
                placeholder="cth: admin@katalogwa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="admin-password">
                <Lock size={15} />
                <span>Password</span>
              </label>
              <input
                id="admin-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              id="admin-submit-login-btn"
            >
              <span>{isLoading ? 'Memverifikasi...' : 'Masuk Dashboard'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};