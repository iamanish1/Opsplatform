import { Component } from 'react';

/**
 * Catches render errors in a section so one broken widget
 * doesn't blank the entire dashboard.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={{
            padding: '1.5rem',
            borderRadius: '16px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.85rem',
            textAlign: 'center',
          }}>
            This section failed to load.{' '}
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Retry
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
