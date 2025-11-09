import React, { useRef } from 'react';
import { Box, VStack, Text, HStack, Button } from '@chakra-ui/react';

interface Props {
  x: number[];
  deviation: number[];
  selectedSampleName?: string;
  showGrid?: boolean;
  onResetZoom?: () => void;
  resetKey?: number;
}

const DeviationHeatBar = React.forwardRef<any, Props>(({ 
  x, 
  deviation, 
  selectedSampleName,
  showGrid = true,
  onResetZoom,
  resetKey = 0
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

  return (
    <Box w="100%" bg="white" p={4} borderWidth="1px" rounded="md" shadow="sm">
      <VStack align="start" spacing={4}>
        <HStack justify="space-between" w="100%">
          <Box>
            <Text fontWeight="bold" fontSize="md">
              Grease Oxidation Heat Map
            </Text>
            <Text fontSize="xs" color="gray.600">
              Color intensity shows deviation magnitude: Green (low) → Yellow (medium) → Red (high oxidation)
            </Text>
          </Box>
          {hasData && (
            <Button size="sm" onClick={handleResetZoom} variant="outline">
              Reset View
            </Button>
          )}
        </HStack>

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
              <Box>
                <Text fontWeight="semibold" color="gray.700">Data Points:</Text>
                <Text color="blue.600">{x.length}</Text>
              </Box>
            </HStack>
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