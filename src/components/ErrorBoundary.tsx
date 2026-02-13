/**
 * Error Boundary Component
 * Catches React errors and displays a fallback UI
 */

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    if (errorInfo?.componentStack) {
      console.error('Component stack:', errorInfo.componentStack);
    }
    this.setState({ errorInfo: errorInfo?.componentStack || null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            {this.state.error?.message || 'Unknown error'}
          </p>
          {this.state.errorInfo && (
            <pre style={{
              background: '#f5f5f5',
              padding: '1rem',
              borderRadius: '0.375rem',
              overflow: 'auto',
              fontSize: '0.75rem',
              marginBottom: '1rem',
              maxWidth: '900px',
              whiteSpace: 'pre-wrap',
            }}>
              {this.state.errorInfo}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              background: '#C9A36A',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
          <details style={{ marginTop: '2rem', maxWidth: '600px' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>Error Details</summary>
            <pre style={{
              background: '#f5f5f5',
              padding: '1rem',
              borderRadius: '0.375rem',
              overflow: 'auto',
              fontSize: '0.875rem',
            }}>
              {this.state.error?.stack}
            </pre>
            {this.state.errorInfo && (
              <pre style={{
                background: '#f5f5f5',
                padding: '1rem',
                borderRadius: '0.375rem',
                overflow: 'auto',
                fontSize: '0.875rem',
                marginTop: '0.75rem',
              }}>
                {this.state.errorInfo}
              </pre>
            )}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
