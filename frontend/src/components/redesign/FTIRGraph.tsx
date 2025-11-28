import React, { useRef, useState, memo, useMemo, useCallback } from 'react';
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
  DecimationAlgorithm,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

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
ChartJS.defaults.animation = false; // Disable animations by default for performance
ChartJS.defaults.elements.point.radius = 0; // Hide points by default

interface ParsedCSV {
  filename: string;
  x: number[];
  y: number[];
}

interface FTIRGraphProps {
  baseline?: ParsedCSV;
  sample?: ParsedCSV;
  selectedSampleName?: string;
  onSelectSample?: (name: string) => void;
  className?: string;
}

type GridMode = 'on' | 'off' | 'dots';

// Memoize data decimation function for large datasets
const decimateData = (x: number[], y: number[], maxPoints = 2000) => {
  if (x.length <= maxPoints) return { x, y };
  
  const step = Math.ceil(x.length / maxPoints);
  const decimatedX: number[] = [];
  const decimatedY: number[] = [];
  
  for (let i = 0; i < x.length; i += step) {
    decimatedX.push(x[i]);
    decimatedY.push(y[i]);
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
  const chartRef = useRef<any>(null);
  const [gridMode, setGridMode] = useState<GridMode>('on');
  const [zoomLevel, setZoomLevel] = useState<string>('100%');
  const [showLegend, setShowLegend] = useState(true);

  // Memoize data availability check
  const hasData = useMemo(() => Boolean(baseline && sample), [baseline, sample]);

  // Memoize decimated data for performance
  const processedData = useMemo(() => {
    if (!hasData || !baseline || !sample) return null;
    
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
  }, [baseline, sample, hasData]);

  // Memoize Y-axis max calculation
  const yAxisMax = useMemo((): number => {
    if (!processedData) return 6;
    const maxBaseline = Math.max(...processedData.baseline.y);
    const maxSample = Math.max(...processedData.sample.y);
    const actualMax = Math.max(maxBaseline, maxSample);
    return Math.ceil(actualMax * 2) / 2; // Round up to nearest 0.5
  }, [processedData]);

  // Memoize event handlers
  const handleGridChange = useCallback((mode: GridMode) => {
    setGridMode(mode);
    if (chartRef.current) {
      chartRef.current.update('none'); // Use 'none' for fastest update
    }
  }, []);

  const handleGridSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    handleGridChange(e.target.value as GridMode);
  }, [handleGridChange]);

  const handleZoomChange = useCallback((level: string) => {
    if (level === 'Reset') {
      if (chartRef.current) {
        chartRef.current.resetZoom();
      }
      setZoomLevel('100%');
    } else {
      setZoomLevel(level);
    }
  }, []);

  const handleZoomSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    handleZoomChange(e.target.value);
  }, [handleZoomChange]);

  const handleExportPNG = useCallback(() => {
    if (chartRef.current) {
      const canvas = chartRef.current.canvas;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `ftir-graph-${selectedSampleName || 'current'}.png`;
      link.href = url;
      link.click();
    }
  }, [selectedSampleName]);

  const handleLegendToggle = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setShowLegend(e.target.value === 'show');
  }, []);

  // Memoize chart data for performance
  const chartData = useMemo(() => {
    if (!processedData) return undefined;

    const { baseline: baselineData, sample: sampleData } = processedData;

    return {
      datasets: [
        {
          label: `Baseline: ${baselineData.filename.replace(/\.csv$/i, '')}`,
          data: baselineData.x.map((x, i) => ({ x, y: baselineData.y[i] })),
          borderColor: '#10B981', // Green
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          tension: 0, // Disable bezier curves for performance
          pointRadius: 0,
          pointHoverRadius: 2,
          borderWidth: 1.5,
          fill: false,
        },
        {
          label: `Sample: ${sampleData.filename.replace(/\.csv$/i, '')}`,
          data: sampleData.x.map((x, i) => ({ x, y: sampleData.y[i] })),
          borderColor: '#3B82F6', // Blue
          backgroundColor: '#3B82F6',
          tension: 0, // Disable bezier curves for performance
          pointRadius: 0,
          pointHoverRadius: 2,
          borderWidth: 1.5,
          fill: false,
        }
      ]
    };
  }, [processedData]);

  // Memoize chart options for performance
  const chartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // Disable animations for better performance
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    // Enable data decimation for large datasets
    datasets: {
      line: {
        pointRadius: 0,
        pointHoverRadius: 2,
        borderWidth: 1.5,
        tension: 0,
      }
    },
    scales: {
      x: {
        type: 'linear',
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
        type: 'linear',
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
    },
    plugins: {
      tooltip: {
        callbacks: {
          title: function(tooltipItems: TooltipItem<'line'>[]) {
            if (tooltipItems && tooltipItems[0] && tooltipItems[0].parsed && tooltipItems[0].parsed.x !== null) {
              return `Wavenumber: ${tooltipItems[0].parsed.x.toFixed(2)} cm⁻¹`;
            }
            return '';
          },
          label: function(context: TooltipItem<'line'>) {
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
        position: 'bottom',
        align: 'end',
        labels: {
          font: { size: 12 },
          color: '#333',
          usePointStyle: true,
          pointStyle: 'circle',
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
          mode: 'xy',
        },
        pan: {
          enabled: true,
          mode: 'xy',
        },
        limits: {
          x: { min: 400, max: 4500 },
          y: { min: 0, max: 7.0 }
        }
      }
    }
  }), [gridMode, yAxisMax, showLegend]);

  return (
    <div className={`h-[700px] bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
      {/* Toolbar */}
      <div className="h-10 border-b border-gray-200 px-6 flex items-center justify-between">
        {/* Left controls */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Grid:</label>
            <select
              value={gridMode}
              onChange={handleGridSelect}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
            >
              <option value="on">On</option>
              <option value="off">Off</option>
              <option value="dots">Dots</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Zoom:</label>
            <select
              value={zoomLevel}
              onChange={handleZoomSelect}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
            >
              <option value="100%">100%</option>
              <option value="150%">150%</option>
              <option value="200%">200%</option>
              <option value="Reset">Reset</option>
            </select>
          </div>

          <button
            onClick={handleExportPNG}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            disabled={!hasData}
          >
            Export PNG
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Legend:</label>
          <select
            value={showLegend ? 'show' : 'hide'}
            onChange={handleLegendToggle}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
          >
            <option value="show">Show</option>
            <option value="hide">Hide</option>
          </select>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-[calc(100%-40px)] p-6">
        {hasData ? (
          <div className="w-full h-full">
            <Line
              ref={chartRef}
              data={chartData!}
              options={chartOptions}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📈</div>
              <p className="text-lg font-medium text-gray-700 mb-2">FTIR Spectral Overlay</p>
              <p className="text-sm text-gray-500">
                Upload baseline and sample files to view spectral comparison
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      {hasData && (
        <div className="px-6 pb-2">
          <p className="text-xs text-gray-500 text-center">
            ℹ️ Hover over graph to inspect values • Scroll to zoom • Drag to pan
          </p>
        </div>
      )}
    </div>
  );
});

FTIRGraph.displayName = 'FTIRGraph';

export default FTIRGraph;