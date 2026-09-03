import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MediKiosk ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleFullReset = () => {
    try {
      window.location.hash = '#/kiosk';
      window.location.reload();
    } catch {
      window.location.href = '/';
    }
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-6 min-h-[400px]">
          <div className="max-w-lg w-full rounded-[32px] bg-white/90 backdrop-blur-2xl border-2 border-rose-300 p-8 shadow-2xl text-slate-900 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center mx-auto mb-4 text-rose-600 shadow-xs">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-blue-950 mb-2">
              {this.props.fallbackTitle || 'Module Temporarily Interrupted'}
            </h3>

            <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">
              {this.props.fallbackMessage ||
                'A temporary error occurred in this view. Your session data is protected and you can safely retry.'}
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-left font-mono text-xs text-rose-800 overflow-x-auto max-h-28">
                {this.state.error.message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry View</span>
              </button>

              <button
                type="button"
                onClick={this.handleFullReset}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <Home className="w-4 h-4 text-slate-600" />
                <span>Kiosk Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
