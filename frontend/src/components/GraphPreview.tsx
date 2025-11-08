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

  const handleResetZoom = () => {
    if (chartRef.current) {
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
          borderColor: '#2E8B57', // Sea green - more professional
          backgroundColor: 'rgba(46,139,87,0.05)',
          tension: 0.2,
          pointRadius: 0,
          pointHoverRadius: 3,
          borderWidth: 1.5, // Thinner line
          fill: false,
        },
        {
          label: `Sample: ${sample.filename}`,
          data: sampleData,
          borderColor: '#4169E1', // Royal blue - more professional
          backgroundColor: 'rgba(65,105,225,0.05)',
          tension: 0.2,
          pointRadius: 0,
          pointHoverRadius: 3,
          borderWidth: 1.5, // Thinner line
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
                    maxTicksLimit: 10,
                    color: '#666',
                    font: { size: 12 }
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
                  max: 5.3,
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
                  },
                  pan: {
                    enabled: true,
                    mode: 'xy',
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
