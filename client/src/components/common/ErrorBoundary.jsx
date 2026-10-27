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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '#/';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: '#0b0c10',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '480px',
            background: '#151824',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '36px 28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: '#f8fafc' }}>
              Oops! Something went wrong
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px', lineHeight: 1.5 }}>
              The page encountered an unexpected issue, but your session is safe. Click below to retry or return to the catalog.
            </p>
            {this.state.error?.message && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#fb7185',
                marginBottom: '24px',
                fontFamily: 'monospace',
                textAlign: 'left',
                overflowX: 'auto'
              }}>
                {this.state.error.message}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#f43f5e',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(244, 63, 94, 0.3)'
                }}
              >
                Retry
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
