import React, { useState, useCallback, useMemo, memo } from 'react';
import { FaHeart, FaSearch, FaStar } from 'react-icons/fa';

interface Sample {
  filename: string;
  name?: string;
  score?: number;
  starred?: boolean;
  isFavorite?: boolean;
  x?: number[];
  y?: number[];
}

interface SampleSidebarProps {
  samples: Sample[];
  selectedSampleName?: string;
  onSelectSample: (filename: string) => void;
  onRemoveSample: (filename: string) => void;
  onToggleFavorite: (filename: string) => void;
  statusFilter?: 'all' | 'good' | 'warning' | 'critical';
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  starredOnly?: boolean;
  onStarredOnlyChange?: (starred: boolean) => void;
  sortBy?: 'recent' | 'name' | 'score';
  onSortByChange?: (sortBy: 'recent' | 'name' | 'score') => void;
}

// Status determination function
const getSampleStatus = (score: number | undefined): 'critical' | 'warning' | 'good' => {
  if (score === undefined) return 'good';
  if (score <= 70) return 'critical';
  if (score <= 85) return 'warning';
  return 'good';
};

// Sample card component with memo for performance
const SampleCard = memo<{ 
  sample: Sample; 
  isSelected: boolean;
  onSelect: (filename: string) => void;
  onToggleFavorite: (filename: string) => void;
}>(({ sample, isSelected, onSelect, onToggleFavorite }) => {
  const status = getSampleStatus(sample.score);
  
  const statusColors = {
    critical: 'bg-red-50 border-red-200 hover:bg-red-100',
    warning: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    good: 'bg-white border-gray-200 hover:bg-gray-50'
  };

  const scoreColors = {
    critical: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    good: 'bg-green-500 text-white'
  };

  const handleSelect = useCallback(() => {
    onSelect(sample.filename);
  }, [onSelect, sample.filename]);

  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(sample.filename);
  }, [onToggleFavorite, sample.filename]);

  return (
    <div
      onClick={handleSelect}
      className={`
        ${statusColors[status]} 
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
        p-3 border rounded-md cursor-pointer transition-all group m-2
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            {(sample.starred || sample.isFavorite) && (
              <FaHeart className="w-3 h-3 text-red-500 flex-shrink-0" />
            )}
            {sample.score !== undefined && (
              <span className={`${scoreColors[status]} px-2 py-1 rounded text-xs font-bold flex-shrink-0`}>
                {Math.round(sample.score)}
              </span>
            )}
            <span className="text-sm font-medium text-gray-700 truncate">
              {sample.name || sample.filename?.replace('.csv', '')}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {sample.x?.length || 0} data points
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleToggleFavorite}
            className={`p-1 rounded hover:bg-gray-200 ${
              (sample.starred || sample.isFavorite) ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            <FaStar className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
});

SampleCard.displayName = 'SampleCard';



const SampleSidebar: React.FC<SampleSidebarProps> = memo(({
  samples,
  selectedSampleName,
  onSelectSample,
  onToggleFavorite,
  statusFilter = 'all',
  searchTerm = '',
  onSearchChange,
  starredOnly = false,
  onStarredOnlyChange,
  sortBy = 'recent',
  onSortByChange
}) => {
  // Local state fallbacks if props not controlled
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [localStarredOnly, setLocalStarredOnly] = useState(false);
  const [localSortBy, setLocalSortBy] = useState<'recent' | 'name' | 'score'>('recent');

  // Use controlled props or local state
  const effectiveSearchTerm = onSearchChange ? searchTerm : localSearchTerm;
  const effectiveStarredOnly = onStarredOnlyChange ? starredOnly : localStarredOnly;
  const effectiveSortBy = onSortByChange ? sortBy : localSortBy;

  // Memoize event handlers
  const handleSearchChange = useCallback((term: string) => {
    if (onSearchChange) {
      onSearchChange(term);
    } else {
      setLocalSearchTerm(term);
    }
  }, [onSearchChange]);

  const handleStarredOnlyChange = useCallback((starred: boolean) => {
    if (onStarredOnlyChange) {
      onStarredOnlyChange(starred);
    } else {
      setLocalStarredOnly(starred);
    }
  }, [onStarredOnlyChange]);

  const handleSortByChange = useCallback((sort: 'recent' | 'name' | 'score') => {
    if (onSortByChange) {
      onSortByChange(sort);
    } else {
      setLocalSortBy(sort);
    }
  }, [onSortByChange]);

  // Process and filter samples
  const processedSamples = useMemo(() => {
    return samples
      .filter(sample => {
        // Search filter
        if (effectiveSearchTerm) {
          const name = sample.name || sample.filename || '';
          if (!name.toLowerCase().includes(effectiveSearchTerm.toLowerCase())) {
            return false;
          }
        }
        
        // Starred filter
        if (effectiveStarredOnly && !(sample.starred || sample.isFavorite)) {
          return false;
        }
        
        // Status filter
        if (statusFilter !== 'all') {
          const sampleStatus = getSampleStatus(sample.score);
          if (statusFilter !== sampleStatus) {
            return false;
          }
        }
        
        return true;
      })
      .sort((a, b) => {
        switch (effectiveSortBy) {
          case 'name':
            const aName = a.name || a.filename || '';
            const bName = b.name || b.filename || '';
            return aName.localeCompare(bName);
          case 'score':
            return (b.score || 0) - (a.score || 0);
          case 'recent':
          default:
            return 0;
        }
      });
  }, [samples, effectiveSearchTerm, effectiveStarredOnly, statusFilter, effectiveSortBy]);

  // Group samples by status
  const groupedSamples = useMemo(() => ({
    critical: processedSamples.filter(s => getSampleStatus(s.score) === 'critical'),
    warning: processedSamples.filter(s => getSampleStatus(s.score) === 'warning'),
    good: processedSamples.filter(s => getSampleStatus(s.score) === 'good'),
  }), [processedSamples]);



  const totalSamples = processedSamples.length;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Samples ({totalSamples})
        </h2>

        {/* Search */}
        <div className="relative mb-3">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search samples..."
            value={effectiveSearchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 mb-3">
          <button
            onClick={() => handleStarredOnlyChange(!effectiveStarredOnly)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              effectiveStarredOnly
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            <FaStar className="w-3 h-3 inline mr-1" />
            Starred
          </button>

          <select
            value={effectiveSortBy}
            onChange={(e) => handleSortByChange(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="recent">Recent</option>
            <option value="name">Name</option>
            <option value="score">Score</option>
          </select>
        </div>

        {/* Status summary */}
        <div className="flex items-center space-x-4 text-xs">
          <span className="text-red-600 font-medium">
            Critical: {groupedSamples.critical.length}
          </span>
          <span className="text-yellow-600 font-medium">
            Warning: {groupedSamples.warning.length}
          </span>
          <span className="text-green-600 font-medium">
            Good: {groupedSamples.good.length}
          </span>
        </div>
      </div>

      {/* Sample List */}
      <div className="flex-1 overflow-y-auto">
        {totalSamples > 0 ? (
          <div className="space-y-1 p-2">
            {processedSamples.map((sample) => (
              <SampleCard
                key={sample.filename}
                sample={sample}
                isSelected={selectedSampleName === sample.filename}
                onSelect={onSelectSample}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <FaSearch className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No samples found</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

SampleSidebar.displayName = 'SampleSidebar';

export default SampleSidebar;