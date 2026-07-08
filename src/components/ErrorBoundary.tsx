import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { reportError } from '../utils/logger';
import { ErrorActionButtons } from './common/ErrorActionButtons';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportError(error, { errorInfo, component: 'ErrorBoundary' });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-app-bg text-text-primary p-6 transition-colors duration-300">
          <div className="max-w-md w-full bg-card-bg rounded-2xl shadow-2xl overflow-hidden border border-border-subtle relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary"></div>
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-cinzel font-bold text-text-primary">An Error Occurred</h1>
                <p className="mt-2 text-text-secondary text-sm font-sans">
                  We encountered an unexpected issue. Our team has been notified.
                </p>
              </div>
              <ErrorActionButtons />
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
