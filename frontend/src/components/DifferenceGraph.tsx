import React, { useRef } from 'react';
import { Box, VStack, Text, HStack, Button } from '@chakra-ui/react';
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
  x: number[];
  deviation: number[];
  selectedSampleName?: string;
  showGrid?: boolean;
  onResetZoom?: () => void;
  resetKey?: number;
}

const DifferenceGraph = React.forwardRef<any, Props>(({ 
  x, 
  deviation, 
  selectedSampleName,
  showGrid = true,
  onResetZoom,
  resetKey = 0
}, ref) => {
  const internalChartRef = useRef<any>(null);
  const chartRef = (ref as React.MutableRefObject<any>) || internalChartRef;
  const hasData = x.length > 0 && deviation.length > 0;
  const isZoomedMode = useRef(false);

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
      isZoomedMode.current = false;
    }
    if (onResetZoom) {
      onResetZoom();
    }
  };

  // Prepare chart data
  const data = hasData ? {
    datasets: [
      {
        label: `Deviation from Average${selectedSampleName ? `: ${selectedSampleName.replace(/\.csv$/i, '')}` : ''}`,
        data: x.map((xVal, i) => ({ x: xVal, y: deviation[i] })),
        borderColor: 'rgb(255, 99, 132)', // Red for deviation
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 3,
        borderWidth: 1.5,
        fill: true,
      }
    ]
  } : undefined;

  // Calculate y-axis range dynamically (absolute values, so always positive)
  const getYRange = () => {
    if (!hasData) return { min: 0, max: 1 };
    const maxVal = Math.max(...deviation);
    const range = maxVal * 1.2; // Add 20% padding
    return { min: 0, max: range };
  };

  const yRange = getYRange();

  return (
    <Box w="100%" bg="white" p={4} borderWidth="1px" rounded="md" shadow="sm">
      <VStack align="start" spacing={3}>
        <HStack justify="space-between" w="100%">
          <Box>
            <Text fontWeight="bold" fontSize="md">
              Absolute Deviation from Average
            </Text>
            <Text fontSize="xs" color="gray.600">
              Shows the magnitude of difference between selected sample and average of all samples
            </Text>
          </Box>
          {hasData && (
            <Button size="sm" onClick={handleResetZoom} variant="outline">
              Reset Zoom
            </Button>
          )}
        </HStack>

        {hasData ? (
          <Box w="100%" h="250px">
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
                    text: 'Wavelength (cm⁻¹)',
                    font: { size: 12, weight: 'bold' },
                    color: '#333'
                  },
                  min: 4000,
                  max: 550,
                  reverse: true,
                  grid: {
                    display: showGrid,
                    color: '#e0e0e0',
                    lineWidth: 0.5
                  },
                  ticks: {
                    color: '#666',
                    font: { size: 11 },
                    autoSkip: true,
                    maxTicksLimit: 15,
                    callback: function(value) {
                      const numValue = typeof value === 'number' ? value : parseFloat(value);
                      return Math.round(numValue);
                    }
                  }
                },
                y: {
                  type: 'linear',
                  title: { 
                    display: true, 
                    text: 'Absolute Deviation',
                    font: { size: 12, weight: 'bold' },
                    color: '#333'
                  },
                  min: yRange.min,
                  max: yRange.max,
                  grid: {
                    display: showGrid,
                    color: '#e0e0e0',
                    lineWidth: 0.5
                  },
                  ticks: {
                    color: '#666',
                    font: { size: 11 },
                    callback: function(value) {
                      return typeof value === 'number' ? value.toFixed(3) : value;
                    }
                  }
                }
              },
              plugins: {
                legend: { 
                  position: 'top',
                  display: true,
                  labels: {
                    font: { size: 12, weight: 'bold' },
                    color: '#333',
                    boxWidth: 15,
                    boxHeight: 15,
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
                      isZoomedMode.current = true;
                      return true;
                    },
                    onZoomComplete: () => {
                      isZoomedMode.current = true;
                    }
                  },
                  pan: {
                    enabled: true,
                    mode: 'xy',
                    onPanStart: () => {
                      isZoomedMode.current = true;
                      return true;
                    },
                    onPanComplete: () => {
                      isZoomedMode.current = true;
                    }
                  },
                  limits: {
                    x: { min: 400, max: 4500 },
                    y: { min: -10, max: 10 }
                  }
                }
              }
            }} />
          </Box>
        ) : (
          <Text fontSize="sm" color="gray.500">
            Upload baseline and multiple samples to see deviation analysis.
          </Text>
        )}

        {/* Info box */}
        {hasData && (
          <Box w="100%" p={2} bg="red.50" rounded="md" borderWidth="1px" borderColor="red.200">
            <Text fontSize="xs" color="red.800">
              📊 <strong>Interpretation:</strong> Higher values indicate greater deviation from average behavior. 
              Values near zero mean the sample is typical. Spikes indicate unusual differences at specific wavenumber.
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
});

DifferenceGraph.displayName = 'DifferenceGraph';

export default DifferenceGraph;
