# Complete API Integration Plan for FTIR Dashboard

## Overview
This document outlines the complete API integration plan for connecting the redesigned FTIR dashboard to the backend analysis service. It includes API routes, payload shapes, response types, error handling, state management, and loading UI states.

## Backend API Extensions Required

### 1. FTIR Analysis Endpoints

#### 1.1 Analyze Samples Endpoint
```python
# New endpoint needed in backend/graph_analysis.py

@router.post("/ftir/analyze")
async def analyze_ftir_samples(
    baseline: UploadFile = File(...),
    samples: List[UploadFile] = File(...),
    scoring_method: str = Form("hybrid"),
    zone_weights: Optional[str] = Form(None),  # JSON string
    user_id: int = Depends(get_current_user_id)
):
    """
    Analyze FTIR samples against baseline using specified scoring method
    Returns scores and deviation data for all samples
    """
```

#### 1.2 Calculate Deviations Endpoint  
```python
@router.post("/ftir/deviation")
async def calculate_deviation_data(
    baseline: UploadFile = File(...),
    sample: UploadFile = File(...),
    zone_weights: Optional[str] = Form(None),
    user_id: int = Depends(get_current_user_id)
):
    """
    Calculate spectral deviation data for a single sample vs baseline
    Returns heatmap visualization data
    """
```

#### 1.3 Batch Score Calculation
```python
@router.post("/ftir/scores")
async def calculate_sample_scores(
    baseline: UploadFile = File(...),
    samples: List[UploadFile] = File(...),
    scoring_method: str = Form("hybrid"),
    zone_weights: Optional[str] = Form(None),
    user_id: int = Depends(get_current_user_id)
):
    """
    Calculate scores only (no deviation data) for batch processing
    Optimized for scenarios where only scores are needed
    """
```

### 2. Analysis Configuration Endpoints

#### 2.1 Save Analysis Configuration
```python
@router.post("/ftir/config/save")
async def save_analysis_config(
    config_name: str = Form(...),
    zone_weights: str = Form(...),  # JSON
    scoring_method: str = Form(...),
    user_id: int = Depends(get_current_user_id)
):
    """Save analysis configuration for reuse"""
```

#### 2.2 Load User Configurations
```python
@router.get("/ftir/config/list")
async def list_user_configs(
    user_id: int = Depends(get_current_user_id)
):
    """List saved analysis configurations for user"""
```

### 3. Analysis History Endpoints

#### 3.1 Save Analysis Session
```python
@router.post("/ftir/sessions/save")
async def save_analysis_session(
    session_data: dict,
    user_id: int = Depends(get_current_user_id)
):
    """Save complete analysis session for later review"""
```

#### 3.2 Get Analysis History
```python
@router.get("/ftir/sessions/history")
async def get_analysis_history(
    page: int = 1,
    limit: int = 20,
    user_id: int = Depends(get_current_user_id)
):
    """Get paginated analysis history"""
```

## Frontend API Integration

### API Service Layer (`services/api.ts`)

```typescript
import axios, { AxiosResponse } from 'axios';

// Base configuration
const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30 second timeout for file uploads
  withCredentials: true,
});

// Request interceptor for auth
api.interceptors.request.use((config) => {
  // Add any auth headers if needed
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### FTIR Analysis Service (`services/ftirApi.ts`)

```typescript
import api from './api';
import { AnalysisRequest, AnalysisResponse, DeviationRequest, DeviationResponse, ScoresRequest, ScoresResponse } from '../types/api';

export class FTIRApiService {
  
