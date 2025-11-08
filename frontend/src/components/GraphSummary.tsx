import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Collapse,
  useDisclosure,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Divider,
  useToast,
  Icon
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, InfoIcon } from '@chakra-ui/icons';
import { ParsedCSV } from '../types';

interface GraphSummaryProps {
  baseline?: ParsedCSV;
  selectedSample?: ParsedCSV;
  baselineFile?: File;
  selectedSampleFile?: File;
}

interface AnalysisData {
  sample_name: string;
  statistics: {
    baseline_stats: {
      count: number;
      mean_y: number;
      std_y: number;
      min_y: number;
      max_y: number;
      range_x: [number, number];
    };
    sample_stats: {
      count: number;
      mean_y: number;
      std_y: number;
      min_y: number;
      max_y: number;
      range_x: [number, number];
    };
    differences: {
      mean_diff: number;
      std_diff: number;
      range_diff: number;
    };
  };
  ai_insights: string;
  metadata: {
    baseline_file: string;
    sample_file: string;
    analysis_timestamp: string;
  };
}

const GraphSummary: React.FC<GraphSummaryProps> = ({
  baseline,
  selectedSample,
  baselineFile,
  selectedSampleFile
}) => {
  const { isOpen: isInsightsOpen, onToggle: toggleInsights } = useDisclosure({ defaultIsOpen: false });
  const { isOpen: isStatsOpen, onToggle: toggleStats } = useDisclosure({ defaultIsOpen: true });
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const canAnalyze = baseline && selectedSample && baselineFile && selectedSampleFile;

  const generateAnalysis = async () => {
    if (!canAnalyze) {
      setError('Both baseline and sample data are required for analysis');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('baseline', baselineFile);
      formData.append('sample', selectedSampleFile);
      formData.append('sample_name', selectedSample.filename);

      const response = await fetch('http://localhost:8080/analysis/generate_insights', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data: AnalysisData = await response.json();
      setAnalysis(data);
      
      toast({
        title: 'Analysis Complete',
        description: 'AI-powered graph analysis generated successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Analysis Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate analysis when data changes
  useEffect(() => {
    if (canAnalyze && !analysis) {
      generateAnalysis();
    }
  }, [baseline?.filename, selectedSample?.filename]);

  const formatNumber = (num: number, decimals: number = 3): string => {
    return num.toFixed(decimals);
  };

  const getStatColor = (value: number): string => {
    if (Math.abs(value) < 0.1) return 'green';
    if (Math.abs(value) < 0.5) return 'yellow';
    return 'red';
  };

  if (!canAnalyze) {
    return (
      <Box p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
        <HStack>
          <Icon as={InfoIcon} color="gray.400" />
          <Text color="gray.600" fontSize="sm">
            Upload both baseline and sample data to see AI-powered analysis
          </Text>
        </HStack>
      </Box>
    );
  }

  return (
    <Box bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" overflow="hidden">
      {/* Header */}
      <Box p={4} bg="blue.50" borderBottom="1px solid" borderColor="gray.200">
        <HStack justify="space-between" align="center">
          <HStack>
            <Icon as={InfoIcon} color="blue.500" />
            <Text fontWeight="bold" color="blue.700">
              AI-Powered Graph Analysis
            </Text>
            {analysis && (
              <Badge colorScheme="green" variant="solid">
                Analysis Ready
              </Badge>
            )}
          </HStack>
          <Button
            size="sm"
            colorScheme="blue"
            variant="outline"
            onClick={generateAnalysis}
            isLoading={isLoading}
            disabled={isLoading}
          >
            {analysis ? 'Refresh Analysis' : 'Generate Analysis'}
          </Button>
        </HStack>
      </Box>

      {/* Loading State */}
      {isLoading && (
        <Box p={6} textAlign="center">
          <VStack spacing={3}>
            <Spinner size="lg" color="blue.500" />
            <Text color="gray.600">
              Analyzing your graph with AI... This may take a moment.
            </Text>
          </VStack>
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Box p={4}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Analysis Failed!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
        </Box>
      )}

      {/* Analysis Results */}
      {analysis && !isLoading && (
        <VStack spacing={0} align="stretch">
          {/* Statistical Summary */}
          <Box p={4}>
            <Button
              variant="ghost"
              rightIcon={isStatsOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              onClick={toggleStats}
              size="sm"
              fontWeight="bold"
              color="gray.700"
              mb={2}
            >
              Statistical Summary
            </Button>
            
            <Collapse in={isStatsOpen} animateOpacity>
              <SimpleGrid columns={[1, 2, 3]} spacing={4} mt={2}>
                <Stat>
                  <StatLabel>Baseline Mean</StatLabel>
                  <StatNumber fontSize="md">
                    {formatNumber(analysis.statistics.baseline_stats.mean_y)}
                  </StatNumber>
                  <StatHelpText>
                    ±{formatNumber(analysis.statistics.baseline_stats.std_y)}
                  </StatHelpText>
                </Stat>
                
                <Stat>
                  <StatLabel>Sample Mean</StatLabel>
                  <StatNumber fontSize="md">
                    {formatNumber(analysis.statistics.sample_stats.mean_y)}
                  </StatNumber>
                  <StatHelpText>
                    ±{formatNumber(analysis.statistics.sample_stats.std_y)}
                  </StatHelpText>
                </Stat>
                
                <Stat>
                  <StatLabel>Mean Difference</StatLabel>
                  <StatNumber 
                    fontSize="md"
                    color={`${getStatColor(analysis.statistics.differences.mean_diff)}.500`}
                  >
                    {formatNumber(analysis.statistics.differences.mean_diff, 4)}
                  </StatNumber>
                  <StatHelpText>
                    {analysis.statistics.differences.mean_diff > 0 ? 'Higher' : 'Lower'} than baseline
                  </StatHelpText>
                </Stat>
              </SimpleGrid>
            </Collapse>
          </Box>

          <Divider />

          {/* AI Insights */}
          <Box p={4}>
            <Button
              variant="ghost"
              rightIcon={isInsightsOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              onClick={toggleInsights}
              size="sm"
              fontWeight="bold"
              color="gray.700"
              mb={2}
            >
              AI Insights & Interpretation
            </Button>
            
            <Collapse in={isInsightsOpen} animateOpacity>
              <Box
                p={4}
                bg="gray.50"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
                mt={2}
              >
                <Text
                  fontSize="sm"
                  color="gray.700"
                  whiteSpace="pre-wrap"
                  lineHeight="1.6"
                >
                  {analysis.ai_insights}
                </Text>
                
                <Box mt={4} pt={3} borderTop="1px solid" borderColor="gray.300">
                  <HStack justify="space-between" fontSize="xs" color="gray.500">
                    <Text>
                      Comparing: {analysis.metadata.baseline_file} vs {analysis.metadata.sample_file}
                    </Text>
                    <Text>
                      {new Date(analysis.metadata.analysis_timestamp).toLocaleString()}
                    </Text>
                  </HStack>
                </Box>
              </Box>
            </Collapse>
          </Box>
        </VStack>
      )}
    </Box>
  );
};

export default GraphSummary;