import React, { useRef } from 'react';
import { Box, VStack, Text, HStack, Button } from '@chakra-ui/react';
import { ParsedCSV } from '../types';
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
}

const GraphPreview: React.FC<Props> = ({ baseline, samples, selectedSampleName, onSelectSample }) => {
  const chartRef = useRef<any>(null);
  const sample = samples.find((s: ParsedCSV) => s.filename === selectedSampleName) || samples[0];
  const hasData = baseline && sample;
  
  // Track whether to use custom mixed intervals or uniform 250 intervals
  const useCustomIntervals = useRef(true);

  const handleResetZoom = () => {
    if (chartRef.current) {
      useCustomIntervals.current = true;
      chartRef.current.resetZoom();
    }
  };

  // Create chart data with proper x-y coordinate pairs
  const data = hasData ? (() => {
    // Create coordinate pairs for baseline
    const baselineData = baseline!.x.map((x: number, i: number) => ({ x, y: baseline!.y[i] }));
    // Create coordinate pairs for sample
    const sampleData = sample.x.map((x: number, i: number) => ({ x, y: sample.y[i] }));
    
    return {
      datasets: [
        {
          label: `Baseline: ${baseline!.filename}`,
          data: baselineData,
          borderColor: 'rgb(0, 100, 0)', // Darker green - fully opaque
          backgroundColor: 'rgba(0,100,0,0.05)',
          tension: 0.2,
          pointRadius: 0,
          pointHoverRadius: 3,
          borderWidth: 0.45, // Slightly thicker for visibility
          fill: false,
        },
        {
          label: `Sample: ${sample.filename}`,
          data: sampleData,
          borderColor: 'rgb(0, 0, 255)', // Darker blue - fully opaque
          backgroundColor: 'rgb(0, 0, 255)',
          tension: 0.2,
          pointRadius: 0,
          pointHoverRadius: 3,
          borderWidth: 0.45, // Slightly thicker for visibility
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
            <Button size="sm" onClick={handleResetZoom} variant="outline">
              Reset Zoom
            </Button>
          )}
        </HStack>

        {hasData ? (
          <Box w="100%" h="400px">
            <Line ref={chartRef} data={data!} options={{
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
                    color: '#e0e0e0',
                    lineWidth: 0.5
                  },
                  ticks: {
                    color: '#666',
                    font: { size: 12 },
                    autoSkip: true,
                    maxTicksLimit: 15,
                    callback: function(value) {
                      // Round to whole numbers (no decimals)
                      const numValue = typeof value === 'number' ? value : parseFloat(value);
                      return Math.round(numValue);
                    }
                  },
                  // Dynamically generate ticks based on zoom state
                  afterBuildTicks: (axis) => {
                    if (useCustomIntervals.current) {
                      // Default/Reset view: Mixed intervals (500 from 4000-2000, 250 from 2000-750, then 550)
                      axis.ticks = [4000, 3500, 3000, 2500, 2000, 1750, 1500, 1250, 1000, 750, 550].map(value => ({ value }));
                    }
                    // When zoomed (useCustomIntervals.current === false):
                    // Let Chart.js auto-generate ticks with adaptive scaling
                    // The callback above will ensure they're rounded to whole numbers
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
                  max: 6,
                  grid: {
                    color: '#e0e0e0',
                    lineWidth: 0.5
                  },
                  ticks: {
                    maxTicksLimit: 8,
                    color: '#666',
                    font: { size: 12 }
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
                    usePointStyle: true,
                    padding: 15,
                    boxWidth: 15,
                    boxHeight: 3
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
                    onZoomComplete: ({ chart }) => {
                      // Switch to uniform 250-unit intervals when zoomed
                      useCustomIntervals.current = false;
                      chart.update('none');
                    }
                  },
                  pan: {
                    enabled: true,
                    mode: 'xy',
                    onPanComplete: ({ chart }) => {
                      // Maintain 250-unit intervals during pan
                      useCustomIntervals.current = false;
                      chart.update('none');
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
      </VStack>
    </Box>
  );
};export default GraphPreview;
