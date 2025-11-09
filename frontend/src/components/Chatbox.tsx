import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  IconButton,
  Collapse,
  useDisclosure,
  Badge,
  Spinner,
  Textarea,
  Divider,
  Avatar,
  useToast,
  Tooltip
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, ChatIcon } from '@chakra-ui/icons';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ParsedCSV {
  filename: string;
  x: number[];
  y: number[];
}

interface GraphData {
  baseline?: ParsedCSV;
  selectedSample?: ParsedCSV;
  selectedSampleName?: string;
  allSamples: ParsedCSV[];
}

interface ChatboxProps {
  graphContext?: string; // Current graph analysis context  
  graphData?: GraphData; // Complete graph data for intelligent analysis
}

const Chatbox: React.FC<ChatboxProps> = ({ graphContext, graphData }) => {
  const { isOpen, onToggle } = useDisclosure();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Create detailed context from graph data
  const createGraphContext = () => {
    if (!graphData || !graphData.baseline || !graphData.selectedSample) {
      return graphContext || "No graph data currently loaded.";
    }

    const { baseline, selectedSample, selectedSampleName, allSamples } = graphData;
    
    // Calculate basic statistics
    const baselineStats = {
      name: baseline.filename,
      dataPoints: baseline.x.length,
      xRange: [Math.min(...baseline.x), Math.max(...baseline.x)],
      yRange: [Math.min(...baseline.y), Math.max(...baseline.y)],
      yMean: baseline.y.reduce((sum, val) => sum + val, 0) / baseline.y.length
    };
    
    const sampleStats = {
      name: selectedSample.filename,
      dataPoints: selectedSample.x.length,
      xRange: [Math.min(...selectedSample.x), Math.max(...selectedSample.x)],
      yRange: [Math.min(...selectedSample.y), Math.max(...selectedSample.y)],
      yMean: selectedSample.y.reduce((sum, val) => sum + val, 0) / selectedSample.y.length
    };

    const meanDifference = sampleStats.yMean - baselineStats.yMean;

    return `Current Graph Analysis Context:

BASELINE DATA: "${baselineStats.name}"
- Data Points: ${baselineStats.dataPoints}
- X Range: [${baselineStats.xRange[0].toFixed(1)}, ${baselineStats.xRange[1].toFixed(1)}]
- Y Range: [${baselineStats.yRange[0].toFixed(3)}, ${baselineStats.yRange[1].toFixed(3)}]
- Y Mean: ${baselineStats.yMean.toFixed(3)}

SAMPLE DATA: "${sampleStats.name}" (currently selected)
- Data Points: ${sampleStats.dataPoints}
- X Range: [${sampleStats.xRange[0].toFixed(1)}, ${sampleStats.xRange[1].toFixed(1)}]
- Y Range: [${sampleStats.yRange[0].toFixed(3)}, ${sampleStats.yRange[1].toFixed(3)}]
- Y Mean: ${sampleStats.yMean.toFixed(3)}

COMPARISON:
- Mean Difference: ${meanDifference.toFixed(3)} (${meanDifference > 0 ? 'Sample higher' : meanDifference < 0 ? 'Sample lower' : 'No significant difference'})
- Available Samples: ${allSamples.map(s => s.filename).join(', ')}

This data appears to be spectroscopy or similar scientific measurement data based on the X-axis range and patterns.`;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/chat/send_message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversation_history: messages.slice(-10), // Last 10 messages for context
          context: createGraphContext()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp
      };

      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Box
      position="fixed"
      right={0}
      top={0}
      h="100vh"
      zIndex={1000}
      bg="white"
      borderLeft="1px solid"
      borderColor="gray.200"
      boxShadow="lg"
    >
      {/* Toggle Button */}
      <IconButton
        aria-label="Toggle chat"
        icon={isOpen ? <ChevronRightIcon /> : <ChatIcon />}
        onClick={onToggle}
        position="absolute"
        left={isOpen ? "4" : "-10"}
        top="50%"
        transform="translateY(-50%)"
        colorScheme="blue"
        size="sm"
        zIndex={1001}
        borderRadius="full"
      />

      {/* Chat Panel */}
      <Collapse in={isOpen} animateOpacity>
        <VStack
          w="400px"
          h="100vh"
          spacing={0}
          align="stretch"
        >
          {/* Header */}
          <Box
            p={4}
            bg="blue.500"
            color="white"
            borderBottom="1px solid"
            borderColor="blue.600"
          >
            <HStack justify="space-between" align="center">
              <HStack>
                <ChatIcon />
                <Text fontWeight="bold">AI Assistant</Text>
              </HStack>
              <HStack>
                <Badge colorScheme="green" variant="solid">
                  Online
                </Badge>
                <Tooltip label="Clear conversation">
                  <Button
                    size="xs"
                    variant="ghost"
                    color="white"
                    onClick={clearConversation}
                    _hover={{ bg: 'blue.600' }}
                  >
                    Clear
                  </Button>
                </Tooltip>
              </HStack>
            </HStack>
          </Box>

          {/* Messages Area */}
          <Box
            flex={1}
            overflowY="auto"
            p={4}
            bg="gray.50"
          >
            <VStack spacing={4} align="stretch">
              {messages.length === 0 && (
                <Box
                  p={4}
                  bg="white"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                  textAlign="center"
                >
                  <Text color="gray.500" fontSize="sm">
                    👋 Hi! I'm your AI assistant for data analysis.
                    Ask me anything about your graphs, statistics, or data interpretation!
                  </Text>
                </Box>
              )}

              {messages.map((message, index) => (
                <HStack
                  key={index}
                  align="start"
                  justify={message.role === 'user' ? 'flex-end' : 'flex-start'}
                >
                  {message.role === 'assistant' && (
                    <Avatar size="sm" bg="blue.500" color="white" name="AI" />
                  )}
                  
                  <Box
                    maxW="80%"
                    p={3}
                    borderRadius="lg"
                    bg={message.role === 'user' ? 'blue.500' : 'white'}
                    color={message.role === 'user' ? 'white' : 'black'}
                    border={message.role === 'assistant' ? '1px solid' : 'none'}
                    borderColor="gray.200"
                    boxShadow="sm"
                  >
                    <Text fontSize="sm" whiteSpace="pre-wrap">
                      {message.content}
                    </Text>
                    {message.timestamp && (
                      <Text
                        fontSize="xs"
                        color={message.role === 'user' ? 'blue.100' : 'gray.500'}
                        mt={1}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Text>
                    )}
                  </Box>

                  {message.role === 'user' && (
                    <Avatar size="sm" bg="gray.500" color="white" name="You" />
                  )}
                </HStack>
              ))}

              {isLoading && (
                <HStack align="start">
                  <Avatar size="sm" bg="blue.500" color="white" name="AI" />
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                  >
                    <HStack>
                      <Spinner size="sm" />
                      <Text fontSize="sm" color="gray.500">
                        AI is typing...
                      </Text>
                    </HStack>
                  </Box>
                </HStack>
              )}

              <div ref={messagesEndRef} />
            </VStack>
          </Box>

          {/* Input Area */}
          <Box
            p={4}
            borderTop="1px solid"
            borderColor="gray.200"
            bg="white"
          >
            <VStack spacing={3}>
              {(graphData || graphContext) && (
                <Box
                  p={3}
                  bg="blue.50"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="blue.200"
                  w="100%"
                >
                  <Text fontSize="xs" color="blue.600" fontWeight="medium" mb={1}>
                    📊 Current Graph Context:
                  </Text>
                  {graphData && graphData.baseline && graphData.selectedSample ? (
                    <VStack spacing={1} align="stretch">
                      <Text fontSize="xs" color="blue.700">
                        <strong>Baseline:</strong> {graphData.baseline.filename} ({graphData.baseline.x.length} points)
                      </Text>
                      <Text fontSize="xs" color="blue.700">
                        <strong>Sample:</strong> {graphData.selectedSample.filename} ({graphData.selectedSample.x.length} points)
                      </Text>
                      <Text fontSize="xs" color="blue.600">
                        💡 I can analyze patterns, compare values, and answer questions about this data
                      </Text>
                    </VStack>
                  ) : (
                    <Text fontSize="xs" color="blue.600">
                      {graphContext || "Upload data to enable detailed analysis"}
                    </Text>
                  )}
                </Box>
              )}
              
              <HStack w="100%">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about your data analysis..."
                  size="sm"
                  resize="none"
                  rows={1}
                  bg="white"
                  border="1px solid"
                  borderColor="gray.300"
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 1px blue.500'
                  }}
                />
                <Button
                  colorScheme="blue"
                  size="sm"
                  onClick={sendMessage}
                  isLoading={isLoading}
                  disabled={!input.trim()}
                  minW="60px"
                >
                  Send
                </Button>
              </HStack>
              
              <Text fontSize="xs" color="gray.400" textAlign="center">
                Press Enter to send, Shift+Enter for new line
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Collapse>
    </Box>
  );
};

export default Chatbox;