// Fixed FTIRGraph component with proper cleanup
import React, { useRef, useState, memo, useMemo, useCallback, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Sample, ParsedCSV, getSampleStatus } from '../../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

// Configure Chart.js defaults for performance
ChartJS.defaults.responsive = true;
ChartJS.defaults.maintainAspectRatio = false;
ChartJS.defaults.animation = false;
ChartJS.defaults.elements.point.radius = 0;

interface FTIRGraphProps {
  baseline?: ParsedCSV;
  sample?: Sample;
  selectedSampleName?: string;
  onSelectSample?: (name: string) => void;
  className?: string;
}

type GridMode = 'on' | 'off' | 'dots';

// Memoize data decimation function for large datasets
const decimateData = (x: number[], y: number[], maxPoints = 2000) => {
  if (!x || !y || x.length === 0 || y.length === 0) {
    return { x: [], y: [] };
  }
  
  if (x.length <= maxPoints) return { x, y };
  
  const step = Math.ceil(x.length / maxPoints);
  const decimatedX: number[] = [];
  const decimatedY: number[] = [];
  
  for (let i = 0; i < x.length; i += step) {
    if (i < x.length && i < y.length && isFinite(x[i]) && isFinite(y[i])) {
      decimatedX.push(x[i]);
      decimatedY.push(y[i]);
    }
  }
  
  return { x: decimatedX, y: decimatedY };
};

