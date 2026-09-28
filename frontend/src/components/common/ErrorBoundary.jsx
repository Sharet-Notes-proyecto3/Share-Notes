import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Error capturado en la interfaz:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-canvas, #09090b)',
            color: 'var(--text-primary, #f4f4f5)',
            padding: '24px',
            textAlign: 'center',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '22px', marginBottom: '8px', color: 'var(--text-primary, #ffffff)' }}>
            Ocurrió un problema inesperado en la interfaz
          </h2>
          <p style={{ color: 'var(--text-secondary, #a1a1aa)', maxWidth: '540px', fontSize: '14px', marginBottom: '20px', lineHeight: 1.5 }}>
            {this.state.error?.message || 'Se produjo un error al renderizar la vista.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              background: 'var(--primary-color, #0284c7)',
              color: '#ffffff',
              border: 'none',
              padding: '10px 22px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            🔄 Recargar aplicación
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
