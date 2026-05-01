// ============================================================
// SPET — Top Banner (toasts) + Confirm Overlay
// ============================================================

import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';

const STYLES = {
  success: { bg: '#f0fdf4', border: '#10b981', color: '#065f46', Icon: CheckCircle,   iconColor: '#10b981' },
  error:   { bg: '#fef2f2', border: '#ef4444', color: '#7f1d1d', Icon: AlertCircle,   iconColor: '#ef4444' },
  warning: { bg: '#fffbeb', border: '#f59e0b', color: '#78350f', Icon: AlertTriangle, iconColor: '#f59e0b' },
  info:    { bg: '#eff6ff', border: '#3b82f6', color: '#1e40af', Icon: Info,          iconColor: '#3b82f6' },
};

function ToastBanner({ toast, onRemove }) {
  const s = STYLES[toast.type] || STYLES.info;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 20px',
      background: s.bg,
      borderLeft: `4px solid ${s.border}`,
      animation: 'bannerSlideDown 0.25s ease',
    }}>
      <s.Icon size={15} color={s.iconColor} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: '13px', color: '#374151' }}>
        {toast.title && <strong style={{ color: s.color, marginRight: '6px' }}>{toast.title}</strong>}
        {toast.message}
      </div>
      <button onClick={() => onRemove(toast.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: '2px' }}>
        <X size={13} />
      </button>
    </div>
  );
}

function ConfirmOverlay({ banner, onConfirm, onCancel }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'confirmFadeIn 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '28px 32px',
          maxWidth: '420px',
          width: '90%',
          boxShadow: '0 24px 60px rgba(0,0,0,0.2), 0 8px 20px rgba(0,0,0,0.12)',
          animation: 'confirmSlideUp 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Icône + message */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: '#fef2f2', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            <AlertTriangle size={20} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
              Confirmation
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
              {banner.message}
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 20px', background: '#f8fafc',
              border: '1px solid #e2e8f0', borderRadius: '8px',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: '#64748b',
              fontFamily: 'inherit',
            }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 20px', background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              border: 'none', borderRadius: '8px',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: 'white',
              fontFamily: 'inherit',
              boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
            }}
          >
            Confirmer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes confirmFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes confirmSlideUp {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes bannerSlideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function TopBanner() {
  const { toasts, removeToast, confirmBanner, resolveConfirm } = useNotification();

  return (
    <>
      {/* Toasts — bannière sous la topbar */}
      {toasts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {toasts.map(t => (
            <ToastBanner key={t.id} toast={t} onRemove={removeToast} />
          ))}
        </div>
      )}

      {/* Confirmation — overlay centré avec fond flouté */}
      {confirmBanner && (
        <ConfirmOverlay
          banner={confirmBanner}
          onConfirm={() => resolveConfirm(true)}
          onCancel={() => resolveConfirm(false)}
        />
      )}
    </>
  );
}