const FTIRGraph: React.FC<FTIRGraphProps> = memo(({
  baseline,
  sample,
  selectedSampleName,
  onSelectSample,
  className = '',
}) => {
  const chartRef = useRef<ChartJS<'line'> | null>(null);
  const [gridMode, setGridMode] = useState<GridMode>('on');
  const [zoomLevel, setZoomLevel] = useState<string>('100%');
  const [showLegend, setShowLegend] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cleanup chart on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);

  // Validate data and clear errors
  useEffect(() => {
    if (baseline && sample) {
      if (!baseline.x.length || !baseline.y.length || !sample.x.length || !sample.y.length) {
        setError('Invalid data: Missing x or y coordinates');
        return;
      }
      if (baseline.x.length !== baseline.y.length || sample.x.length !== sample.y.length) {
        setError('Invalid data: Mismatched x and y array lengths');
        return;
      }
      setError(null);
    }
  }, [baseline, sample]);

  // Memoize data availability check
  const hasData = useMemo(() => {
    return Boolean(
      baseline && 
      sample && 
      baseline.x.length > 0 && 
      baseline.y.length > 0 && 
      sample.x.length > 0 && 
      sample.y.length > 0 &&
      !error
    );
  }, [baseline, sample, error]);

  // Memoize decimated data for performance
  const processedData = useMemo(() => {
    if (!hasData || !baseline || !sample) return null;
    
    try {
      const baselineDecimated = decimateData(baseline.x, baseline.y);
      const sampleDecimated = decimateData(sample.x, sample.y);
      
      return {
        baseline: {
          ...baseline,
          x: baselineDecimated.x,
          y: baselineDecimated.y,
        },
        sample: {
          ...sample,
          x: sampleDecimated.x,
          y: sampleDecimated.y,
        }
      };
    } catch (err) {
      console.error('Error processing chart data:', err);
      setError('Error processing chart data');
      return null;
    }
  }, [hasData, baseline, sample]);

  // Memoize chart data
  const chartData = useMemo(() => {
    if (!processedData) {
      return {
        datasets: []
      };
    }

    const { baseline: processedBaseline, sample: processedSample } = processedData;
    const sampleStatus = getSampleStatus(processedSample.score);

    // Status-based colors
    const sampleColors = {
      good: { border: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
      warning: { border: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
      critical: { border: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' }
    };

    const sampleColor = sampleColors[sampleStatus];

    return {
      datasets: [
        {
          label: `Baseline: ${processedBaseline.filename}`,
          data: processedBaseline.x.map((x, i) => ({ 
            x, 
            y: processedBaseline.y[i] 
          })),
          borderColor: '#6B7280',
          backgroundColor: 'rgba(107, 114, 128, 0.1)',
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 3,
          borderDash: [5, 5],
        },
        {
          label: `Sample: ${processedSample.filename} (Score: ${processedSample.score || 'N/A'})`,
          data: processedSample.x.map((x, i) => ({ 
            x, 
            y: processedSample.y[i] 
          })),
          borderColor: sampleColor.border,
          backgroundColor: sampleColor.bg,
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 3,
        }
      ]
    };
  }, [processedData]);

  // Memoize Y-axis max calculation
  const yAxisMax = useMemo(() => {
    if (!processedData) return 5;
    
    const { baseline: processedBaseline, sample: processedSample } = processedData;
    const allY = [...processedBaseline.y, ...processedSample.y];
    const maxY = Math.max(...allY.filter(isFinite));
    return isFinite(maxY) ? Math.ceil(maxY * 1.1) : 5;
  }, [processedData]);

  // Memoize chart options
  const chartOptions = useMemo((): ChartOptions<'line'> => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    animation: false,
    plugins: {
      tooltip: {
        callbacks: {
          title: function(tooltipItems) {
            if (tooltipItems && tooltipItems[0] && tooltipItems[0].parsed && tooltipItems[0].parsed.x !== null) {
              return `Wavenumber: ${tooltipItems[0].parsed.x.toFixed(2)} cm⁻¹`;
            }
            return '';
          },
          label: function(context) {
            const datasetLabel = context.dataset.label || '';
            const label = datasetLabel.split(':')[0];
            if (context.parsed && context.parsed.y !== null) {
              const value = context.parsed.y.toFixed(3);
              return `${label}: ${value}`;
            }
            return label;
          }
        }
      },
      legend: { 
        display: showLegend,
        position: 'bottom' as const,
        align: 'end' as const,
        labels: {
          font: { size: 12 },
          color: '#333',
          usePointStyle: true,
          pointStyle: 'circle' as const,
          padding: 15,
          boxWidth: 8,
          boxHeight: 8,
        }
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          mode: 'xy' as const,
        },
        pan: {
          enabled: true,
          mode: 'xy' as const,
        }
      }
    },
    elements: {
      line: {
        pointRadius: 0,
        pointHoverRadius: 2,
        borderWidth: 1.5,
        tension: 0,
      }
    },
    scales: {
      x: {
        type: 'linear' as const,
        title: { 
          display: true, 
          text: 'Wavenumber (cm⁻¹)',
          font: { size: 14, weight: 'bold' as const },
          color: '#333'
        },
        min: 550,
        max: 4000,
        reverse: true,
        grid: {
          display: gridMode === 'on',
          color: gridMode === 'dots' ? 'transparent' : '#e0e0e0',
          lineWidth: 0.5
        },
        ticks: {
          color: '#666',
          font: { size: 12 },
          autoSkip: true,
          maxTicksLimit: 15,
        }
      },
      y: {
        type: 'linear' as const,
        title: { 
          display: true, 
          text: 'Absorbance',
          font: { size: 14, weight: 'bold' as const },
          color: '#333'
        },
        min: 0,
        max: yAxisMax,
        grid: {
          display: gridMode === 'on',
          color: gridMode === 'dots' ? 'transparent' : '#e0e0e0',
          lineWidth: 0.5
        },
        ticks: {
          color: '#666',
          font: { size: 12 },
          stepSize: 0.5,
          callback: function(value: any) {
            return typeof value === 'number' ? value.toFixed(1) : value;
          }
        }
      }
    }
  }), [gridMode, showLegend, yAxisMax]);

  // Memoized event handlers
  const handleResetZoom = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
      setZoomLevel('100%');
    }
  }, []);

  const handleGridToggle = useCallback(() => {
    setGridMode(prev => {
      switch (prev) {
        case 'on': return 'off';
        case 'off': return 'dots';
        case 'dots': return 'on';
        default: return 'on';
      }
    });
  }, []);

  const handleExportChart = useCallback(() => {
    if (chartRef.current && chartRef.current.canvas) {
      const canvas = chartRef.current.canvas;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `ftir-graph-${selectedSampleName || 'chart'}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [selectedSampleName]);

  // Error state
  if (error) {
    return (
      <div className={`h-[400px] bg-white border border-gray-200 rounded-xl shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chart Error</h3>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!hasData) {
    return (
      <div className={`h-[400px] bg-white border border-gray-200 rounded-xl shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">FTIR Spectral Comparison</h2>
        </div>
        <div className="flex items-center justify-center h-[320px]">
          <div className="text-center">
            <div className="text-gray-300 text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-sm text-gray-600">
              Upload a baseline and sample CSV to view the spectral comparison
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[400px] bg-white border border-gray-200 rounded-xl shadow-sm p-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">FTIR Spectral Comparison</h2>
        
        {/* Toolbar */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleGridToggle}
            className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
            aria-label={`Grid: ${gridMode}`}
          >
            Grid: {gridMode.toUpperCase()}
          </button>
          
          <button
            onClick={handleResetZoom}
            className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
            aria-label="Reset zoom"
          >
            🔍 Reset Zoom
          </button>

          <button
            onClick={() => setShowLegend(!showLegend)}
            className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
            aria-label={`${showLegend ? 'Hide' : 'Show'} legend`}
          >
            📋 {showLegend ? 'Hide' : 'Show'} Legend
          </button>

          <button
            onClick={handleExportChart}
            className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-300 rounded hover:bg-blue-100 transition-colors"
            aria-label="Export chart as PNG"
          >
            💾 Export PNG
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[320px]">
        <Line 
          ref={chartRef}
          data={chartData} 
          options={chartOptions}
        />
      </div>
    </div>
  );
});

FTIRGraph.displayName = 'FTIRGraph';

export default FTIRGraph;