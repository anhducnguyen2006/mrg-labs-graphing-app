import React, { useState, memo, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { FaHeart, FaSearch, FaStar, FaFilter, FaSort, FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { FiHeart } from 'react-icons/fi';

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
}

type SortOption = 'recent' | 'name' | 'score';

// Memoize status calculation to avoid recalculation
const getSampleStatus = (score?: number): 'good' | 'warning' | 'critical' => {
  if (score === undefined) return 'good';
  if (score >= 90) return 'good';
  if (score >= 70) return 'warning';
  return 'critical';
};

const SampleSidebar: React.FC<SampleSidebarProps> = memo(({
  samples,
  selectedSampleName,
  onSelectSample,
  onRemoveSample,
  onToggleFavorite,
  statusFilter = 'all',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [starredOnly, setStarredOnly] = useState(false);

  // Memoize event handlers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortOption);
  }, []);

  const handleStarredToggle = useCallback(() => {
    setStarredOnly(!starredOnly);
  }, [starredOnly]);

  // Memoize filtered and sorted samples
  const processedSamples = useMemo(() => {
    // Filter samples
    let filtered = samples.filter(sample => {
      // Search filter
      if (searchTerm && !sample.filename.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Starred filter
      if (starredOnly && !sample.isFavorite) {
        return false;
      }

      // Status filter (from top bar status pills)
      if (statusFilter !== 'all') {
        const sampleStatus = getSampleStatus(sample.score);
        if (sampleStatus !== statusFilter) {
          return false;
        }
      }

      return true;
    });

    // Sort samples
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.filename.localeCompare(b.filename);
        case 'score':
          return (b.score || 0) - (a.score || 0);
        case 'recent':
        default:
          // Assume samples array order represents recency
          return 0;
      }
    });
  }, [samples, searchTerm, starredOnly, statusFilter, sortBy]);

  // Memoize grouped samples
  const groupedSamples = useMemo(() => ({
    critical: processedSamples.filter(s => getSampleStatus(s.score) === 'critical'),
    warning: processedSamples.filter(s => getSampleStatus(s.score) === 'warning'),
    good: processedSamples.filter(s => getSampleStatus(s.score) === 'good'),
  }), [processedSamples]);

  // Sample card component
  const SampleCard: React.FC<{ sample: Sample; status: 'good' | 'warning' | 'critical' }> = ({ sample, status }) => {
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

    return (
      <div
        onClick={() => onSelectSample(sample.filename)}
        className={`
          ${statusColors[status]} 
          ${selectedSampleName === sample.filename ? 'ring-2 ring-blue-500' : ''}
          p-3 border rounded-md cursor-pointer transition-all group
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              {sample.isFavorite && (
                <FaHeart className="w-3 h-3 text-red-500 flex-shrink-0" />
              )}
              {sample.score !== undefined && (
                <span className={`${scoreColors[status]} px-2 py-1 rounded text-xs font-bold flex-shrink-0`}>
                  {Math.round(sample.score)}
                </span>
              )}
              <span className="text-sm font-medium text-gray-700 truncate">
                {sample.filename.replace('.csv', '')}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {sample.x?.length || 0} data points
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(sample.filename);
              }}
              className="p-1 hover:bg-gray-200 rounded"
              aria-label={sample.isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {sample.isFavorite ? (
                <FaHeart className="w-3 h-3 text-red-500" />
              ) : (
                <FiHeart className="w-3 h-3 text-gray-400" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveSample(sample.filename);
              }}
              className="p-1 hover:bg-red-200 rounded text-gray-400 hover:text-red-600"
              aria-label="Remove sample"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-[280px] h-screen bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          📂 SAMPLES ({samples.length})
        </h2>

        {/* Search */}
        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search samples..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Recent</option>
              <option value="name">By Name</option>
              <option value="score">By Score</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <button
              onClick={() => setStarredOnly(!starredOnly)}
              className={`flex items-center space-x-2 text-sm ${starredOnly ? 'text-red-600' : 'text-gray-600'}`}
            >
              <span>{starredOnly ? '⭐' : '☆'}</span>
              <span>Starred Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sample Lists */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Critical Samples - Always Expanded */}
        {criticalSamples.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-bold text-red-700">🔴 CRITICAL ({criticalSamples.length})</span>
            </div>
            <div className="space-y-2">
              {sortSamples(criticalSamples).map((sample) => (
                <SampleCard key={sample.filename} sample={sample} status="critical" />
              ))}
            </div>
          </div>
        )}

        {/* Warning Samples - Collapsible */}
        {warningSamples.length > 0 && (
          <div>
            <button
              onClick={() => setShowWarning(!showWarning)}
              className="flex items-center space-x-2 w-full mb-2 hover:bg-gray-100 p-1 rounded"
            >
              <span className="text-sm font-bold text-yellow-700">🟡 WARNING ({warningSamples.length})</span>
              {showWarning ? (
                <ChevronUpIcon className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              )}
            </button>
            {showWarning && (
              <div className="space-y-2">
                {sortSamples(warningSamples).map((sample) => (
                  <SampleCard key={sample.filename} sample={sample} status="warning" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Good Samples - Collapsible */}
        {goodSamples.length > 0 && (
          <div>
            <button
              onClick={() => setShowGood(!showGood)}
              className="flex items-center space-x-2 w-full mb-2 hover:bg-gray-100 p-1 rounded"
            >
              <span className="text-sm font-bold text-green-700">🟢 GOOD ({goodSamples.length})</span>
              {showGood ? (
                <ChevronUpIcon className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              )}
            </button>
            {showGood && (
              <div className="space-y-2">
                {sortSamples(goodSamples).map((sample) => (
                  <SampleCard key={sample.filename} sample={sample} status="good" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty States */}
        {filteredSamples.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No samples found matching "{searchTerm}"</p>
          </div>
        )}

        {samples.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No sample files uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SampleSidebar;