  /**
   * Analyze FTIR samples with full analysis
   */
  static async analyzeSamples(request: AnalysisRequest): Promise<AnalysisResponse> {
    const formData = new FormData();
    
    formData.append('baseline', request.baseline);
    request.samples.forEach(sample => formData.append('samples', sample));
    formData.append('scoring_method', request.scoringMethod);
    
    if (request.zoneWeights) {
      formData.append('zone_weights', JSON.stringify(request.zoneWeights));
    }

    const response = await api.post<AnalysisResponse>('/analysis/ftir/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response.data;
  }

  /**
   * Calculate deviation data for single sample
   */
  static async calculateDeviation(request: DeviationRequest): Promise<DeviationResponse> {
    const formData = new FormData();
    
    formData.append('baseline', request.baseline);
    formData.append('sample', request.sample);
    
    if (request.zoneWeights) {
      formData.append('zone_weights', JSON.stringify(request.zoneWeights));
    }

    const response = await api.post<DeviationResponse>('/analysis/ftir/deviation', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response.data;
  }

  /**
   * Calculate scores only (batch processing)
   */
  static async calculateScores(request: ScoresRequest): Promise<ScoresResponse> {
    const formData = new FormData();
    
    formData.append('baseline', request.baseline);
    request.samples.forEach(sample => formData.append('samples', sample));
    formData.append('scoring_method', request.scoringMethod);
    
    if (request.zoneWeights) {
      formData.append('zone_weights', JSON.stringify(request.zoneWeights));
    }

    const response = await api.post<ScoresResponse>('/analysis/ftir/scores', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response.data;
  }

  /**
   * Save analysis configuration
   */
  static async saveConfiguration(config: {
    name: string;
    zoneWeights: RangeWeight[];
    scoringMethod: ScoringMethod;
  }) {
    const formData = new FormData();
    formData.append('config_name', config.name);
    formData.append('zone_weights', JSON.stringify(config.zoneWeights));
    formData.append('scoring_method', config.scoringMethod);

    const response = await api.post('/analysis/ftir/config/save', formData);
    return response.data;
  }

  /**
   * Load user configurations
   */
  static async loadConfigurations() {
    const response = await api.get('/analysis/ftir/config/list');
    return response.data;
  }

  /**
   * Save analysis session
   */
  static async saveSession(sessionData: AnalysisSession) {
    const response = await api.post('/analysis/ftir/sessions/save', sessionData);
    return response.data;
  }

  /**
   * Get analysis history
   */
  static async getHistory(page: number = 1, limit: number = 20) {
    const response = await api.get(`/analysis/ftir/sessions/history?page=${page}&limit=${limit}`);
    return response.data;
  }
}
```

## TypeScript Type Definitions

### API Request/Response Types (`types/api.ts`)

```typescript
export interface RangeWeight {
  min: number;
  max: number;
  weight: number;
  label: string;
  key: string;
}

export type ScoringMethod = 'rmse' | 'hybrid' | 'pearson' | 'area';

// Request Types
export interface AnalysisRequest {
  baseline: File;
  samples: File[];
  scoringMethod: ScoringMethod;
  zoneWeights?: RangeWeight[];
}

export interface DeviationRequest {
  baseline: File;
  sample: File;
  zoneWeights?: RangeWeight[];
}

export interface ScoresRequest {
  baseline: File;
  samples: File[];
  scoringMethod: ScoringMethod;
  zoneWeights?: RangeWeight[];
}

// Response Types
export interface SampleScore {
  filename: string;
  score: number;
  status: 'good' | 'warning' | 'critical';
}

export interface DeviationData {
  x: number[];
  deviation: number[];
  maxDeviation: number;
  avgDeviation: number;
}

export interface AnalysisResponse {
  success: boolean;
  scores: { [filename: string]: number };
  deviationData?: DeviationData;
  processingTime: number;
  metadata: {
    baseline_filename: string;
    sample_count: number;
    scoring_method: ScoringMethod;
    zone_weights_used: RangeWeight[];
    timestamp: string;
  };
}

export interface DeviationResponse {
  success: boolean;
  deviationData: DeviationData;
  sampleInfo: {
    filename: string;
    dataPoints: number;
    wavelengthRange: [number, number];
  };
  processingTime: number;
}

export interface ScoresResponse {
  success: boolean;
  scores: { [filename: string]: number };
  summary: {
    totalSamples: number;
    good: number;
    warning: number;
    critical: number;
  };
  processingTime: number;
}

// Error Response
export interface ApiError {
  success: false;
  error: string;
  errorCode?: string;
  details?: any;
  timestamp: string;
}

// Configuration Types
export interface AnalysisConfiguration {
  id: string;
  name: string;
  zoneWeights: RangeWeight[];
  scoringMethod: ScoringMethod;
  createdAt: string;
  updatedAt: string;
}

// Session Types
export interface AnalysisSession {
  id?: string;
  name?: string;
  baselineInfo: {
    filename: string;
    uploadedAt: string;
  };
  samples: Array<{
    filename: string;
    score?: number;
    uploadedAt: string;
  }>;
  configuration: {
    scoringMethod: ScoringMethod;
    zoneWeights: RangeWeight[];
  };
  results: {
    scores: { [filename: string]: number };
    summary: {
      good: number;
      warning: number;
      critical: number;
    };
  };
  createdAt: string;
}
```

### Loading States (`types/loading.ts`)

```typescript
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingStates {
  fileUpload: LoadingState;
  analysis: LoadingState;
  deviation: LoadingState;
  configSave: LoadingState;
  configLoad: LoadingState;
  sessionSave: LoadingState;
  historyLoad: LoadingState;
}

export interface ProgressState {
  fileUpload?: {
    current: number;
    total: number;
    filename?: string;
  };
  analysis?: {
    stage: 'parsing' | 'calculating' | 'processing' | 'complete';
    progress: number; // 0-100
    currentSample?: string;
  };
}
```

## State Management Integration

### Enhanced Dashboard State (`hooks/useFTIRAnalysis.ts`)

```typescript
import { useState, useCallback, useEffect } from 'react';
import { FTIRApiService } from '../services/ftirApi';
import { LoadingStates, ProgressState, AnalysisResponse, SampleScore } from '../types';

export const useFTIRAnalysis = () => {
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    fileUpload: 'idle',
    analysis: 'idle',
    deviation: 'idle',
    configSave: 'idle',
    configLoad: 'idle',
    sessionSave: 'idle',
    historyLoad: 'idle',
  });

  const [progressState, setProgressState] = useState<ProgressState>({});
  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResponse | null>(null);

  // Set loading state for specific operation
  const setLoadingState = useCallback((operation: keyof LoadingStates, state: LoadingState) => {
    setLoadingStates(prev => ({ ...prev, [operation]: state }));
  }, []);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  // Analyze samples
  const analyzeSamples = useCallback(async (request: AnalysisRequest) => {
    try {
      setLoadingState('analysis', 'loading');
      setProgressState(prev => ({ 
        ...prev, 
        analysis: { stage: 'parsing', progress: 0 } 
      }));
      clearError();

      const response = await FTIRApiService.analyzeSamples(request);
      
      setAnalysisResults(response);
      setLoadingState('analysis', 'success');
      setProgressState(prev => ({ 
        ...prev, 
        analysis: { stage: 'complete', progress: 100 } 
      }));
      
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Analysis failed';
      setError(errorMessage);
      setLoadingState('analysis', 'error');
      throw err;
    }
  }, [setLoadingState, clearError]);

  // Calculate deviation data
  const calculateDeviation = useCallback(async (request: DeviationRequest) => {
    try {
      setLoadingState('deviation', 'loading');
      clearError();

      const response = await FTIRApiService.calculateDeviation(request);
      setLoadingState('deviation', 'success');
      
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Deviation calculation failed';
      setError(errorMessage);
      setLoadingState('deviation', 'error');
      throw err;
    }
  }, [setLoadingState, clearError]);

  // Calculate scores only
  const calculateScores = useCallback(async (request: ScoresRequest) => {
    try {
      setLoadingState('analysis', 'loading');
      setProgressState(prev => ({ 
        ...prev, 
        analysis: { stage: 'calculating', progress: 50 } 
      }));
      clearError();

      const response = await FTIRApiService.calculateScores(request);
      setLoadingState('analysis', 'success');
      setProgressState(prev => ({ 
        ...prev, 
        analysis: { stage: 'complete', progress: 100 } 
      }));
      
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Score calculation failed';
      setError(errorMessage);
      setLoadingState('analysis', 'error');
      throw err;
    }
  }, [setLoadingState, clearError]);

  return {
    loadingStates,
    progressState,
    error,
    analysisResults,
    analyzeSamples,
    calculateDeviation,
    calculateScores,
    clearError,
  };
};
```

## Loading UI Components

### Loading Indicator Component (`components/LoadingIndicator.tsx`)

```typescript
import React from 'react';
import { LoadingState, ProgressState } from '../types/loading';

interface LoadingIndicatorProps {
  state: LoadingState;
  progress?: ProgressState['analysis'];
  operation?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  state,
  progress,
  operation = 'Processing',
  size = 'md'
}) => {
  if (state !== 'loading') return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Spinner */}
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
      
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900">
          {operation}...
        </div>
        
        {progress && (
          <>
            <div className="text-xs text-gray-500 capitalize">
              {progress.stage}
              {progress.currentSample && ` (${progress.currentSample})`}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            
            <div className="text-xs text-gray-400 mt-1">
              {progress.progress}%
            </div>
          </>
        )}
      </div>
    </div>
  );
};
```

### File Upload Loading (`components/FileUploadLoading.tsx`)

```typescript
import React from 'react';
import { ProgressState } from '../types/loading';

