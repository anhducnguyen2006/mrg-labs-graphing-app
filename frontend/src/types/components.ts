// Component prop types for redesigned dashboard components
import type { Sample, ParsedCSV, RangeWeight, ScoringMethod, StatusFilter, Status } from './common';

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
  onExport: (config: ExportConfig) => Promise<void>;
}

export interface WeightConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (weights: RangeWeight[]) => void;
  initialWeights?: RangeWeight[];
}
