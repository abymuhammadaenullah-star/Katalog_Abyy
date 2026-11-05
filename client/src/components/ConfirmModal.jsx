import { AlertTriangle, Trash2 } from 'lucide-react';

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Ya, Hapus'
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal-content animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '420px' }}
      >
        <div
          className="modal-body"
          style={{
            padding: '2rem 1.5rem',
            textAlign: 'center'
          }}
        >
          <div className="confirm-icon-box">
            <AlertTriangle size={32} color="#dc2626" />
          </div>

          <h3
            style={{
              fontSize: '1.25rem',
              marginBottom: '0.5rem',
              marginTop: '1rem'
            }}
          >
            {title}
          </h3>

          <p
            style={{
              color: 'var(--slate-500)',
              fontSize: '0.92rem',
              marginBottom: '1.5rem'
            }}
          >
            {message}
          </p>

          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center'
            }}
          >
            <button
              className="btn btn-secondary"
              onClick={onCancel}
              style={{ flex: 1 }}
            >
              Batal
            </button>

            <button
              className="btn btn-danger"
              onClick={onConfirm}
              style={{ flex: 1 }}
            >
              <Trash2 size={16} />
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};