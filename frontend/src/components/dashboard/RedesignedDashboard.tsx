// Fixed RedesignedDashboard with proper dependency management
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import TopBar from '../samples/TopBar';
import StatusPills from '../ftir/StatusPills';
import SampleSidebar from '../samples/SampleSidebar';
import ScoreCard from '../ftir/ScoreCard';
import FTIRGraph from '../ftir/FTIRGraph';
import DeviationHeatmap from '../ftir/DeviationHeatmap';
import ExportModal from '../modals/ExportModal';
import WeightConfigModal from '../modals/WeightConfigModal';
import FileUploadBox from './FileUploadBox';
import { FTIRAnalysisService } from '../../services/ftirAnalysis';
import { 
  User, 
  Sample, 
  ParsedCSV, 
  RangeWeight, 
  ScoringMethod, 
  StatusFilter,
  getSampleStatus 
} from '../../types';

interface RedesignedDashboardProps {
  // Props that would come from parent component
  user?: User;
  onChangePasswordClick?: () => void;
  onLogoutClick?: () => void;
}

const RedesignedDashboard: React.FC<RedesignedDashboardProps> = ({
  user,
  onChangePasswordClick,
  onLogoutClick,
}) => {
  // State management
  const [baselineParsed, setBaselineParsed] = useState<ParsedCSV | undefined>();
  const [baselineFile, setBaselineFile] = useState<File | undefined>();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [sampleFiles, setSampleFiles] = useState<FileList | undefined>();
  const [selectedSample, setSelectedSample] = useState<string | undefined>();
  const [sampleScores, setSampleScores] = useState<{ [filename: string]: number }>({});
  const [scoringMethod, setScoringMethod] = useState<ScoringMethod>('hybrid');
  const [abnormalityWeights, setAbnormalityWeights] = useState<RangeWeight[]>([
    { min: 4000, max: 2750, weight: 100, label: 'O-H, N-H stretch', key: 'oh-nh' },
    { min: 2750, max: 2000, weight: 100, label: 'C-H stretch', key: 'ch' },
    { min: 2000, max: 1750, weight: 100, label: 'C=C, C=N stretch', key: 'cc-cn' },
    { min: 1750, max: 550, weight: 100, label: 'Fingerprint region', key: 'fingerprint' }
  ]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
  // Modal states
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isWeightOpen, setIsWeightOpen] = useState(false);

  // Loading and error states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Refs to track dependency changes and prevent loops
  const abnormalityWeightsRef = useRef(abnormalityWeights);
  const samplesLengthRef = useRef(0);
  const baselineRef = useRef<ParsedCSV | undefined>(baselineParsed);

  // Update refs when values change
  useEffect(() => {
    abnormalityWeightsRef.current = abnormalityWeights;
  }, [abnormalityWeights]);

  useEffect(() => {
    samplesLengthRef.current = samples.length;
  }, [samples.length]);

  useEffect(() => {
    baselineRef.current = baselineParsed;
  }, [baselineParsed]);

  // Memoized status calculations to prevent re-renders
  const statusCounts = useMemo(() => {
    const goodCount = samples.filter(s => getSampleStatus(s.score) === 'good').length;
    const warningCount = samples.filter(s => getSampleStatus(s.score) === 'warning').length;
    const criticalCount = samples.filter(s => getSampleStatus(s.score) === 'critical').length;
    
    return { goodCount, warningCount, criticalCount };
  }, [samples]);

  // Get current sample data with error handling
  const currentSample = useMemo(() => {
    if (!samples.length) return undefined;
    return samples.find(s => s.filename === selectedSample) || samples[0];
  }, [samples, selectedSample]);

  const currentSampleFile = useMemo(() => {
    if (!sampleFiles || !selectedSample) return undefined;
    return Array.from(sampleFiles).find(file => file.name === selectedSample);
  }, [sampleFiles, selectedSample]);

  // Memoized event handlers to prevent unnecessary re-renders
  const handleStatusClick = useCallback((status: 'good' | 'warning' | 'critical') => {
    setStatusFilter(prev => prev === status ? 'all' : status);
  }, []);

  const handleExport = useCallback(() => {
    setIsExportOpen(true);
  }, []);

  const handleExportConfig = useCallback(async (config: any) => {
    try {
      console.log('Export config:', config);
      
      // Validate we have baseline and samples
      if (!baselineFile) {
        alert('Please upload a baseline file first');
        return;
      }

      if (!sampleFiles || sampleFiles.length === 0) {
        alert('Please upload sample files first');
        return;
      }

      // Get selected sample files based on config
      const selectedFiles = config.selectedSamples.map((filename: string) => {
        return Array.from(sampleFiles).find(f => f.name === filename);
      }).filter(Boolean) as File[];

      if (selectedFiles.length === 0) {
        alert('No valid samples selected for export');
        return;
      }

      // Import the API service
      const { FTIRApiService } = await import('../../services/ftirApi');

      // Call export API
      const blob = await FTIRApiService.exportGraphs({
        baseline: baselineFile,
        samples: selectedFiles,
        format: config.format,
        zipFilename: config.zipFilename,
      });

      // Download the blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = config.zipFilename ? 
        (config.zipFilename.endsWith('.zip') ? config.zipFilename : `${config.zipFilename}.zip`) : 
        'exported_graphs.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setIsExportOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export graphs. Please try again.');
    }
  }, [baselineFile, sampleFiles]);

  const handleScoringMethodChange = useCallback((method: ScoringMethod) => {
    setScoringMethod(method);
    // Clear existing scores to trigger recalculation
    setSampleScores({});
  }, []);

  const handleConfigureWeights = useCallback(() => {
    setIsWeightOpen(true);
  }, []);

  const handleSaveWeights = useCallback((weights: RangeWeight[]) => {
    setAbnormalityWeights(weights);
    // Clear scores to trigger recalculation with new weights
    setSampleScores({});
    setIsWeightOpen(false);
  }, []);

  const handleRemoveSample = useCallback((filename: string) => {
    setSamples(prev => {
      const updated = prev.filter(s => s.filename !== filename);
      
      // Update selected sample if it was removed
      if (selectedSample === filename) {
        setSelectedSample(updated.length > 0 ? updated[0].filename : undefined);
      }
      
      return updated;
    });

    // Clean up score
    setSampleScores(prev => {
      const updated = { ...prev };
      delete updated[filename];
      return updated;
    });
  }, [selectedSample]);

  const handleToggleFavorite = useCallback((filename: string) => {
    setSamples(prev => prev.map(sample =>
      sample.filename === filename
        ? { ...sample, isFavorite: !sample.isFavorite, starred: !sample.isFavorite }
        : sample
    ));
  }, []);

  const handleBaselineUpload = useCallback((files: ParsedCSV[], raw: FileList) => {
    if (files.length > 0) {
      setBaselineParsed(files[0]);
      setBaselineFile(raw[0]);
      setSampleScores({}); // Clear scores when baseline changes
      setAnalysisError(null);
    }
  }, []);

  const handleSampleUpload = useCallback((files: ParsedCSV[], raw: FileList) => {
    const samplesWithDefaults: Sample[] = files.map(file => ({
      ...file,
      score: undefined,
      isFavorite: false,
      starred: false,
    }));
    
    setSamples(samplesWithDefaults);
    setSampleFiles(raw);
    setSampleScores({});
    setAnalysisError(null);
    
    // Set selected sample
    if (samplesWithDefaults.length > 0) {
      setSelectedSample(samplesWithDefaults[0].filename);
    } else {
      setSelectedSample(undefined);
    }
  }, []);

  // Debounced analysis effect to prevent excessive calculations
  useEffect(() => {
    if (!baselineParsed || samples.length === 0) {
      setIsAnalyzing(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsAnalyzing(true);
      setAnalysisError(null);

      try {
        const analysisResults = FTIRAnalysisService.performAnalysis(
          baselineParsed,
          samples,
          selectedSample,
          abnormalityWeights,
          scoringMethod
        );
        
        setSampleScores(analysisResults.scores);
        
        // Update samples with calculated scores
        setSamples(prev => prev.map(sample => ({
          ...sample,
          score: analysisResults.scores[sample.filename]
        })));

      } catch (error) {
        console.error('Analysis failed:', error);
        setAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
      } finally {
        setIsAnalyzing(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [
    baselineParsed?.filename, // Only filename to prevent deep object comparison
    samples.length, // Only length, not full array
    scoringMethod,
    abnormalityWeights.map(w => `${w.min}-${w.max}-${w.weight}`).join(','), // Serialize weights
    selectedSample
  ]);

  // Calculate deviation data for current sample with error handling
  const deviationData = useMemo(() => {
    if (!currentSample || !baselineParsed || isAnalyzing) {
      return { x: [], deviation: [], maxDeviation: 0, avgDeviation: 0 };
    }

    try {
      return FTIRAnalysisService.calculateDeviationData(
        baselineParsed,
        samples,
        selectedSample,
        abnormalityWeights,
        scoringMethod
      ) || { x: [], deviation: [], maxDeviation: 0, avgDeviation: 0 };
    } catch (error) {
      console.error('Failed to calculate deviation data:', error);
      return { x: [], deviation: [], maxDeviation: 0, avgDeviation: 0 };
    }
  }, [currentSample?.filename, baselineParsed?.filename, selectedSample, abnormalityWeights, scoringMethod, isAnalyzing]);

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <TopBar
        good={statusCounts.goodCount}
        warning={statusCounts.warningCount}
        critical={statusCounts.criticalCount}
        onStatusClick={handleStatusClick}
        onExport={handleExport}
        user={user}
        onChangePasswordClick={onChangePasswordClick}
        onLogoutClick={onLogoutClick}
      />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 bg-white overflow-hidden">
          <SampleSidebar
            samples={samples}
            selectedSampleName={selectedSample}
            onSelectSample={setSelectedSample}
            onRemoveSample={handleRemoveSample}
            onToggleFavorite={handleToggleFavorite}
            statusFilter={statusFilter}
          />
        </div>

        {/* Main Panel */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Error Alert */}
            {analysisError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="text-red-400 mr-3">⚠️</div>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Analysis Error</h3>
                    <p className="text-sm text-red-700 mt-1">{analysisError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isAnalyzing && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                  <p className="text-sm text-blue-700">Analyzing spectra...</p>
                </div>
              </div>
            )}

            {/* File Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FileUploadBox
                label="Baseline CSV"
                multiple={false}
                acceptBaseline
                onFilesParsed={handleBaselineUpload}
              />
              <FileUploadBox
                label="Sample CSVs" 
                multiple
                onFilesParsed={handleSampleUpload}
              />
            </div>

            {/* Score Card */}
            {currentSample && (
              <ScoreCard
                sampleName={currentSample.filename}
                score={sampleScores[currentSample.filename] || 85}
                uploadDate="Nov 28, 2025 10:45 AM"
                dataPoints={currentSample.x?.length || 0}
                scoringMethod={scoringMethod}
                onMethodChange={handleScoringMethodChange}
                onConfigure={handleConfigureWeights}
              />
            )}

            {/* FTIR Graph */}
            <FTIRGraph
              baseline={baselineParsed}
              sample={currentSample}
              selectedSampleName={selectedSample}
              onSelectSample={setSelectedSample}
            />

            {/* Deviation Heatmap */}
            {deviationData.x.length > 0 && (
              <DeviationHeatmap
                x={deviationData.x}
                deviation={deviationData.deviation}
                selectedSampleName={selectedSample}
                abnormalityWeights={abnormalityWeights}
                onConfigureWeights={handleConfigureWeights}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        samples={samples}
        onExport={handleExportConfig}
        baselineFilename={baselineFile?.name}
      />

      <WeightConfigModal
        isOpen={isWeightOpen}
        onClose={() => setIsWeightOpen(false)}
        onSave={handleSaveWeights}
        initialWeights={abnormalityWeights}
      />
    </div>
  );
};

export default RedesignedDashboard;