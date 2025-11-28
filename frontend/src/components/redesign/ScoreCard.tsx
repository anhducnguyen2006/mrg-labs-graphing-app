import React, { memo, useMemo, useCallback } from 'react';

type ScoringMethod = 'hybrid' | 'rmse' | 'pearson' | 'area';
type Status = 'good' | 'warning' | 'critical';

interface ScoreCardProps {
  sampleName: string;
  score: number; // 0-100
  uploadDate: string;
  dataPoints: number;
  scoringMethod: ScoringMethod;
  onMethodChange: (method: ScoringMethod) => void;
  onConfigure: () => void;
}

// Memoize status configuration to prevent recreation
const statusConfig = {
  good: {
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    progressColor: 'bg-green-500',
    label: 'SAFE',
    emoji: '🟢'
  },
  warning: {
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    progressColor: 'bg-yellow-500',
    label: 'WARNING',
    emoji: '🟡'
  },
  critical: {
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    progressColor: 'bg-red-500',
    label: 'CRITICAL',
    emoji: '🔴'
  }
};

// Memoize scoring methods to prevent recreation
const scoringMethods = [
  { value: 'hybrid' as const, label: 'Hybrid (RMSE + Shape)', recommended: true },
  { value: 'rmse' as const, label: 'RMSE Deviation Only', recommended: false },
  { value: 'pearson' as const, label: 'Pearson Correlation Only', recommended: false },
  { value: 'area' as const, label: 'Area Difference', recommended: false },
];

const ScoreCard: React.FC<ScoreCardProps> = memo(({
  sampleName,
  score,
  uploadDate,
  dataPoints,
  scoringMethod,
  onMethodChange,
  onConfigure,
}) => {
  // Memoize status calculation
  const status = useMemo((): Status => {
    if (score >= 90) return 'good';
    if (score >= 70) return 'warning';
    return 'critical';
  }, [score]);

  // Memoize status configuration
  const config = useMemo(() => statusConfig[status], [status]);

  // Memoize formatted values
  const displayValues = useMemo(() => ({
    sampleDisplayName: sampleName.replace('.csv', ''),
    formattedDataPoints: dataPoints.toLocaleString(),
    progressWidth: `${Math.max(0, Math.min(100, score))}%`,
  }), [sampleName, dataPoints, score]);

  // Memoize event handlers
  const handleMethodChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onMethodChange(e.target.value as ScoringMethod);
  }, [onMethodChange]);

  // Memoize whether to show recommendation
  const showRecommendation = useMemo(() => scoringMethod === 'hybrid', [scoringMethod]);

  return (
    <div className="h-[240px] bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-2">CURRENT SAMPLE ANALYSIS</h2>
        <div className="space-y-1">
          <p className="text-base font-medium text-gray-700">
            Sample: {displayValues.sampleDisplayName}
          </p>
          <p className="text-sm text-gray-500">
            Uploaded: {uploadDate} • {displayValues.formattedDataPoints} data points
          </p>
        </div>
      </div>

      {/* Score Display */}
      <div className={`${config.bgColor} rounded-lg p-4 mb-4`}>
        {/* Status Label */}
        <div className="text-center mb-2">
          <span className={`${config.textColor} text-lg font-bold`}>
            {config.emoji} {config.label}
          </span>
        </div>

        {/* Score */}
        <div className="text-center mb-3">
          <span className={`${config.textColor} text-3xl font-bold`}>
            Score: {score} / 100
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="w-full bg-gray-300 rounded-full h-6">
            <div
              className={`${config.progressColor} h-6 rounded-full transition-all duration-800 ease-out`}
              style={{ width: displayValues.progressWidth }}
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Threshold Labels */}
        <div className="flex justify-between text-xs text-gray-600">
          <span>Critical: &lt;70</span>
          <span>Monitor: 70-89</span>
          <span>Safe: 90+</span>
        </div>
      </div>

      {/* Scoring Method Selection */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">
            Scoring Method:
          </label>
          <select
            value={scoringMethod}
            onChange={handleMethodChange}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {scoringMethods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label} {method.recommended ? '✓' : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onConfigure}
          className="px-3 py-1 text-sm font-medium text-purple-700 bg-white border border-purple-300 rounded-md hover:bg-purple-50 transition-colors"
        >
          ⚙️ Configure
        </button>
      </div>

      {/* Recommendation Text */}
      {showRecommendation && (
        <p className="text-xs italic text-gray-500 mt-1">
          💡 Recommended for grease oxidation analysis
        </p>
      )}
    </div>
  );
});

ScoreCard.displayName = 'ScoreCard';

export default ScoreCard;