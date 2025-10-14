"use client"

import React from 'react';
import { currentTheme } from '../config/themes';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: '40px',
            textAlign: 'center',
            backgroundColor: currentTheme.colors.surface,
            borderRadius: '12px',
            border: `1px solid ${currentTheme.colors.grayLight}`,
            margin: '20px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              backgroundColor: `${currentTheme.colors.error}20`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={currentTheme.colors.error} strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          
          <h2 
            style={{
              fontSize: '24px',
              fontWeight: '600',
              color: currentTheme.colors.textDark,
              margin: '0 0 12px 0',
            }}
          >
            Something went wrong
          </h2>
          
          <p 
            style={{
              fontSize: '16px',
              color: currentTheme.colors.textMedium,
              marginBottom: '24px',
              maxWidth: '400px',
            }}
          >
            We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
          </p>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => this.setState({ hasError: false })}
              style={{
                padding: '12px 24px',
                backgroundColor: currentTheme.colors.buttonPrimary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = currentTheme.colors.buttonPrimaryHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = currentTheme.colors.buttonPrimary;
              }}
            >
              Try Again
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: currentTheme.colors.textMedium,
                border: `1px solid ${currentTheme.colors.inputBorder}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = currentTheme.colors.backgroundAlt;
                e.currentTarget.style.borderColor = currentTheme.colors.inputBorderFocus;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = currentTheme.colors.inputBorder;
              }}
            >
              Refresh Page
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details 
              style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: currentTheme.colors.backgroundAlt,
                borderRadius: '8px',
                fontSize: '12px',
                color: currentTheme.colors.textMedium,
                maxWidth: '500px',
                textAlign: 'left',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: '500' }}>
                Error Details (Development)
              </summary>
              <pre style={{ 
                marginTop: '12px', 
                whiteSpace: 'pre-wrap', 
                fontSize: '11px',
                color: currentTheme.colors.error,
              }}>
                {this.state.error.message}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}