import React, { useRef, useMemo } from 'react';
import { Box, VStack, Text, HStack, Button, Icon } from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon, RepeatIcon } from '@chakra-ui/icons';
import { ParsedCSV } from '../types';
import GraphSummary from './GraphSummary';
import DeviationHeatBar from './DeviationHeatBar';
import { Line } from 'react-chartjs-2';
import { Series, diff } from '../lib/series';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

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

interface Props {
  baseline?: ParsedCSV;
  samples: ParsedCSV[];
  selectedSampleName?: string;
  onSelectSample: (name: string) => void;
  baselineFile?: File;
  sampleFiles?: FileList;
}

const GraphPreview: React.FC<Props> = ({ 
  baseline, 
  samples, 
  selectedSampleName, 
  onSelectSample, 
  baselineFile, 
  sampleFiles 
}) => {
  const chartRef = useRef<any>(null);
  const differenceChartRef = useRef<any>(null);
  const sample = samples.find((s: ParsedCSV) => s.filename === selectedSampleName) || samples[0];
  const hasData = baseline && sample;
  
  // Track whether to use custom mixed intervals or uniform 250 intervals
  const useCustomIntervals = useRef(true);
  // Force re-render trigger
  const [resetKey, setResetKey] = React.useState(0);
  const [differenceResetKey, setDifferenceResetKey] = React.useState(0);
  // Track grid visibility (synchronized across both graphs)
  const [showGrid, setShowGrid] = React.useState(true);

  // Step 2: Calculate differences and average across all samples
  const differenceData = useMemo(() => {
    if (!baseline || samples.length === 0) return null;

    // Convert baseline to Series format
    const baselineSeries: Series = {
      name: baseline.filename,
      points: baseline.x.map((x, i) => ({ x, y: baseline.y[i] }))
    };

    // Calculate individual differences for each sample vs baseline
    const sampleDifferences = samples.map(s => {
      const sampleSeries: Series = {
        name: s.filename,
        points: s.x.map((x, i) => ({ x, y: s.y[i] }))
      };
      return diff(baselineSeries, sampleSeries);
    });

    // Calculate average difference across all samples at each x-point
    // First, find common x-values across all samples
    if (sampleDifferences.length === 0) return null;

    const firstDiff = sampleDifferences[0];
    const x = firstDiff.x;
    const avgDelta: number[] = [];

    // For each x-point, average the deltas across all samples
    for (let i = 0; i < x.length; i++) {
      const xValue = x[i];
      let sum = 0;
      let count = 0;

      // Sum deltas from all samples at this x-point
      for (const sampleDiff of sampleDifferences) {
        const idx = sampleDiff.x.indexOf(xValue);
        if (idx !== -1) {
          sum += sampleDiff.delta[idx];
          count++;
        }
      }

      avgDelta.push(count > 0 ? sum / count : 0);
    }

    // Calculate deviation from average for selected sample
    // deviation[i] = individual_diff[i] - avg_diff[i]
    // (Weight multiplication can be added later if needed)
    const selectedSampleDiff = sampleDifferences.find(
      d => samples.find(s => s.filename === selectedSampleName)
    ) || sampleDifferences[0];

    const deviation: number[] = [];

    for (let i = 0; i < x.length; i++) {
      const xValue = x[i];
      const idx = selectedSampleDiff.x.indexOf(xValue);
      if (idx !== -1) {
        // Absolute deviation: |difference from average| (no weight for now)
        deviation.push(Math.abs(selectedSampleDiff.delta[idx] - avgDelta[i]));
      } else {
        deviation.push(0);
      }
    }

    return {
      x,
      avgDelta,
      selectedDelta: selectedSampleDiff.delta,
      deviation,
      allSampleDifferences: sampleDifferences
    };
  }, [baseline, samples, selectedSampleName]);
  // Find the corresponding File object for the selected sample
  const selectedSampleFile = sampleFiles && selectedSampleName ? 
    Array.from(sampleFiles).find(file => file.name === selectedSampleName) : 
    undefined;

  const handleResetZoom = () => {
    // Reset main graph
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
    // Reset difference graph
    if (differenceChartRef.current) {
      differenceChartRef.current.resetZoom();
    }
    useCustomIntervals.current = true;
    isZoomedMode.current = false;
    // Force complete chart re-render by updating keys (synchronized)
    setResetKey(prev => prev + 1);
    setDifferenceResetKey(prev => prev + 1);
  };

  const handleToggleGrid = () => {
    // Toggle grid for both graphs simultaneously
    setShowGrid(prev => !prev);
  };
  
  // Reset to custom intervals whenever new data is loaded
  React.useEffect(() => {
    useCustomIntervals.current = true;
    isZoomedMode.current = false;
    setShowGrid(true); // Reset grid to visible when new data loads
    if (chartRef.current) {
      chartRef.current.update('none');
    }
    if (differenceChartRef.current) {
      differenceChartRef.current.update('none');
    }
  }, [baseline, samples, selectedSampleName]);

  // Synchronize grid toggle across both graphs
  React.useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update('none');
    }
    if (differenceChartRef.current) {
      differenceChartRef.current.update('none');
    }
  }, [showGrid]);

  // Transform x-values to equal-spaced positions (similar to backend export)
  const customXTicks = [4000, 3500, 3000, 2500, 2000, 1750, 1500, 1250, 1000, 750, 550];
  const isZoomedMode = useRef(false);
  
  const mapXToPosition = (xValues: number[]) => {
    return xValues.map(x => {
      if (x >= 4000) return 0;
      if (x <= 550) return customXTicks.length - 1;
      
      // Find which segment this x falls into
      for (let i = 0; i < customXTicks.length - 1; i++) {
        if (customXTicks[i] >= x && x >= customXTicks[i + 1]) {
          const x1 = customXTicks[i];
          const x2 = customXTicks[i + 1];
          const t = (x - x1) / (x2 - x1);
          return i + t;
        }
      }
      return 0;
    });
  };

  // Calculate dynamic y-axis max rounded up to nearest 0.5
  const getYMax = () => {
    if (!hasData) return 6;
    const maxBaseline = Math.max(...baseline!.y);
    const maxSample = Math.max(...sample.y);
    const actualMax = Math.max(maxBaseline, maxSample);
    // Round up to nearest 0.5 (e.g., 5.3 -> 5.5, 5.7 -> 6.0)
    return Math.ceil(actualMax * 2) / 2;
  };

  // Create chart data with proper x-y coordinate pairs
  const data = hasData ? (() => {
    // Remove .csv extension from filenames
    const baselineName = baseline!.filename.replace(/\.csv$/i, '');
    const sampleName = sample.filename.replace(/\.csv$/i, '');
    
    // Always use actual x values for data, transformation happens at display level
    const baselineData = baseline!.x.map((x: number, i: number) => ({ x, y: baseline!.y[i] }));
    const sampleData = sample.x.map((x: number, i: number) => ({ x, y: sample.y[i] }));
    
    return {
      datasets: [
        {
          label: `Baseline: ${baselineName}`,
          data: baselineData,
          borderColor: 'rgb(0, 100, 0)', // Darker green - fully opaque
          backgroundColor: 'rgba(0,100,0,0.05)',
          tension: 0.2,
          pointRadius: 0,
          pointHoverRadius: 3,
          borderWidth: 0.45,
          fill: false,
        },
        {
          label: `Sample: ${sampleName}`,
          data: sampleData,
          borderColor: 'rgb(0, 0, 255)', // Darker blue - fully opaque
          backgroundColor: 'rgb(0, 0, 255)',
          tension: 0.2,
          pointRadius: 0,
          pointHoverRadius: 3,
          borderWidth: 0.45,
          fill: false,
        }
      ]
    };
  })() : undefined;

  return (
    <Box w="100%">
      <VStack align="start" spacing={4}>
        {hasData && (
          <HStack justify="space-between" w="100%" mb={4}>
            <Text fontSize="2xl" fontWeight="bold">FTIR Graph Analysis</Text>
            <HStack spacing={2}>
              <Button size="sm" onClick={handleToggleGrid} variant="outline" leftIcon={showGrid ? <ViewOffIcon /> : <ViewIcon />}>
                {showGrid ? 'Hide Grid' : 'Show Grid'}
              </Button>
              <Button size="sm" onClick={handleResetZoom} variant="outline" leftIcon={<RepeatIcon />}>
                Reset Zoom
              </Button>
            </HStack>
          </HStack>
        )}

        {/* Main Spectroscopy Graph */}
        {hasData ? (
          <Box w="100%" h="500px" bg="white" p={12} borderWidth="1px" borderColor="gray.200" rounded="lg" shadow="sm">
              <Line key={resetKey} ref={chartRef} data={data!} options={{
              responsive: true,
              maintainAspectRatio: false,
              animation: {
                duration: 300,
                easing: 'easeInOutQuart',
                delay: (context) => {
                  let delay = 0;
                  if (context.type === 'data' && context.mode === 'default') {
                    delay = context.dataIndex * 0.5;
                  }
                  return delay;
                }
              },
              transitions: {
                zoom: {
                  animation: {
                    duration: 0
                  }
                },
                active: {
                  animation: {
                    duration: 0
                  }
                }
              },
              interaction: {
                intersect: false,
                mode: 'index'
              },
              scales: {
                x: {
                  type: 'linear',
                  title: { 
                    display: true, 
                    text: 'Wavenumber (cm⁻¹)',
                    font: { size: 14, weight: 'bold' },
                    color: '#333'
                  },
                  min: 4000,
                  max: 550,
                  reverse: true,
                  grid: {
                    display: showGrid,  // Toggle grid lines
                    color: '#e0e0e0',
                    lineWidth: 0.5
                  },
                  ticks: {
                    color: '#666',
                    font: { size: 12 },
                    autoSkip: true,
                    maxTicksLimit: 15,
                    callback: function(value) {
                      const numValue = typeof value === 'number' ? value : parseFloat(value);
                      return Math.round(numValue);
                    }
                  },
                  afterBuildTicks: (axis) => {
                    if (useCustomIntervals.current && !isZoomedMode.current) {
                      // Equal-spaced custom ticks for default view
                      axis.ticks = customXTicks.map(value => ({ value }));
                    }
                  }
                },
                y: {
                  type: 'linear',
                  title: { 
                    display: true, 
                    text: 'Absorbance',
                    font: { size: 14, weight: 'bold' },
                    color: '#333'
                  },
                  min: 0,
                  max: getYMax(), // Rounded to nearest 0.5 above actual max
                  grid: {
                    display: showGrid,  // Toggle grid lines
                    color: '#e0e0e0',
                    lineWidth: 0.5
                  },
                  ticks: {
                    color: '#666',
                    font: { size: 12 },
                    stepSize: 0.5, // Interval of 0.5
                    callback: function(value) {
                      return typeof value === 'number' ? value.toFixed(1) : value;
                    }
                  }
                }
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    title: function(tooltipItems) {
                      // Show only the x-value in the title
                      if (tooltipItems && tooltipItems[0] && tooltipItems[0].parsed && tooltipItems[0].parsed.x !== null) {
                        return `Wavenumber: ${tooltipItems[0].parsed.x.toFixed(2)} cm⁻¹`;
                      }
                      return '';
                    },
                    label: function(context) {
                      // Remove filename, show only "Baseline:" or "Sample:"
                      const datasetLabel = context.dataset.label || '';
                      const label = datasetLabel.split(':')[0]; // Get "Baseline" or "Sample"
                      if (context.parsed && context.parsed.y !== null) {
                        const value = context.parsed.y.toFixed(3);
                        return `${label}: ${value}`;
                      }
                      return label;
                    }
                  }
                },
                legend: { 
                  position: 'bottom',
                  display: true,
                  align: 'end',
                  labels: {
                    font: { size: 12 },
                    color: '#333',
                    usePointStyle: true,  // Use circular point style
                    pointStyle: 'circle',
                    padding: 15,
                    boxWidth: 8,
                    boxHeight: 8,
                    generateLabels: (chart) => {
                      const datasets = chart.data.datasets;
                      return datasets.map((dataset, i) => {
                        const isVisible = chart.isDatasetVisible(i);
                        return {
                          text: dataset.label || '',
                          // If visible, fill with dataset color; if hidden, transparent (empty box)
                          fillStyle: isVisible ? (dataset.borderColor as string) : 'rgba(0,0,0,0)',
                          // If visible, border uses dataset color; if hidden, black border
                          strokeStyle: isVisible ? (dataset.borderColor as string) : '#000',
                          lineWidth: 2,  // Border thickness
                          hidden: false,  // Never hide the legend item itself
                          datasetIndex: i
                        };
                      });
                    }
                  },
                  onClick: (e, legendItem, legend) => {
                    // Toggle dataset visibility when clicking legend
                    const index = legendItem.datasetIndex;
                    if (index !== undefined) {
                      const chart = legend.chart;
                      if (chart.isDatasetVisible(index)) {
                        chart.hide(index);
                      } else {
                        chart.show(index);
                      }
                      chart.update();
                    }
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
                    onZoomStart: () => {
                      // Mark as zoomed mode
                      isZoomedMode.current = true;
                      return true;
                    },
                    onZoomComplete: ({ chart }) => {
                      // Stay in zoomed mode, don't re-render
                      isZoomedMode.current = true;
                    }
                  },
                  pan: {
                    enabled: true,
                    mode: 'xy',
                    onPanStart: () => {
                      // Mark as zoomed mode
                      isZoomedMode.current = true;
                      return true;
                    },
                    onPanComplete: ({ chart }) => {
                      // Stay in zoomed mode
                      isZoomedMode.current = true;
                    }
                  },
                  limits: {
                    x: { min: 400, max: 4500 },
                    y: { min: 0, max: 7.0 } // Max zoom out limit
                  }
                }
              }
            }} />
          </Box>
        ) : (
          <Text fontSize="sm" color="gray.500">Upload baseline and at least one sample to see preview.</Text>
        )}
        
        {/* Deviation Heat Bar - Shows oxidation intensity */}
        {differenceData && (
          <DeviationHeatBar
            ref={differenceChartRef}
            x={differenceData.x}
            deviation={differenceData.deviation}
            selectedSampleName={selectedSampleName}
            showGrid={showGrid}
            resetKey={differenceResetKey}
          />
        )}
        
        {/* AI-Powered Graph Summary */}
        <GraphSummary
          baseline={baseline}
          selectedSample={sample}
          baselineFile={baselineFile}
          selectedSampleFile={selectedSampleFile}
        />
      </VStack>
    </Box>
  );
};export default GraphPreview;
