'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from './ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="app-shell">
          <main className="app-shell-inner max-w-2xl py-12">
            <div className="glass-basic card-glass p-8 space-y-6">
              <div>
                <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--error)' }}>
                  Something went wrong
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  An unexpected error occurred. Please try again.
                </p>
              </div>

              {this.state.error && (
                <details className="space-y-2">
                  <summary 
                    className="text-sm font-medium cursor-pointer"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Error details
                  </summary>
                  <pre 
                    className="text-xs p-4 rounded-lg overflow-auto"
                    style={{ 
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-tertiary)'
                    }}
                  >
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={this.handleReset}
                  style={{ background: 'var(--accent)', color: '#ffffff' }}
                >
                  Try again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/field'}
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </main>
        </div>
      )
    }

    return this.props.children
  }
}

