import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows fallback (if any)
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isFirebaseError = this.state.error?.message?.includes('Firebase') || 
                             this.state.error?.message?.includes('auth') ||
                             this.state.error?.message?.includes('database');
      
      return (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#ff6b6b', 
          color: 'white',
          fontFamily: 'monospace',
          borderRadius: '8px',
          maxWidth: '600px',
          margin: '20px auto'
        }}>
          <h2>🚨 Something went wrong!</h2>
          
          {isFirebaseError ? (
            <div>
              <p>Firebase initialization error detected.</p>
              <p>The app will run in localStorage-only mode.</p>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  color: '#ff6b6b',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Reload App
              </button>
            </div>
          ) : (
            <div>
              <p>An unexpected error occurred.</p>
              {import.meta.env.DEV && (
                <details style={{ marginTop: '10px' }}>
                  <summary>Error Details</summary>
                  <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                    {this.state.error?.toString()}
                  </pre>
                </details>
              )}
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  color: '#ff6b6b',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Reload App
              </button>
            </div>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
