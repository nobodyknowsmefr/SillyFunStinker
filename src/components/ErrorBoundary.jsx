import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={{ padding: 20, fontFamily: 'monospace', fontSize: 13, color: '#c00' }}>
            <strong>Render error:</strong> {this.state.error?.message || 'Unknown'}
          </div>
        )
      );
    }
    return this.props.children;
  }
}
