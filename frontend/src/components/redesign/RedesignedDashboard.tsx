import React, { useState, useEffect, useMemo } from 'react';
import TopBar from './TopBar';
import StatusPills from './StatusPills';
import SampleSidebar from './SampleSidebar';
import ScoreCard from './ScoreCard';
import FTIRGraph from './FTIRGraph_fixed';
import DeviationHeatmap from './DeviationHeatmap';
import ExportModal from './ExportModal';
import WeightConfigModal from './WeightConfigModal';
import FileUploadBox from '../FileUploadBox';
import { FTIRAnalysisService } from '../../services/ftirAnalysis_fixed';

// Types
interface User {
  name: string;
  email: string;
  avatarUrl?: string;
}

interface Sample {
  filename: string;
  score?: number;
  isFavorite?: boolean;
  x: number[];
  y: number[];
  rawContent: string;
}

interface ParsedCSV {
  filename: string;
  x: number[];
  y: number[];
  rawContent: string;
}

interface RangeWeight {
  min: number;
  max: number;
  weight: number;
  label: string;
  key: string;
}

type ScoringMethod = 'hybrid' | 'rmse' | 'pearson' | 'area';
type StatusFilter = 'all' | 'good' | 'warning' | 'critical';

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
  // State management - this would be lifted up or managed by a state management library
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



  // Calculate status counts
  const getSampleStatus = (score?: number): 'good' | 'warning' | 'critical' => {
    if (score === undefined) return 'good';
    if (score >= 90) return 'good';
    if (score >= 70) return 'warning';
    return 'critical';
  };

  const goodCount = samples.filter(s => getSampleStatus(s.score) === 'good').length;
  const warningCount = samples.filter(s => getSampleStatus(s.score) === 'warning').length;
  const criticalCount = samples.filter(s => getSampleStatus(s.score) === 'critical').length;

  // Get current sample data
  const currentSample = samples.find(s => s.filename === selectedSample) || samples[0];
  const currentSampleFile = sampleFiles && selectedSample 
    ? Array.from(sampleFiles).find(file => file.name === selectedSample)
    : undefined;

  // Event handlers
  const handleStatusClick = (status: 'good' | 'warning' | 'critical') => {
    setStatusFilter(statusFilter === status ? 'all' : status);
  };

  const handleExport = () => {
    setIsExportOpen(true);
  };

  const handleExportConfig = async (config: any) => {
    // TODO: Implement export logic
    console.log('Export config:', config);
    setIsExportOpen(false);
  };

  const handleScoringMethodChange = (method: ScoringMethod) => {
    setScoringMethod(method);
    // TODO: Recalculate scores with new method
  };

  const handleConfigureWeights = () => {
    setIsWeightOpen(true);
  };

  const handleSaveWeights = (weights: RangeWeight[]) => {
    setAbnormalityWeights(weights);
    // TODO: Recalculate scores with new weights
    setIsWeightOpen(false);
  };

  const handleRemoveSample = (filename: string) => {
    const updatedSamples = samples.filter(s => s.filename !== filename);
    setSamples(updatedSamples);

    // Update selected sample
    if (selectedSample === filename) {
      setSelectedSample(updatedSamples.length > 0 ? updatedSamples[0].filename : undefined);
    }

    // Clean up score
    const updatedScores = { ...sampleScores };
    delete updatedScores[filename];
    setSampleScores(updatedScores);
  };

  const handleToggleFavorite = (filename: string) => {
    const updatedSamples = samples.map(sample =>
      sample.filename === filename
        ? { ...sample, isFavorite: !sample.isFavorite }
        : sample
    );
    setSamples(updatedSamples);
  };

  const handleBaselineUpload = (files: ParsedCSV[], raw: FileList) => {
    setBaselineParsed(files[0]);
    setBaselineFile(raw[0]);
    setSampleScores({}); // Clear scores when baseline changes
  };

  const handleSampleUpload = (files: ParsedCSV[], raw: FileList) => {
    const samplesWithDefaults: Sample[] = files.map(file => ({
      ...file,
      score: undefined,
      isFavorite: false,
    }));
    
    setSamples(samplesWithDefaults);
    setSampleFiles(raw);
    setSampleScores({});
    
    // Set selected sample
    if (samplesWithDefaults.length > 0) {
      setSelectedSample(samplesWithDefaults[0].filename);
    } else {
      setSelectedSample(undefined);
    }
  };

  // Run analysis when baseline and samples change
  useEffect(() => {
    if (baselineParsed && samples.length > 0) {
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
    }
  }, [baselineParsed, samples.length, scoringMethod, abnormalityWeights, selectedSample]);

  // Calculate deviation data for current sample
  const deviationData = useMemo(() => {
    if (currentSample && baselineParsed) {
      return FTIRAnalysisService.calculateDeviationData(
        baselineParsed,
        samples,
        selectedSample,
        abnormalityWeights,
        scoringMethod
      ) || { x: [], deviation: [], maxDeviation: 0, avgDeviation: 0 };
    }
    return { x: [], deviation: [], maxDeviation: 0, avgDeviation: 0 };
  }, [currentSample, baselineParsed, samples, selectedSample, abnormalityWeights, scoringMethod]);

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <TopBar
        good={goodCount}
        warning={warningCount}
        critical={criticalCount}
        onStatusClick={handleStatusClick}
        onExport={handleExport}
        user={user}
        onChangePasswordClick={onChangePasswordClick}
        onLogoutClick={onLogoutClick}
      />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <SampleSidebar
          samples={samples}
          selectedSampleName={selectedSample}
          onSelectSample={setSelectedSample}
          onRemoveSample={handleRemoveSample}
          onToggleFavorite={handleToggleFavorite}
          statusFilter={statusFilter}
        />

        {/* Main Panel */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* File Upload Section */}
            <div className="grid grid-cols-2 gap-4">
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
                score={sampleScores[currentSample.filename] || 85} // Mock score
                uploadDate="Nov 28, 2025 10:45 AM" // Mock date
                dataPoints={currentSample.x.length}
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