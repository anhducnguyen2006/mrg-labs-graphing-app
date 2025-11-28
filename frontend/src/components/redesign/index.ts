export { default as TopBar } from './TopBar';
export { default as StatusPills } from './StatusPills';
export { default as SampleSidebar } from './SampleSidebar';
export { default as ScoreCard } from './ScoreCard';
export { default as FTIRGraph } from './FTIRGraph';
export { default as DeviationHeatmap } from './DeviationHeatmap';
export { default as ExportModal } from './ExportModal';
export { default as WeightConfigModal } from './WeightConfigModal';
export { default as RedesignedDashboard } from './RedesignedDashboard';

// Re-export types for easier importing
export type {
  StatusPillsProps,
  ScoreCardProps,
  SampleSidebarProps,
  FTIRGraphProps,
  DeviationHeatmapProps,
  ExportModalProps,
  WeightConfigModalProps,
} from './types';

// Constants
export const DESIGN_TOKENS = {
  colors: {
    good: '#10B981',
    warning: '#F59E0B',
    critical: '#EF4444',
    primary: '#3B82F6',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    bgBase: '#FFFFFF',
    bgAlt: '#F9FAFB',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
  },
  heights: {
    topbar: '60px',
    scorecard: '240px',
    graph: '700px',
    heatmap: '250px',
  },
  widths: {
    sidebar: '280px',
  },
} as const;