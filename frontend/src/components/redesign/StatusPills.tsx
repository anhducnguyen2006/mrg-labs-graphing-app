import React, { memo, useCallback, useMemo } from 'react';

interface StatusPillsProps {
  good: number;
  warning: number;
  critical: number;
  onStatusClick: (status: 'good' | 'warning' | 'critical') => void;
}

const StatusPills: React.FC<StatusPillsProps> = memo(({
  good,
  warning,
  critical,
  onStatusClick,
}) => {
  // Memoize click handlers to prevent re-renders
  const handleGoodClick = useCallback(() => onStatusClick('good'), [onStatusClick]);
  const handleWarningClick = useCallback(() => onStatusClick('warning'), [onStatusClick]);
  const handleCriticalClick = useCallback(() => onStatusClick('critical'), [onStatusClick]);

  // Memoize totals and percentages for potential display
  const totalSamples = useMemo(() => good + warning + critical, [good, warning, critical]);
  
  // Memoize whether to show critical animation (only if critical > 0)
  const showCriticalPulse = useMemo(() => critical > 0, [critical]);

  return (
    <div className="flex items-center space-x-4">
      {/* Good Status Pill */}
      <button
        onClick={handleGoodClick}
        className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold hover:bg-green-200 transition-colors"
        aria-label={`${good} good samples, click to filter`}
      >
        🟢 {good} Good
      </button>

      {/* Warning Status Pill */}
      <button
        onClick={handleWarningClick}
        className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold hover:bg-yellow-200 transition-colors"
        aria-label={`${warning} warning samples, click to filter`}
      >
        🟡 {warning} Warning
      </button>

      {/* Critical Status Pill */}
      <button
        onClick={handleCriticalClick}
        className={`px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-bold hover:bg-red-200 transition-colors ${
          showCriticalPulse ? 'animate-pulse' : ''
        }`}
        aria-label={`${critical} critical samples, click to filter`}
      >
        🔴 {critical} Critical
      </button>
    </div>
  );
});

StatusPills.displayName = 'StatusPills';

export default StatusPills;