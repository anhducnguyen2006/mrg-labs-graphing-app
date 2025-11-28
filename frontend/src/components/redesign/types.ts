// Fixed types.ts - Centralized and consistent interfaces

export interface User {
  name: string;
  email: string;
  avatarUrl?: string;
}

// Unified Sample interface used across all components
export interface Sample {
  filename: string;
  name?: string;
  score?: number;
  starred?: boolean;
  isFavorite?: boolean; // Legacy compatibility
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

// Utility function to get sample status - centralized
export const getSampleStatus = (score: number | undefined): Status => {
  if (score === undefined) return 'good';
  if (score >= 90) return 'good';
  if (score >= 70) return 'warning';
  return 'critical';
};

// Component prop types with strict typing
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
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  starredOnly?: boolean;
  onStarredOnlyChange?: (starred: boolean) => void;
  sortBy?: 'recent' | 'name' | 'score';
  onSortByChange?: (sortBy: 'recent' | 'name' | 'score') => void;
}

export interface FTIRGraphProps {
  baseline?: ParsedCSV;
  sample?: Sample; // Use Sample instead of ParsedCSV for consistency
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
  onExport: (config: ExportConfig) => Promise<void>; // Make async
}

export interface WeightConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (weights: RangeWeight[]) => void;
  initialWeights?: RangeWeight[];
}

// Error handling types
export interface AnalysisError {
  code: 'INVALID_DATA' | 'CALCULATION_ERROR' | 'MISSING_BASELINE';
  message: string;
  details?: Record<string, unknown>;
}

export type AnalysisResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: AnalysisError;
};