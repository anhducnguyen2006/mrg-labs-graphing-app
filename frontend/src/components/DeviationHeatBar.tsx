import React, { useRef } from 'react';
import { Box, VStack, Text, HStack, Button } from '@chakra-ui/react';

interface RangeWeight {
  min: number;
  max: number;
  weight: number;
  label: string;
  key: string;
}

interface Props {
  x: number[];
  deviation: number[];
  selectedSampleName?: string;
  showGrid?: boolean;
  onResetZoom?: () => void;
  resetKey?: number;
  abnormalityWeights?: RangeWeight[];
}

const DeviationHeatBar = React.forwardRef<any, Props>(({ 
  x, 
  deviation, 
  selectedSampleName,
  showGrid = true,
  onResetZoom,
  resetKey = 0,
  abnormalityWeights = []
}, ref) => {
  const hasData = x.length > 0 && deviation.length > 0;
  
  const handleResetZoom = () => {
    if (onResetZoom) {
      onResetZoom();
    }
  };

  // Calculate the maximum deviation for normalization
  const maxDeviation = hasData ? Math.max(...deviation) : 1;
  const minDeviation = hasData ? Math.min(...deviation) : 0;
  
  // Function to get color based on deviation value
  const getColor = (value: number): string => {
    if (maxDeviation === 0) return 'rgb(0, 255, 0)'; // All green if no deviation
    
    // Normalize the value to 0-1 range
    const normalized = value / maxDeviation;
    
    if (normalized <= 0.33) {
      // Green to Yellow (0-33%)
      const ratio = normalized / 0.33;
      const red = Math.round(255 * ratio);
      const green = 255;
      return `rgb(${red}, ${green}, 0)`;
    } else if (normalized <= 0.66) {
      // Yellow to Orange (33-66%)
      const ratio = (normalized - 0.33) / 0.33;
      const red = 255;
      const green = Math.round(255 * (1 - ratio * 0.5)); // Fade to 127
      return `rgb(${red}, ${green}, 0)`;
    } else {
      // Orange to Red (66-100%)
      const ratio = (normalized - 0.66) / 0.34;
      const red = 255;
      const green = Math.round(127 * (1 - ratio)); // Fade from 127 to 0
      return `rgb(${red}, ${green}, 0)`;
    }
  };

  // Create gradient segments
  const createGradientSegments = () => {
    if (!hasData) return [];
    
    const segments = [];
    const totalWidth = 100; // Percentage
    const segmentWidth = totalWidth / x.length;
    
    for (let i = 0; i < x.length; i++) {
      const color = getColor(deviation[i]);
      const left = i * segmentWidth;
      
      segments.push(
        <Box
          key={i}
          position="absolute"
          left={`${left}%`}
          width={`${segmentWidth}%`}
          height="100%"
          backgroundColor={color}
          title={`Wavelength: ${Math.round(x[i])} cm⁻¹, Deviation: ${deviation[i].toFixed(4)}`}
          cursor="pointer"
          transition="all 0.2s"
          _hover={{
            transform: 'scaleY(1.1)',
            zIndex: 10
          }}
        />
      );
    }
    
    return segments;
  };

  // Create wavelength markers
  const createWavelengthMarkers = () => {
    if (!hasData) return [];
    
    const markers = [];
    const minX = Math.min(...x);
    const maxX = Math.max(...x);
    const range = maxX - minX;
    
    // Create markers at regular intervals
    const markerCount = 8;
    for (let i = 0; i <= markerCount; i++) {
      const wavelength = maxX - (range * i / markerCount); // Reverse order for IR
      const position = (i / markerCount) * 100;
      
      markers.push(
        <Box
          key={i}
          position="absolute"
          left={`${position}%`}
          transform="translateX(-50%)"
          fontSize="xs"
          color="gray.600"
          whiteSpace="nowrap"
        >
          {Math.round(wavelength)}
        </Box>
      );
    }
    
    return markers;
  };

  // Create color scale legend
  const createColorScale = () => {
    const steps = 20;
    const segments = [];
    
    for (let i = 0; i < steps; i++) {
      const value = (i / (steps - 1)) * maxDeviation;
      const color = getColor(value);
      const left = (i / (steps - 1)) * 100;
      
      segments.push(
        <Box
          key={i}
          position="absolute"
          left={`${left}%`}
          width={`${100/steps}%`}
          height="100%"
          backgroundColor={color}
        />
      );
    }
    
    return segments;
  };

  // Create weight range indicators
  const createWeightRanges = () => {
    if (!abnormalityWeights || abnormalityWeights.length === 0) return null;

    const minX = Math.min(...x);
    const maxX = Math.max(...x);
    const range = maxX - minX;
    
    return abnormalityWeights.map((weightRange, index) => {
      // Calculate position and width for this range
      const rangeStart = Math.max(weightRange.min, minX);
      const rangeEnd = Math.min(weightRange.max, maxX);
      
      if (rangeStart >= rangeEnd) return null;
      
      // Convert wavelengths to percentages (reverse for IR)
      const startPercent = ((maxX - rangeEnd) / range) * 100;
      const endPercent = ((maxX - rangeStart) / range) * 100;
      const widthPercent = endPercent - startPercent;
      
      // Color based on weight intensity
      const weightIntensity = weightRange.weight / 100;
      const alpha = 0.2 + (weightIntensity * 0.3); // More weight = more visible
      
      const colors = {
        'range_evaporation': `rgba(255, 99, 71, ${alpha})`, // Tomato
        'range_other': `rgba(255, 165, 0, ${alpha})`, // Orange  
        'range_oxidation': `rgba(255, 20, 147, ${alpha})` // Deep pink
      };
      
      const color = colors[weightRange.key as keyof typeof colors] || `rgba(128, 128, 128, ${alpha})`;
      
      return (
        <Box
          key={index}
          position="absolute"
          left={`${startPercent}%`}
          width={`${widthPercent}%`}
          height="100%"
          backgroundColor={color}
          borderLeft={index > 0 ? "1px solid rgba(0,0,0,0.2)" : undefined}
          title={`${weightRange.label}: ${weightRange.weight}% weight`}
        />
      );
    }).filter(Boolean);
  };

  return (
    <Box w="100%" bg="white" p={4} borderWidth="1px" rounded="md" shadow="sm">
      <VStack align="start" spacing={4}>
        <Box w="100%">
          <Text fontWeight="bold" fontSize="md">
            Grease Oxidation Heat Map
          </Text>
          <Text fontSize="xs" color="gray.600">
            Color intensity shows deviation magnitude: Green (low) → Yellow (medium) → Red (high oxidation)
          </Text>
        </Box>

        {hasData ? (
          <VStack w="100%" spacing={3}>
            {/* Main heat bar */}
            <Box w="100%" position="relative">
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                Deviation Intensity Map {selectedSampleName && `(${selectedSampleName.replace(/\.csv$/i, '')})`}
              </Text>
              <Box
                position="relative"
                w="100%"
                h="60px"
                border="1px solid"
                borderColor="gray.300"
                borderRadius="md"
                overflow="hidden"
                bg="white"
              >
                {/* Weight ranges background */}
                {createWeightRanges()}
                {/* Deviation gradient overlay */}
                {createGradientSegments()}
              </Box>
              
              {/* Wavelength axis */}
              <Box position="relative" mt={2} h="20px">
                {createWavelengthMarkers()}
              </Box>
              <Text fontSize="xs" color="gray.600" textAlign="center" mt={1}>
                Wavelength (cm⁻¹)
              </Text>
            </Box>

            {/* Color scale legend */}
            <Box w="100%" mt={4}>
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                Deviation Scale
              </Text>
              <HStack spacing={2} w="100%">
                <Text fontSize="xs" color="gray.600">
                  Low
                </Text>
                <Box
                  position="relative"
                  flex={1}
                  h="20px"
                  border="1px solid"
                  borderColor="gray.300"
                  borderRadius="md"
                  overflow="hidden"
                >
                  {createColorScale()}
                </Box>
                <Text fontSize="xs" color="gray.600">
                  High
                </Text>
              </HStack>
              <HStack justify="space-between" mt={1}>
                <Text fontSize="xs" color="gray.600">
                  0.000
                </Text>
                <Text fontSize="xs" color="gray.600">
                  {maxDeviation.toFixed(3)}
                </Text>
              </HStack>
            </Box>

            {/* Statistics */}
            <HStack spacing={6} fontSize="sm">
              <Box>
                <Text fontWeight="semibold" color="gray.700">Max Deviation:</Text>
                <Text color="red.600">{maxDeviation.toFixed(4)}</Text>
              </Box>
              <Box>
                <Text fontWeight="semibold" color="gray.700">Avg Deviation:</Text>
                <Text color="orange.600">
                  {(deviation.reduce((a, b) => a + b, 0) / deviation.length).toFixed(4)}
                </Text>
              </Box>
            </HStack>

            {/* Weight Ranges Legend */}
            {abnormalityWeights && abnormalityWeights.length > 0 && (
              <Box w="100%" mt={4}>
                <Text fontSize="sm" fontWeight="semibold" mb={2}>
                  Applied Weight Ranges
                </Text>
                <VStack spacing={2} align="stretch">
                  {abnormalityWeights.map((range, index) => {
                    const colors = {
                      'range_evaporation': 'rgba(255, 99, 71, 0.5)',
                      'range_other': 'rgba(255, 165, 0, 0.5)', 
                      'range_oxidation': 'rgba(255, 20, 147, 0.5)'
                    };
                    const color = colors[range.key as keyof typeof colors] || 'rgba(128, 128, 128, 0.5)';
                    
                    return (
                      <HStack key={index} spacing={3} fontSize="xs">
                        <Box
                          w="20px"
                          h="12px"
                          backgroundColor={color}
                          border="1px solid"
                          borderColor="gray.300"
                          borderRadius="sm"
                        />
                        <Text flex={1} color="gray.700">
                          {range.label}
                        </Text>
                        <Text fontWeight="semibold" color="blue.600">
                          {range.weight}%
                        </Text>
                      </HStack>
                    );
                  })}
                </VStack>
              </Box>
            )}
          </VStack>
        ) : (
          <Text fontSize="sm" color="gray.500">
            Upload baseline and multiple samples to see oxidation heat map.
          </Text>
        )}

        {/* Info box */}
        {hasData && (
          <Box w="100%" p={3} bg="blue.50" rounded="md" borderWidth="1px" borderColor="blue.200">
            <Text fontSize="xs" color="blue.800">
              🔬 <strong>Grease Analysis:</strong> Green areas indicate stable grease condition. 
              Yellow shows moderate oxidation. Red zones highlight critical oxidation points requiring maintenance attention.
              {abnormalityWeights && abnormalityWeights.length > 0 && 
                " Colored background regions show applied weight ranges - higher weights amplify deviations in those spectral areas."
              }
              Hover over the heat bar to see specific wavelength and deviation values.
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
});

DeviationHeatBar.displayName = 'DeviationHeatBar';

export default DeviationHeatBar;