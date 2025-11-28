// Common types used across redesign components

export interface User {
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Sample {
  filename: string;
  score?: number;
  isFavorite?: boolean;
  x: number[];
  y: number[];
  rawContent: string;
}

export interface ParsedCSV {
  filename: string;
  x: number[];
  y: number[];
  rawContent: string;
}

export interface RangeWeight {
  min: number;
  max: number;
  weight: number;
  label: string;
  key: string;
}

export type ScoringMethod = 'hybrid' | 'rmse' | 'pearson' | 'area';
export type StatusFilter = 'all' | 'good' | 'warning' | 'critical';
export type Status = 'good' | 'warning' | 'critical';

// Component prop types
export interface StatusPillsProps {
  good: number;
  warning: number;
  critical: number;
  onStatusClick: (status: Status) => void;
}

export interface ScoreCardProps {
  sampleName: string;
  score: number; // 0-100
  uploadDate: string;
  dataPoints: number;
  scoringMethod: ScoringMethod;
  onMethodChange: (method: ScoringMethod) => void;
  onConfigure: () => void;
}

export interface SampleSidebarProps {
  samples: Sample[];
  selectedSampleName?: string;
  onSelectSample: (filename: string) => void;
  onRemoveSample: (filename: string) => void;
  onToggleFavorite: (filename: string) => void;
  statusFilter?: StatusFilter;
}

export interface FTIRGraphProps {
  baseline?: ParsedCSV;
  sample?: ParsedCSV;
  selectedSampleName?: string;
  onSelectSample?: (name: string) => void;
  className?: string;
}

export interface DeviationHeatmapProps {
  x: number[];
  deviation: number[];
  selectedSampleName?: string;
  maxDeviation?: number;
  avgDeviation?: number;
  abnormalityWeights?: RangeWeight[];
  onConfigureWeights: () => void;
  className?: string;
}

export interface ExportConfig {
  format: 'png' | 'jpeg';
  selectedSamples: string[];
  includeBaseline: boolean;
  includeHeatmap: boolean;
  includeStatistics: boolean;
}

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  samples: Sample[];
  onExport: (config: ExportConfig) => void;
}

export interface WeightConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (weights: RangeWeight[]) => void;
  initialWeights?: RangeWeight[];
}