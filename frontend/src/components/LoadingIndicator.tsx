import React from 'react';
import { LoadingState, ProgressState } from '../types/api';

interface LoadingIndicatorProps {
  state: LoadingState;
  progress?: ProgressState['analysis'];
  operation?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  state,
  progress,
  operation = 'Processing',
  size = 'md',
  className = ''
}) => {
  if (state !== 'loading') return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Animated Spinner */}
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
      
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-gray-900 truncate ${textSizeClasses[size]}`}>
          {operation}...
        </div>
        
        {progress && (
          <div className="space-y-2">
            {/* Stage and current sample info */}
            <div className={`text-gray-500 capitalize truncate ${size === 'sm' ? 'text-xs' : 'text-xs'}`}>
              {progress.stage}
              {progress.currentSample && (
                <span className="ml-1 font-medium">
                  ({progress.currentSample})
                </span>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress.progress))}%` }}
              />
            </div>
            
            {/* Progress Percentage */}
            <div className={`text-gray-400 ${size === 'sm' ? 'text-xs' : 'text-xs'}`}>
              {Math.round(progress.progress)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// File Upload specific loading indicator
interface FileUploadLoadingProps {
  progress?: ProgressState['fileUpload'];
  className?: string;
}

export const FileUploadLoading: React.FC<FileUploadLoadingProps> = ({ 
  progress,
  className = '' 
}) => {
  if (!progress) return null;

  const percentComplete = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="w-6 h-6 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-blue-900">
            Uploading Files...
          </div>
          
          {progress.filename && (
            <div className="text-xs text-blue-600 truncate mt-1">
              {progress.filename}
            </div>
          )}
          
          {/* Upload Progress Bar */}
          <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-blue-500 mt-1">
            <span>{progress.current} of {progress.total} files</span>
            <span>{percentComplete}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Inline loading spinner for buttons
interface InlineLoadingProps {
  loading: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({ 
  loading, 
  size = 'sm',
  className = '' 
}) => {
  if (!loading) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-current ${sizeClasses[size]} ${className}`} />
  );
};

// Full screen loading overlay
interface LoadingOverlayProps {
  visible: boolean;
  operation?: string;
  progress?: ProgressState['analysis'];
  onCancel?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  operation = 'Processing',
  progress,
  onCancel
}) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <LoadingIndicator
          state="loading"
          progress={progress}
          operation={operation}
          size="lg"
          className="mb-4"
        />
        
        {onCancel && (
          <div className="flex justify-center pt-4 border-t">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingIndicator;