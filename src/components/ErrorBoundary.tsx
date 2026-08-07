import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-100 text-error-600">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Une erreur est survenue</h1>
            <p className="mt-2 text-neutral-600">
              {this.state.error?.message || 'Désolé, quelque chose s\'est mal passé.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 btn-primary mx-auto"
            >
              <RefreshCw size={18} />
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
