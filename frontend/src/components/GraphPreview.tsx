import React, { useRef } from 'react';
import { Box, VStack, Text, HStack, Button } from '@chakra-ui/react';
import { ParsedCSV } from '../types';
import GraphSummary from './GraphSummary';
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
  const sample = samples.find((s: ParsedCSV) => s.filename === selectedSampleName) || samples[0];
  const hasData = baseline && sample;
  
  // Track whether to use custom mixed intervals or uniform 250 intervals
  const useCustomIntervals = useRef(true);
  // Force re-render trigger
  const [resetKey, setResetKey] = React.useState(0);
  // Track grid visibility
  const [showGrid, setShowGrid] = React.useState(true);
  // Find the corresponding File object for the selected sample
  const selectedSampleFile = sampleFiles && selectedSampleName ? 
    Array.from(sampleFiles).find(file => file.name === selectedSampleName) : 
    undefined;

  const handleResetZoom = () => {
    useCustomIntervals.current = true;
    isZoomedMode.current = false;
    // Force complete chart re-render by updating key
    setResetKey(prev => prev + 1);
  };

  const handleToggleGrid = () => {
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
  }, [baseline, samples, selectedSampleName]);

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

  // Calculate dynamic y-axis max
  const getYMax = () => {
    if (!hasData) return 6;
    const maxBaseline = Math.max(...baseline!.y);
    const maxSample = Math.max(...sample.y);
    return Math.max(maxBaseline, maxSample);
  };

  // Generate y-axis ticks: 0.2, 0.5, 1.0, 1.5, ..., max
  const getYTicks = () => {
    const yMax = getYMax();
    const ticks = [0.2];
    let current = 0.5;
    while (current < yMax) {
      ticks.push(current);
      current += 0.5;
    }
    ticks.push(Math.round(yMax * 10) / 10); // Round max to 1 decimal
    return ticks;
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
    <Box w="100%" bg="white" p={4} borderWidth="1px" rounded="md" shadow="sm">
      <VStack align="start" spacing={3}>
        <HStack justify="space-between" w="100%">
          <Text fontWeight="bold">Real-time Preview</Text>
          {hasData && (
            <HStack spacing={2}>
              <Button size="sm" onClick={handleToggleGrid} variant="outline">
                {showGrid ? 'Hide Grid' : 'Show Grid'}
              </Button>
              <Button size="sm" onClick={handleResetZoom} variant="outline">
                Reset Zoom
              </Button>
            </HStack>
          )}
        </HStack>

        {hasData ? (
          <Box w="100%" h="400px">
            <Line key={resetKey} ref={chartRef} data={data!} options={{
              responsive: true,
              maintainAspectRatio: false,
              animation: false,
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
                  min: 0.2,
                  max: getYMax(),
                  grid: {
                    display: showGrid,  // Toggle grid lines
                    color: '#e0e0e0',
                    lineWidth: 0.5
                  },
                  ticks: {
                    color: '#666',
                    font: { size: 12 },
                    callback: function(value) {
                      return typeof value === 'number' ? value.toFixed(1) : value;
                    }
                  },
                  afterBuildTicks: (axis) => {
                    // Set custom y-ticks
                    axis.ticks = getYTicks().map(value => ({ value }));
                  }
                }
              },
              plugins: {
                legend: { 
                  position: 'top',
                  display: true,
                  labels: {
                    font: { size: 13, weight: 'bold' },
                    color: '#333',
                    usePointStyle: false,  // Don't use point style, use box
                    padding: 15,
                    boxWidth: 15,
                    boxHeight: 15,
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
                    y: { min: 0, max: 10 }
                  }
                }
              }
            }} />
          </Box>
        ) : (
          <Text fontSize="sm" color="gray.500">Upload baseline and at least one sample to see preview.</Text>
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
