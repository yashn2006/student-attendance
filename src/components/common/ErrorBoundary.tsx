import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-2xl bg-white border border-[#DB5B4E]/30 text-[#DB5B4E] shadow-lg">
          <h2 className="text-xl font-bold">Something went wrong.</h2>
          <p className="text-sm mt-2">{this.state.error?.message}</p>
          <button 
            className="mt-4 px-4 py-2 bg-[#DB5B4E] text-white rounded-lg text-sm font-bold"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
