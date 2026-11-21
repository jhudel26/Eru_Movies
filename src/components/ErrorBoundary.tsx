import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageSquare } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 space-y-6 glass-panel rounded-2xl border border-eru-border/60">
          <div className="w-16 h-16 rounded-full bg-eru-error/15 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-eru-error" />
          </div>

          <div className="text-center space-y-3">
            <h3 className="text-lg font-bold text-eru-text-primary">
              Something went wrong
            </h3>
            <p className="text-sm text-eru-text-muted max-w-md">
              We encountered an unexpected error. The error has been logged and our team has been notified.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left max-w-md mx-auto p-4 bg-eru-bg-deep rounded-lg border border-eru-border">
                <summary className="cursor-pointer text-xs font-mono text-eru-text-muted">
                  Error details (development only)
                </summary>
                <pre className="mt-2 text-[10px] overflow-auto text-eru-text-secondary">
                  {this.state.error?.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={this.handleRetry}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-eru-teal text-slate-950 font-bold text-sm shadow-teal-glow-sm hover:bg-eru-teal-bright transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-eru-surface-1 text-eru-text-secondary font-bold text-sm border border-eru-border hover:border-eru-teal/40 hover:text-eru-teal transition-all"
            >
              <Home className="w-4 h-4" />
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Specialized error boundary for media grids
 */
export class MediaGridErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="py-12 text-center space-y-3 glass-panel rounded-2xl border border-eru-border/60">
          <MessageSquare className="w-10 h-10 text-eru-teal-muted mx-auto stroke-1" />
          <p className="text-sm font-medium text-eru-text-secondary">
            Failed to load media grid
          </p>
          <p className="text-xs text-eru-text-muted">
            Please try refreshing or check your connection
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Specialized error boundary for player
 */
export class PlayerErrorBoundary extends Component<{ children: ReactNode; onError?: () => void }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    if (this.props.onError) {
      this.props.onError();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-[#070D18] space-y-6 p-8">
          <div className="w-20 h-20 rounded-full bg-eru-error/15 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-eru-error" />
          </div>

          <div className="text-center space-y-3 max-w-md">
            <h3 className="text-lg font-bold text-eru-text-primary">
              Playback Error
            </h3>
            <p className="text-sm text-eru-text-muted">
              Unable to load the video stream. This may be a temporary issue with the streaming provider.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => this.setState({ hasError: false })}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-eru-teal text-slate-950 font-bold text-sm shadow-teal-glow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Stream
            </button>
            <button
              onClick={this.props.onError}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-eru-surface-1 text-eru-text-secondary font-bold text-sm border border-eru-border"
            >
              <Home className="w-4 h-4" />
              Back to Catalog
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}