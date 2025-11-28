import React from 'react';

interface ErrorDisplayProps {
  error: string | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  title?: string;
  variant?: 'error' | 'warning' | 'success' | 'info';
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onDismiss,
  onRetry,
  title,
  variant = 'error',
  className = ''
}) => {
  if (!error) return null;

  const variants = {
    error: {
      containerClass: 'bg-red-50 border-red-200',
      iconClass: 'text-red-600',
      titleClass: 'text-red-800',
      messageClass: 'text-red-700',
      buttonClass: 'text-red-600 hover:text-red-800',
      icon: '⚠️',
      defaultTitle: 'Error'
    },
    warning: {
      containerClass: 'bg-yellow-50 border-yellow-200',
      iconClass: 'text-yellow-600',
      titleClass: 'text-yellow-800',
      messageClass: 'text-yellow-700',
      buttonClass: 'text-yellow-600 hover:text-yellow-800',
      icon: '⚡',
      defaultTitle: 'Warning'
    },
    success: {
      containerClass: 'bg-green-50 border-green-200',
      iconClass: 'text-green-600',
      titleClass: 'text-green-800',
      messageClass: 'text-green-700',
      buttonClass: 'text-green-600 hover:text-green-800',
      icon: '✅',
      defaultTitle: 'Success'
    },
    info: {
      containerClass: 'bg-blue-50 border-blue-200',
      iconClass: 'text-blue-600',
      titleClass: 'text-blue-800',
      messageClass: 'text-blue-700',
      buttonClass: 'text-blue-600 hover:text-blue-800',
      icon: 'ℹ️',
      defaultTitle: 'Information'
    }
  };

  const config = variants[variant];
  const displayTitle = title || config.defaultTitle;

  return (
    <div className={`border rounded-lg p-4 ${config.containerClass} ${className}`}>
      <div className="flex items-start space-x-3">
        <span className={`text-lg mt-0.5 flex-shrink-0 ${config.iconClass}`}>
          {config.icon}
        </span>
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium ${config.titleClass}`}>
            {displayTitle}
          </h3>
          <div className={`text-sm mt-1 ${config.messageClass}`}>
            {/* Handle multi-line errors */}
            {error.split('\n').map((line, index) => (
              <div key={index} className={index > 0 ? 'mt-1' : ''}>
                {line}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          {onRetry && (
            <button
              onClick={onRetry}
              className={`p-1 rounded hover:bg-white hover:bg-opacity-50 ${config.buttonClass}`}
              title="Retry"
            >
              🔄
            </button>
          )}
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`p-1 rounded hover:bg-white hover:bg-opacity-50 ${config.buttonClass}`}
              title="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Toast notification for temporary messages
interface ToastProps {
  message: string;
  variant?: 'error' | 'warning' | 'success' | 'info';
  visible: boolean;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'info',
  visible,
  onDismiss,
  autoHide = true,
  duration = 5000
}) => {
  React.useEffect(() => {
    if (visible && autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, autoHide, onDismiss, duration]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <ErrorDisplay
        error={message}
        variant={variant}
        onDismiss={onDismiss}
        className="shadow-lg"
      />
    </div>
  );
};

// Error boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; reset: () => void }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            reset={() => this.setState({ hasError: false, error: undefined })}
          />
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full">
            <ErrorDisplay
              error={`Something went wrong: ${this.state.error.message}`}
              title="Application Error"
              onRetry={() => this.setState({ hasError: false, error: undefined })}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Inline error for form fields
interface FieldErrorProps {
  error?: string;
  className?: string;
}

export const FieldError: React.FC<FieldErrorProps> = ({ error, className = '' }) => {
  if (!error) return null;

  return (
    <div className={`flex items-center space-x-1 text-red-600 text-sm mt-1 ${className}`}>
      <span className="text-red-600 flex-shrink-0">⚠️</span>
      <span>{error}</span>
    </div>
  );
};

export default ErrorDisplay;