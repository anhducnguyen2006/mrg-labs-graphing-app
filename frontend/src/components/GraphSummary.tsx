import React, { useState, useEffect, useMemo } from 'react';
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
  Icon,
  Tooltip
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, InfoIcon } from '@chakra-ui/icons';
import { ParsedCSV } from '../types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface GraphSummaryProps {
  baseline?: ParsedCSV;
  selectedSample?: ParsedCSV;
  baselineFile?: File;
  selectedSampleFile?: File;
}

interface SimilarityMetrics {
  sse: number | null;
  frechet_distance: number | null;
  normalized_sse: number | null;
  rmse: number | null;
  error?: string;
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
    similarity?: SimilarityMetrics;
  };
  ai_insights: string;
  metadata: {
    baseline_file: string;
    sample_file: string;
    analysis_timestamp: string;
  };
}

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true,
});

const GraphSummary: React.FC<GraphSummaryProps> = ({
  baseline,
  selectedSample,
  baselineFile,
  selectedSampleFile
}) => {
  const { isOpen: isInsightsOpen, onToggle: toggleInsights } = useDisclosure({ defaultIsOpen: false });
  const { isOpen: isStatsOpen, onToggle: toggleStats } = useDisclosure({ defaultIsOpen: true });
  const { isOpen: isSimilarityOpen, onToggle: toggleSimilarity } = useDisclosure({ defaultIsOpen: true });
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const canAnalyze = baseline && selectedSample && baselineFile && selectedSampleFile;

  // Parse Markdown to HTML with sanitization
  const renderMarkdown = (markdown: string): string => {
    const rawHtml = marked.parse(markdown) as string;
    return DOMPurify.sanitize(rawHtml);
  };

  // Memoize the parsed HTML to avoid re-rendering
  const parsedInsights = useMemo(() => {
    if (!analysis?.ai_insights) return '';
    return renderMarkdown(analysis.ai_insights);
  }, [analysis?.ai_insights]);

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
        description: 'AI-powered graph analysis with similarity metrics generated successfully!',
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

  const getSimilarityColor = (value: number | null, metricType: 'sse' | 'frechet'): string => {
    if (value === null) return 'gray';
    
    // Lower values are better for both SSE and Fréchet
    if (metricType === 'sse') {
      if (value < 10) return 'green';
      if (value < 50) return 'yellow';
      return 'red';
    } else { // frechet
      if (value < 1) return 'green';
      if (value < 5) return 'yellow';
      return 'red';
    }
  };

  const getSimilarityLabel = (value: number | null, metricType: 'sse' | 'frechet'): string => {
    if (value === null) return 'N/A';
    
    if (metricType === 'sse') {
      if (value < 10) return 'Very Similar';
      if (value < 50) return 'Moderately Similar';
      if (value < 200) return 'Somewhat Different';
      return 'Very Different';
    } else { // frechet
      if (value < 1) return 'Very Similar';
      if (value < 5) return 'Moderately Similar';
      if (value < 10) return 'Somewhat Different';
      return 'Very Different';
    }
  };

  if (!canAnalyze) {
    return (
      <Box p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
        <HStack>
          <Icon as={InfoIcon} color="gray.400" />
          <Text color="gray.600" fontSize="sm">
            Upload both baseline and sample data to see AI-powered analysis with similarity metrics
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
              Analyzing your graph with AI and calculating similarity metrics... This may take a moment.
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
          {/* Similarity Metrics Section */}
          {analysis.statistics.similarity && (
            <>
              <Box p={4}>
                <Button
                  variant="ghost"
                  rightIcon={isSimilarityOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  onClick={toggleSimilarity}
                  size="sm"
                  fontWeight="bold"
                  color="gray.700"
                  mb={2}
                >
                  Similarity Analysis
                </Button>
                
                <Collapse in={isSimilarityOpen} animateOpacity>
                  <SimpleGrid columns={[1, 2, 4]} spacing={4} mt={2}>
                    <Tooltip label="Sum of squared differences between curves. Lower is more similar.">
                      <Stat>
                        <StatLabel>Sum of Squared Errors</StatLabel>
                        <StatNumber 
                          fontSize="md"
                          color={`${getSimilarityColor(analysis.statistics.similarity.sse, 'sse')}.500`}
                        >
                          {analysis.statistics.similarity.sse !== null 
                            ? formatNumber(analysis.statistics.similarity.sse, 2)
                            : 'N/A'}
                        </StatNumber>
                        <StatHelpText>
                          {getSimilarityLabel(analysis.statistics.similarity.sse, 'sse')}
                        </StatHelpText>
                      </Stat>
                    </Tooltip>

                    <Tooltip label="Root mean square error - normalized measure of curve differences.">
                      <Stat>
                        <StatLabel>RMSE</StatLabel>
                        <StatNumber fontSize="md">
                          {analysis.statistics.similarity.rmse !== null 
                            ? formatNumber(analysis.statistics.similarity.rmse, 4)
                            : 'N/A'}
                        </StatNumber>
                        <StatHelpText>
                          Root Mean Square Error
                        </StatHelpText>
                      </Stat>
                    </Tooltip>

                    <Tooltip label="Fréchet distance measures geometric similarity between curves. Lower is more similar.">
                      <Stat>
                        <StatLabel>Fréchet Distance</StatLabel>
                        <StatNumber 
                          fontSize="md"
                          color={`${getSimilarityColor(analysis.statistics.similarity.frechet_distance, 'frechet')}.500`}
                        >
                          {analysis.statistics.similarity.frechet_distance !== null 
                            ? formatNumber(analysis.statistics.similarity.frechet_distance, 4)
                            : 'N/A'}
                        </StatNumber>
                        <StatHelpText>
                          {getSimilarityLabel(analysis.statistics.similarity.frechet_distance, 'frechet')}
                        </StatHelpText>
                      </Stat>
                    </Tooltip>

                    <Tooltip label="SSE normalized by number of data points.">
                      <Stat>
                        <StatLabel>Normalized SSE</StatLabel>
                        <StatNumber fontSize="md">
                          {analysis.statistics.similarity.normalized_sse !== null 
                            ? formatNumber(analysis.statistics.similarity.normalized_sse, 4)
                            : 'N/A'}
                        </StatNumber>
                        <StatHelpText>
                          Per data point
                        </StatHelpText>
                      </Stat>
                    </Tooltip>
                  </SimpleGrid>

                  {/* Similarity interpretation */}
                  <Box mt={4} p={3} bg="blue.50" borderRadius="md">
                    <Text fontSize="xs" color="blue.700" fontWeight="medium">
                      📊 Similarity Interpretation:
                    </Text>
                    <Text fontSize="xs" color="blue.600" mt={1}>
                      • <strong>SSE & RMSE:</strong> Measure point-by-point differences. Lower values indicate curves are closer together.
                    </Text>
                    <Text fontSize="xs" color="blue.600">
                      • <strong>Fréchet Distance:</strong> Considers curve shape and trajectory. Useful for identifying pattern similarities even with shifts.
                    </Text>
                  </Box>
                </Collapse>
              </Box>

              <Divider />
            </>
          )}

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

          {/* AI Insights with Markdown Rendering */}
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
                {/* Render Markdown as HTML */}
                <Box
                  className="markdown-content"
                  fontSize="sm"
                  color="gray.700"
                  lineHeight="1.6"
                  dangerouslySetInnerHTML={{ __html: parsedInsights }}
                  sx={{
                    '& h1': { fontSize: '1.5em', fontWeight: 'bold', marginTop: '0.5em', marginBottom: '0.5em' },
                    '& h2': { fontSize: '1.3em', fontWeight: 'bold', marginTop: '0.5em', marginBottom: '0.5em' },
                    '& h3': { fontSize: '1.1em', fontWeight: 'bold', marginTop: '0.5em', marginBottom: '0.5em' },
                    '& p': { marginBottom: '0.75em' },
                    '& ul, & ol': { paddingLeft: '1.5em', marginBottom: '0.75em' },
                    '& li': { marginBottom: '0.25em' },
                    '& strong': { fontWeight: 'bold', color: 'gray.800' },
                    '& em': { fontStyle: 'italic' },
                    '& code': { 
                      backgroundColor: 'gray.200', 
                      padding: '0.125em 0.25em', 
                      borderRadius: '0.25em',
                      fontSize: '0.9em',
                      fontFamily: 'monospace'
                    },
                    '& pre': {
                      backgroundColor: 'gray.800',
                      color: 'white',
                      padding: '0.75em',
                      borderRadius: '0.375em',
                      overflow: 'auto',
                      marginBottom: '0.75em'
                    },
                    '& blockquote': {
                      borderLeft: '4px solid',
                      borderColor: 'blue.400',
                      paddingLeft: '1em',
                      fontStyle: 'italic',
                      color: 'gray.600',
                      marginBottom: '0.75em'
                    }
                  }}
                />
                
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