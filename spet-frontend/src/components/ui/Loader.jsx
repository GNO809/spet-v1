// ============================================================
// SPET — Loader / Skeleton Components
// ============================================================

export function Spinner({ size = 'md', white = false }) {
  const sizes = { sm: 16, md: 24, lg: 36 };
  const px = sizes[size] || sizes.md;
  return (
    <div
      style={{
        width: px, height: px,
        border: `2px solid ${white ? 'rgba(255,255,255,0.3)' : 'rgba(26,86,219,0.15)'}`,
        borderTopColor: white ? 'white' : '#1a56db',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  );
}

export function PageLoader() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '300px', gap: '16px',
    }}>
      <Spinner size="lg" />
      <p style={{ color: '#94a3b8', fontSize: '14px' }}>Chargement...</p>
    </div>
  );
}

export function SkeletonLine({ width = '100%', height = '16px', radius = '6px' }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: radius }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card-flat" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <SkeletonLine width="40%" height="18px" />
      <SkeletonLine width="70%" height="14px" />
      <SkeletonLine width="55%" height="14px" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div style={{ display: 'flex', gap: '16px', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
      <SkeletonLine width="30px" height="30px" radius="50%" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <SkeletonLine width="40%" height="14px" />
        <SkeletonLine width="60%" height="12px" />
      </div>
      <SkeletonLine width="80px" height="24px" radius="20px" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="table-container">
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
        <SkeletonLine width="260px" height="36px" radius="8px" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export default Spinner;
