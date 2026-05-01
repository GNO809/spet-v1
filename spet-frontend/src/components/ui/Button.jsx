// ============================================================
// SPET — Button Component
// ============================================================

import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',  // primary | secondary | success | danger | warning | ghost | icon
  size = '',            // '' | 'sm' | 'lg'
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  onClick,
  type = 'button',
  className = '',
  style = {},
  ...rest
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${size ? 'btn-' + size : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      style={style}
      {...rest}
    >
      {loading ? (
        <Loader2 size={16} className="spinner" style={{ animation: 'spin 0.7s linear infinite' }} />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : 16} />
      ) : null}
      {children}
      {!loading && IconRight && <IconRight size={16} />}
    </button>
  );
}