interface FileUploadLoadingProps {
  progress?: ProgressState['fileUpload'];
}

export const FileUploadLoading: React.FC<FileUploadLoadingProps> = ({ progress }) => {
  if (!progress) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center space-x-3">
        <div className="w-6 h-6 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
        
        <div className="flex-1">
          <div className="text-sm font-medium text-blue-900">
            Uploading Files...
          </div>
          
          {progress.filename && (
            <div className="text-xs text-blue-600">
              {progress.filename}
            </div>
          )}
          
          <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          
          <div className="text-xs text-blue-500 mt-1">
            {progress.current} of {progress.total} files
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Error Handling Components

### Error Display Component (`components/ErrorDisplay.tsx`)

```typescript
import React from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  error: string | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  title?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onDismiss,
  onRetry,
  title = 'Analysis Error'
}) => {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {title}
          </h3>
          <p className="text-sm text-red-700 mt-1">
            {error}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-red-600 hover:text-red-800 p-1 rounded"
              title="Retry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-600 p-1 rounded"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

## Integration with Redesigned Dashboard

### Updated Dashboard Component

The `RedesignedDashboard` component would be updated to use the API integration:

```typescript
// In RedesignedDashboard.tsx
import { useFTIRAnalysis } from '../hooks/useFTIRAnalysis';
import { LoadingIndicator } from './LoadingIndicator';
import { ErrorDisplay } from './ErrorDisplay';

export const RedesignedDashboard: React.FC<RedesignedDashboardProps> = (props) => {
  const {
    loadingStates,
    progressState,
    error,
    analyzeSamples,
    calculateDeviation,
    clearError
  } = useFTIRAnalysis();

  // Handle file upload and analysis
  const handleSampleUpload = async (files: ParsedCSV[], rawFiles: FileList) => {
    if (!baselineParsed) {
      setError('Please upload a baseline file first');
      return;
    }

    try {
      const baselineFile = baselineFile; // From state
      const sampleFiles = Array.from(rawFiles);

      const response = await analyzeSamples({
        baseline: baselineFile,
        samples: sampleFiles,
        scoringMethod,
        zoneWeights: abnormalityWeights
      });

      // Update local state with results
      setSampleScores(response.scores);
      // ... update other state
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Error Display */}
      {error && (
        <div className="p-4">
          <ErrorDisplay
            error={error}
            onDismiss={clearError}
            onRetry={() => {
              // Implement retry logic based on last operation
            }}
          />
        </div>
      )}

      {/* Loading Overlay */}
      {loadingStates.analysis === 'loading' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <LoadingIndicator
              state={loadingStates.analysis}
              progress={progressState.analysis}
              operation="Analyzing FTIR Data"
              size="lg"
            />
          </div>
        </div>
      )}

      {/* Rest of component... */}
    </div>
  );
};
```

## Backend Implementation Example

### Extended FTIR Analysis Router

```python
# backend/ftir_analysis.py (new file)
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from typing import List, Optional
import json
from datetime import datetime
import traceback

