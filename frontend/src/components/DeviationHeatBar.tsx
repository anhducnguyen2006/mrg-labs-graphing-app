import React, { useRef } from 'react';
import { Box, VStack, Text, HStack, Button, Badge } from '@chakra-ui/react';

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

  // Create gradient segments with better hover interaction
  const createGradientSegments = () => {
    if (!hasData) return [];
    
    const segments = [];
    const totalWidth = 100; // Percentage
    const segmentWidth = totalWidth / x.length;
    
    for (let i = 0; i < x.length; i++) {
      const color = getColor(deviation[i]);
      const left = i * segmentWidth;
      const deviationPercent = ((deviation[i] / maxDeviation) * 100).toFixed(1);
      
      segments.push(
        <Box
          key={i}
          position="absolute"
          left={`${left}%`}
          width={`${segmentWidth}%`}
          height="100%"
          backgroundColor={color}
          title={`${Math.round(x[i])} cm⁻¹\nDeviation: ${deviation[i].toFixed(4)} (${deviationPercent}% of max)`}
          cursor="crosshair"
          transition="all 0.15s ease"
          _hover={{
            transform: 'scaleY(1.15)',
            zIndex: 10,
            boxShadow: '0 0 8px rgba(0,0,0,0.3)',
            filter: 'brightness(1.2)'
          }}
        />
      );
    }
    
    return segments;
  };

  // Create wavelength markers - matching main graph ticks
  const createWavelengthMarkers = () => {
    if (!hasData) return [];
    
    const markers: JSX.Element[] = [];
    const minX = Math.min(...x);
    const maxX = Math.max(...x);
    const range = maxX - minX;
    
    // Use standard FTIR ticks that match the main graph
    const customXTicks = [4000, 3500, 3000, 2500, 2000, 1750, 1500, 1250, 1000, 750, 550];
    
    customXTicks.forEach((wavelength) => {
      if (wavelength >= minX && wavelength <= maxX) {
        const position = ((maxX - wavelength) / range) * 100; // Reverse for IR
        
        markers.push(
          <Box
            key={wavelength}
            position="absolute"
            left={`${position}%`}
            transform="translateX(-50%)"
          >
            {/* Vertical guide line */}
            <Box
              position="absolute"
              bottom="20px"
              left="50%"
              width="1px"
              height="80px"
              bg="gray.400"
              opacity={0.3}
            />
            {/* Label */}
            <Text
              fontSize="xs"
              fontWeight="medium"
              color="gray.700"
              whiteSpace="nowrap"
              bg="white"
              px={1}
              borderRadius="sm"
            >
              {wavelength}
            </Text>
          </Box>
        );
      }
    });
    
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
        <Box w="100%" pb={2} borderBottom="2px solid" borderColor="gray.300">
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold" fontSize="lg" color="gray.800">
                Spectral Deviation Heat Map
              </Text>
              <Text fontSize="xs" color="gray.600">
                Visual representation of deviation intensity across the spectrum
              </Text>
            </VStack>
            <HStack spacing={2}>
              <Box textAlign="center" px={3} py={1} bg="green.100" borderRadius="md">
                <Text fontSize="xs" fontWeight="bold" color="green.800">Good</Text>
              </Box>
              <Box textAlign="center" px={3} py={1} bg="yellow.100" borderRadius="md">
                <Text fontSize="xs" fontWeight="bold" color="yellow.800">Monitor</Text>
              </Box>
              <Box textAlign="center" px={3} py={1} bg="red.100" borderRadius="md">
                <Text fontSize="xs" fontWeight="bold" color="red.800">Critical</Text>
              </Box>
            </HStack>
          </HStack>
        </Box>

        {hasData ? (
          <VStack w="100%" spacing={4}>
            {/* Main heat bar with improved visuals */}
            <Box w="100%" position="relative">
              <HStack justify="space-between" mb={3}>
                <Text fontSize="md" fontWeight="bold" color="gray.800">
                  Deviation Intensity Map
                </Text>
                {selectedSampleName && (
                  <Badge colorScheme="blue" fontSize="xs" px={2} py={1}>
                    {selectedSampleName.replace(/\.csv$/i, '')}
                  </Badge>
                )}
              </HStack>
              
              <Box position="relative" w="100%">
                {/* Wavelength axis labels above */}
                <Box position="relative" h="25px" mb={1}>
                  {createWavelengthMarkers()}
                </Box>
                
                {/* Main heat bar with better height and styling */}
                <Box
                  position="relative"
                  w="100%"
                  h="80px"
                  border="2px solid"
                  borderColor="gray.400"
                  borderRadius="lg"
                  overflow="visible"
                  bg="white"
                  boxShadow="md"
                >
                  {/* Weight ranges background */}
                  {createWeightRanges()}
                  {/* Deviation gradient overlay */}
                  {createGradientSegments()}
                </Box>
                
                {/* Axis label */}
                <Text fontSize="sm" fontWeight="semibold" color="gray.700" textAlign="center" mt={2}>
                  Wavenumber (cm⁻¹)
                </Text>
              </Box>
            </Box>

            {/* Statistics Cards */}
            <HStack w="100%" spacing={4}>
              <Box 
                flex={1} 
                p={3} 
                bg="red.50" 
                borderRadius="lg" 
                borderWidth="1px" 
                borderColor="red.200"
              >
                <Text fontSize="xs" fontWeight="medium" color="red.700" mb={1}>
                  Max Deviation
                </Text>
                <Text fontSize="lg" fontWeight="bold" color="red.600">
                  {maxDeviation.toFixed(4)}
                </Text>
              </Box>
              <Box 
                flex={1} 
                p={3} 
                bg="orange.50" 
                borderRadius="lg" 
                borderWidth="1px" 
                borderColor="orange.200"
              >
                <Text fontSize="xs" fontWeight="medium" color="orange.700" mb={1}>
                  Avg Deviation
                </Text>
                <Text fontSize="lg" fontWeight="bold" color="orange.600">
                  {(deviation.reduce((a, b) => a + b, 0) / deviation.length).toFixed(4)}
                </Text>
              </Box>
              <Box 
                flex={1} 
                p={3} 
                bg="green.50" 
                borderRadius="lg" 
                borderWidth="1px" 
                borderColor="green.200"
              >
                <Text fontSize="xs" fontWeight="medium" color="green.700" mb={1}>
                  Min Deviation
                </Text>
                <Text fontSize="lg" fontWeight="bold" color="green.600">
                  {minDeviation.toFixed(4)}
                </Text>
              </Box>
            </HStack>

            {/* Color scale legend */}
            <Box w="100%" p={3} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
              <Text fontSize="sm" fontWeight="bold" mb={2} color="gray.700">
                Deviation Color Scale
              </Text>
              <VStack spacing={2} align="stretch">
                <HStack spacing={2}>
                  <Box
                    position="relative"
                    flex={1}
                    h="30px"
                    border="2px solid"
                    borderColor="gray.300"
                    borderRadius="md"
                    overflow="hidden"
                    boxShadow="sm"
                  >
                    {createColorScale()}
                  </Box>
                </HStack>
                <HStack justify="space-between">
                  <HStack spacing={1}>
                    <Box w="12px" h="12px" bg="rgb(0, 255, 0)" borderRadius="sm" />
                    <Text fontSize="xs" fontWeight="medium" color="gray.700">
                      Low (0.000)
                    </Text>
                  </HStack>
                  <HStack spacing={1}>
                    <Box w="12px" h="12px" bg="rgb(255, 255, 0)" borderRadius="sm" />
                    <Text fontSize="xs" fontWeight="medium" color="gray.700">
                      Medium
                    </Text>
                  </HStack>
                  <HStack spacing={1}>
                    <Box w="12px" h="12px" bg="rgb(255, 0, 0)" borderRadius="sm" />
                    <Text fontSize="xs" fontWeight="medium" color="gray.700">
                      High ({maxDeviation.toFixed(3)})
                    </Text>
                  </HStack>
                </HStack>
              </VStack>
            </Box>

            {/* Weight Ranges Legend */}
            {abnormalityWeights && abnormalityWeights.length > 0 && (
              <Box w="100%" p={4} bg="purple.50" borderRadius="lg" borderWidth="2px" borderColor="purple.200">
                <Text fontSize="sm" fontWeight="bold" mb={3} color="purple.900">
                  ⚖️ Applied Weight Ranges
                </Text>
                <VStack spacing={2} align="stretch">
                  {abnormalityWeights.map((range, index) => {
                    const colors = {
                      'range_evaporation': 'rgba(255, 99, 71, 0.6)',
                      'range_other': 'rgba(255, 165, 0, 0.6)', 
                      'range_oxidation': 'rgba(255, 20, 147, 0.6)'
                    };
                    const color = colors[range.key as keyof typeof colors] || 'rgba(128, 128, 128, 0.6)';
                    
                    return (
                      <HStack 
                        key={index} 
                        spacing={3} 
                        p={2} 
                        bg="white" 
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="purple.100"
                      >
                        <Box
                          w="24px"
                          h="24px"
                          backgroundColor={color}
                          border="2px solid"
                          borderColor="gray.400"
                          borderRadius="md"
                          flexShrink={0}
                        />
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontSize="xs" fontWeight="bold" color="gray.800">
                            {range.label}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            {range.min} - {range.max} cm⁻¹
                          </Text>
                        </VStack>
                        <Badge colorScheme="purple" fontSize="xs" px={2} py={1}>
                          {range.weight}% weight
                        </Badge>
                      </HStack>
                    );
                  })}
                </VStack>
                <Text fontSize="xs" color="purple.700" mt={2} fontStyle="italic">
                  💡 Background colors on heat map show these weighted regions
                </Text>
              </Box>
            )}
          </VStack>
        ) : (
          <Text fontSize="sm" color="gray.500">
            Upload baseline and multiple samples to see oxidation heat map.
          </Text>
        )}

        {/* Interactive guidance */}
        {hasData && (
          <Box w="100%" p={4} bg="blue.50" rounded="lg" borderWidth="2px" borderColor="blue.300">
            <HStack spacing={2} mb={2}>
              <Text fontSize="lg">💡</Text>
              <Text fontSize="sm" fontWeight="bold" color="blue.900">
                How to Read This Map
              </Text>
            </HStack>
            <VStack align="start" spacing={1}>
              <HStack spacing={2}>
                <Box w="8px" h="8px" bg="rgb(0, 255, 0)" borderRadius="full" />
                <Text fontSize="xs" color="blue.800">
                  <strong>Green zones:</strong> Stable grease, minimal deviation from baseline
                </Text>
              </HStack>
              <HStack spacing={2}>
                <Box w="8px" h="8px" bg="rgb(255, 255, 0)" borderRadius="full" />
                <Text fontSize="xs" color="blue.800">
                  <strong>Yellow zones:</strong> Moderate changes, monitor for trending
                </Text>
              </HStack>
              <HStack spacing={2}>
                <Box w="8px" h="8px" bg="rgb(255, 0, 0)" borderRadius="full" />
                <Text fontSize="xs" color="blue.800">
                  <strong>Red zones:</strong> Critical oxidation/contamination detected
                </Text>
              </HStack>
              <Text fontSize="xs" color="blue.700" mt={2} fontStyle="italic">
                💡 Hover over any section to see exact wavenumber and deviation values
              </Text>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
});

DeviationHeatBar.displayName = 'DeviationHeatBar';

export default DeviationHeatBar;