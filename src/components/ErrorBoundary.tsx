import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * 
 * Catches React errors and provides recovery options.
 * Automatically detects hook order errors and suggests page reload.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isHookError = 
        this.state.error?.message?.includes('hook') ||
        this.state.error?.message?.includes('Hook') ||
        this.state.error?.message?.includes('Rendered fewer hooks');

      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#0a0a0a',
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          padding: '24px',
        }}>
          <div style={{
            maxWidth: '600px',
            textAlign: 'center',
          }}>
            <h1 style={{ fontSize: '24px', marginBottom: '16px', fontWeight: 600 }}>
              {isHookError ? 'Development Error Detected' : 'Something went wrong'}
            </h1>
            <p style={{ marginBottom: '24px', color: '#888', lineHeight: 1.6 }}>
              {isHookError 
                ? 'React detected a change in hook order. This typically happens during development when code is hot-reloaded. Click the button below to reload the page.'
                : 'An unexpected error occurred. Please reload the page to continue.'}
            </p>
            <button
              onClick={this.handleReload}
              style={{
                backgroundColor: '#C9A36A',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Reload Page
            </button>
            {!isHookError && (
              <details style={{ marginTop: '24px', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', color: '#666' }}>
                  Error Details
                </summary>
                <pre style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#1a1a1a',
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto',
                  color: '#ff6b6b',
                }}>
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