from .app import get_current_user_id
from .services.ftir_analysis_service import FTIRAnalysisService

router = APIRouter(prefix="/analysis/ftir", tags=["FTIR Analysis"])

@router.post("/analyze")
async def analyze_ftir_samples(
    baseline: UploadFile = File(...),
    samples: List[UploadFile] = File(...),
    scoring_method: str = Form("hybrid"),
    zone_weights: Optional[str] = Form(None),
    user_id: int = Depends(get_current_user_id)
):
    try:
        # Parse zone weights if provided
        weights = json.loads(zone_weights) if zone_weights else None
        
        # Process files and run analysis
        analysis_service = FTIRAnalysisService()
        results = await analysis_service.analyze_samples(
            baseline=baseline,
            samples=samples,
            scoring_method=scoring_method,
            zone_weights=weights
        )
        
        return {
            "success": True,
            "scores": results.scores,
            "deviationData": results.deviation_data,
            "processingTime": results.processing_time,
            "metadata": {
                "baseline_filename": baseline.filename,
                "sample_count": len(samples),
                "scoring_method": scoring_method,
                "zone_weights_used": weights or [],
                "timestamp": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Analysis failed: {str(e)}"
        )
```

This comprehensive API integration plan provides:

1. **Complete Backend Extensions** - New FTIR-specific endpoints
2. **Type-Safe Frontend Integration** - Full TypeScript support
3. **Robust Error Handling** - User-friendly error messages
4. **Loading States Management** - Progress indicators and feedback
5. **State Management Integration** - Hooks for dashboard state
6. **UI Components** - Loading indicators and error displays
7. **Production-Ready Structure** - Scalable and maintainable architecture

The integration maintains the existing analysis logic while providing a modern, robust API layer for the redesigned dashboard.