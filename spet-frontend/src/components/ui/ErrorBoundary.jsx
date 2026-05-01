// ============================================================
// SPET — Error Boundary
// ============================================================

import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f8fafc', fontFamily: "'Inter', sans-serif", padding: '24px',
      }}>
        <div style={{
          background: 'white', borderRadius: '16px', padding: '40px',
          border: '1px solid #fee2e2', maxWidth: '480px', width: '100%',
          textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: '#fef2f2', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <AlertTriangle size={28} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>
            Une erreur inattendue s'est produite
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: 1.6 }}>
            {this.state.error?.message || 'Erreur inconnue'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', background: '#1a56db', color: 'white',
              border: 'none', borderRadius: '10px', fontSize: '14px',
              fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <RefreshCw size={15} /> Recharger la page
          </button>
        </div>
      </div>
    );
  }
}
