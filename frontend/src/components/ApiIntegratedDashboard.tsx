import React, { useState, useEffect } from 'react';
import { useFTIRAnalysis } from '../hooks/useFTIRAnalysis';
import { LoadingIndicator, LoadingOverlay, FileUploadLoading } from './LoadingIndicator';
import { ErrorDisplay } from './ErrorDisplay';
import { ftirApiHelpers } from '../services/ftirApi';
import { ScoringMethod, RangeWeight } from '../types/api';

// Sample integration showing how to use the API with the redesigned dashboard
export const ApiIntegratedDashboard: React.FC = () => {
  // Use the FTIR analysis hook
  const {
    loadingStates,
    progressState,
    error,
    analysisResults,
    analyzeSamples,
    calculateDeviation,
    clearError,
    cancelOperation
  } = useFTIRAnalysis();

  // Local state for dashboard
  const [baselineFile, setBaselineFile] = useState<File | null>(null);
  const [sampleFiles, setSampleFiles] = useState<File[]>([]);
  const [scoringMethod, setScoringMethod] = useState<ScoringMethod>('hybrid');
  const [zoneWeights] = useState<RangeWeight[]>(ftirApiHelpers.getDefaultZoneWeights());

  // Handle baseline upload
  const handleBaselineUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = ftirApiHelpers.validateFile(file);
      if (validation.valid) {
        setBaselineFile(file);
        clearError();
      } else {
        alert(validation.error);
      }
    }
  };

  // Handle sample uploads
  const handleSampleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles: File[] = [];
    
    for (const file of files) {
      const validation = ftirApiHelpers.validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        alert(`${file.name}: ${validation.error}`);
      }
    }
    
    setSampleFiles(prev => [...prev, ...validFiles]);
  };

  // Trigger analysis
  const handleAnalyze = async () => {
    if (!baselineFile || sampleFiles.length === 0) {
      alert('Please upload baseline and sample files');
      return;
    }

    try {
      await analyzeSamples({
        baseline: baselineFile,
        samples: sampleFiles,
        scoringMethod,
        zoneWeights
      });
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  // Format results for display
  const getResultsSummary = () => {
    if (!analysisResults) return null;

    const scores = Object.entries(analysisResults.scores);
    const summary = scores.reduce(
      (acc, [filename, score]) => {
        const status = ftirApiHelpers.getScoreStatus(score);
        acc[status]++;
        return acc;
      },
      { good: 0, warning: 0, critical: 0 }
    );

    return { scores, summary };
  };

  const resultsSummary = getResultsSummary();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          FTIR Analysis Dashboard - API Integration Demo
        </h1>

        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <ErrorDisplay
              error={error}
              onDismiss={clearError}
              onRetry={handleAnalyze}
            />
          </div>
        )}

        {/* File Upload Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Baseline Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Baseline File
            </label>
            <input
              type="file"
              accept=".csv,.txt,.dat"
              onChange={handleBaselineUpload}
              disabled={loadingStates.analysis === 'loading'}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {baselineFile && (
              <div className="text-sm text-gray-600">
                Selected: {baselineFile.name}
              </div>
            )}
          </div>

          {/* Sample Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Sample Files
            </label>
            <input
              type="file"
              accept=".csv,.txt,.dat"
              multiple
              onChange={handleSampleUpload}
              disabled={loadingStates.analysis === 'loading'}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            {sampleFiles.length > 0 && (
              <div className="text-sm text-gray-600">
                {sampleFiles.length} file(s) selected
              </div>
            )}
          </div>
        </div>

        {/* Configuration Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scoring Method
          </label>
          <select
            value={scoringMethod}
            onChange={(e) => setScoringMethod(e.target.value as ScoringMethod)}
            disabled={loadingStates.analysis === 'loading'}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="hybrid">Hybrid (Recommended)</option>
            <option value="rmse">RMSE</option>
            <option value="pearson">Pearson Correlation</option>
            <option value="area">Area Difference</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={handleAnalyze}
            disabled={!baselineFile || sampleFiles.length === 0 || loadingStates.analysis === 'loading'}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span>Analyze Samples</span>
            {loadingStates.analysis === 'loading' && (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            )}
          </button>

          {loadingStates.analysis === 'loading' && (
            <button
              onClick={cancelOperation}
              className="text-gray-600 hover:text-gray-800 px-4 py-2"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Loading Display */}
        {loadingStates.analysis === 'loading' && (
          <div className="mb-6">
            <LoadingIndicator
              state={loadingStates.analysis}
              progress={progressState.analysis}
              operation="Analyzing FTIR Data"
            />
          </div>
        )}

        {/* File Upload Progress */}
        {loadingStates.fileUpload === 'loading' && progressState.fileUpload && (
          <div className="mb-6">
            <FileUploadLoading progress={progressState.fileUpload} />
          </div>
        )}

        {/* Results Section */}
        {resultsSummary && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Analysis Results</h2>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {resultsSummary.scores.length}
                </div>
                <div className="text-sm text-gray-600">Total Samples</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {resultsSummary.summary.good}
                </div>
                <div className="text-sm text-green-700">Good (≥90%)</div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {resultsSummary.summary.warning}
                </div>
                <div className="text-sm text-yellow-700">Warning (70-89%)</div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {resultsSummary.summary.critical}
                </div>
                <div className="text-sm text-red-700">Critical (&lt;70%)</div>
              </div>
            </div>

            {/* Individual Results */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Sample Scores</h3>
              <div className="space-y-2">
                {resultsSummary.scores.map(([filename, score]) => {
                  const status = ftirApiHelpers.getScoreStatus(score);
                  const statusColors = {
                    good: 'text-green-600 bg-green-100',
                    warning: 'text-yellow-600 bg-yellow-100',
                    critical: 'text-red-600 bg-red-100'
                  };

                  return (
                    <div key={filename} className="flex items-center justify-between p-3 bg-white rounded border">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {filename}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold">
                          {score.toFixed(1)}%
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}>
                          {status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Processing Time */}
            {analysisResults && (
              <div className="text-sm text-gray-600">
                Processing completed in {ftirApiHelpers.formatProcessingTime(analysisResults.processingTime)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      <LoadingOverlay
        visible={loadingStates.analysis === 'loading'}
        operation="Analyzing FTIR Data"
        progress={progressState.analysis}
        onCancel={cancelOperation}
      />
    </div>
  );
};

export default ApiIntegratedDashboard;