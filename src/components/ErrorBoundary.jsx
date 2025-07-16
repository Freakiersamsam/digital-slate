import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render shows fallback (if any)
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Show error in development, hide in production
      if (import.meta.env.DEV) {
        return (
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#ff6b6b', 
            color: 'white',
            fontFamily: 'monospace',
            margin: '20px',
            borderRadius: '8px'
          }}>
            <h2>Something went wrong!</h2>
            <p>Check the console for error details.</p>
          </div>
        );
      }
      return null;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
