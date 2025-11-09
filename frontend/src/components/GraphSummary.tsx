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
  Tooltip,
  Progress,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  IconButton,
  Heading
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, InfoIcon } from '@chakra-ui/icons';
import { FiBarChart2 } from 'react-icons/fi';
import { ParsedCSV } from '../types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

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
    similarity: SimilarityMetrics;
  };
  ai_insights: string;
  metadata: {
    baseline_file: string;
    sample_file: string;
    analysis_timestamp: string;
  };
}

interface SimilarityMetrics {
  sse: number | null;
  nsse: number | null;
  nsse_similarity_level: number | null;
  frechet_distance: number | null;
  nfd: number | null;
  nfd_similarity_level: number | null;
  rmse: number | null;
  error?: string;
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

      const response = await fetch('/analysis/generate_insights', {
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

  const getSimilarityColor = (level: number | null): string => {
    if (level === null) return 'gray';
    if (level >= 90) return 'green';
    if (level >= 75) return 'blue';
    if (level >= 50) return 'yellow';
    if (level >= 25) return 'orange';
    return 'red';
  };

  const getSimilarityLabel = (level: number | null): string => {
    if (level === null) return 'N/A';
    if (level >= 90) return 'Excellent';
    if (level >= 75) return 'Very Good';
    if (level >= 50) return 'Good';
    if (level >= 25) return 'Fair';
    return 'Poor';
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

          {/* Similarity Metrics Section */}
          <Box p={4}>
            <HStack justify="space-between" mb={2}>
              <HStack>
                <Icon as={FiBarChart2} color="purple.500" />
                <Heading size="sm">Similarity Metrics</Heading>
              </HStack>
              <IconButton
                aria-label="Toggle similarity metrics"
                icon={isSimilarityOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                size="sm"
                variant="ghost"
                onClick={() => toggleSimilarity()}
              />
            </HStack>
            
            <Collapse in={isSimilarityOpen} animateOpacity>
              <VStack spacing={4} mt={2} align="stretch">
                {/* NSSE Similarity */}
                <Box p={4} bg="purple.50" borderRadius="md" borderWidth="1px" borderColor="purple.200">
                  <HStack justify="space-between" mb={2}>
                    <Text fontWeight="bold" fontSize="sm" color="purple.700">
                      NSSE Similarity Level
                    </Text>
                    <Badge colorScheme={getSimilarityColor(analysis.statistics.similarity.nsse_similarity_level)}>
                      {getSimilarityLabel(analysis.statistics.similarity.nsse_similarity_level)}
                    </Badge>
                  </HStack>
                  <Progress 
                    value={analysis.statistics.similarity.nsse_similarity_level || 0} 
                    colorScheme={getSimilarityColor(analysis.statistics.similarity.nsse_similarity_level)}
                    size="lg"
                    borderRadius="md"
                    mb={2}
                  />
                  <HStack justify="space-between">
                    <Text fontSize="xs" color="gray.600">
                      Based on Normalized Sum of Squared Errors
                    </Text>
                    <Text fontSize="md" fontWeight="bold" color="purple.600">
                      {analysis.statistics.similarity.nsse_similarity_level !== null 
                        ? `${analysis.statistics.similarity.nsse_similarity_level.toFixed(1)}%`
                        : 'N/A'}
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    NSSE: {analysis.statistics.similarity.nsse !== null 
                      ? analysis.statistics.similarity.nsse.toFixed(4)
                      : 'N/A'}
                  </Text>
                </Box>

                {/* NFD Similarity */}
                <Box p={4} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
                  <HStack justify="space-between" mb={2}>
                    <Text fontWeight="bold" fontSize="sm" color="blue.700">
                      NFD Similarity Level
                    </Text>
                    <Badge colorScheme={getSimilarityColor(analysis.statistics.similarity.nfd_similarity_level)}>
                      {getSimilarityLabel(analysis.statistics.similarity.nfd_similarity_level)}
                    </Badge>
                  </HStack>
                  <Progress 
                    value={analysis.statistics.similarity.nfd_similarity_level || 0} 
                    colorScheme={getSimilarityColor(analysis.statistics.similarity.nfd_similarity_level)}
                    size="lg"
                    borderRadius="md"
                    mb={2}
                  />
                  <HStack justify="space-between">
                    <Text fontSize="xs" color="gray.600">
                      Based on Normalized Fréchet Distance
                    </Text>
                    <Text fontSize="md" fontWeight="bold" color="blue.600">
                      {analysis.statistics.similarity.nfd_similarity_level !== null 
                        ? `${analysis.statistics.similarity.nfd_similarity_level.toFixed(1)}%`
                        : 'N/A'}
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    NFD: {analysis.statistics.similarity.nfd !== null 
                      ? analysis.statistics.similarity.nfd.toFixed(4)
                      : 'N/A'}
                  </Text>
                </Box>

                {/* Technical Details */}
                <Accordion allowToggle>
                  <AccordionItem border="none">
                    <AccordionButton bg="gray.50" borderRadius="md" _hover={{ bg: 'gray.100' }}>
                      <Box flex="1" textAlign="left">
                        <Text fontSize="xs" fontWeight="medium">Technical Details</Text>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      <SimpleGrid columns={[1, 2]} spacing={3}>
                        <Stat size="sm">
                          <StatLabel fontSize="xs">SSE</StatLabel>
                          <StatNumber fontSize="sm">
                            {analysis.statistics.similarity.sse !== null 
                              ? formatNumber(analysis.statistics.similarity.sse, 2)
                              : 'N/A'}
                          </StatNumber>
                        </Stat>
                        <Stat size="sm">
                          <StatLabel fontSize="xs">RMSE</StatLabel>
                          <StatNumber fontSize="sm">
                            {analysis.statistics.similarity.rmse !== null 
                              ? formatNumber(analysis.statistics.similarity.rmse, 4)
                              : 'N/A'}
                          </StatNumber>
                        </Stat>
                        <Stat size="sm">
                          <StatLabel fontSize="xs">Fréchet Distance</StatLabel>
                          <StatNumber fontSize="sm">
                            {analysis.statistics.similarity.frechet_distance !== null 
                              ? formatNumber(analysis.statistics.similarity.frechet_distance, 4)
                              : 'N/A'}
                          </StatNumber>
                        </Stat>
                      </SimpleGrid>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>

                <Box mt={2} p={3} bg="gray.50" borderRadius="md">
                  <Text fontSize="xs" color="gray.700" fontWeight="medium" mb={1}>
                    📊 Understanding Similarity Levels:
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    • <strong>NSSE:</strong> Measures point-by-point differences normalized by baseline variance<br/>
                    • <strong>NFD:</strong> Captures overall curve shape similarity normalized by data range<br/>
                    • <strong>100%:</strong> Identical graphs | <strong>0%:</strong> Completely different
                  </Text>
                </Box>
              </VStack>
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