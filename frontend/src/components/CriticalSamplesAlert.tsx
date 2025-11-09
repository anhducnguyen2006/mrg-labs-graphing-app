import React from 'react';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  VStack,
  HStack,
  Badge,
  Button,
  Text
} from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';

interface CriticalSample {
  filename: string;
  score: number;
}

interface Props {
  sampleScores: { [filename: string]: number };
  onSampleSelect: (filename: string) => void;
}

const CriticalSamplesAlert: React.FC<Props> = ({ sampleScores, onSampleSelect }) => {
  // Early return if no sampleScores or empty object
  if (!sampleScores || Object.keys(sampleScores).length === 0) {
    return null;
  }

  // Find samples with scores < 70 (critical threshold)
  const criticalSamples: CriticalSample[] = Object.entries(sampleScores)
    .filter(([_, score]) => score !== undefined && score < 70)
    .map(([filename, score]) => ({ filename, score }))
    .sort((a, b) => a.score - b.score); // Sort by lowest score first (show all critical samples)

  if (criticalSamples.length === 0) {
    return null; // No critical samples, don't show alert
  }

  return (
    <Alert status="error" borderRadius="md" p={3}>
      <AlertIcon as={WarningIcon} />
      <Box flex="1">
        <AlertDescription>
          <Text fontSize="sm" mb={3} color="gray.700">
            {criticalSamples.length} critical sample{criticalSamples.length > 1 ? 's' : ''} detected:
          </Text>
          <Box
            maxH="150px"
            overflowY="auto"
            pr={2}
            sx={{
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                width: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#CBD5E0',
                borderRadius: '24px',
              },
            }}
          >
            <VStack align="start" spacing={2}>
              {criticalSamples.map((sample) => (
                <HStack key={sample.filename} justify="space-between" w="100%">
                  <HStack>
                    <Badge colorScheme="red" fontSize="xs" fontWeight="bold">
                      {Math.round(sample.score)}
                    </Badge>
                    <Text fontSize="sm" fontWeight="medium" noOfLines={1} maxW="140px">
                      {sample.filename.replace('.csv', '')}
                    </Text>
                  </HStack>
                  <Button
                    size="xs"
                    colorScheme="red"
                    variant="outline"
                    onClick={() => onSampleSelect(sample.filename)}
                  >
                    Analyze
                  </Button>
                </HStack>
              ))}
            </VStack>
          </Box>
        </AlertDescription>
      </Box>
    </Alert>
  );
};

export default CriticalSamplesAlert;
