import React, { useState } from 'react';
import { ChakraProvider, Box, ButtonGroup, Button, Text, VStack } from '@chakra-ui/react';
import Dashboard from '../pages/Dashboard';
import IntegrationTest from '../components/redesign/IntegrationTest';

/**
 * Development testing page to compare original and redesigned dashboards
 */
const TestPage: React.FC = () => {
  const [activeView, setActiveView] = useState<'original' | 'redesigned'>('redesigned');

  return (
    <ChakraProvider>
      <Box w="full" h="100vh" bg="gray.50">
        {/* Toggle controls */}
        <Box p={4} bg="white" borderBottom="1px" borderColor="gray.200">
          <VStack align="start" spacing={3}>
            <Text fontSize="lg" fontWeight="bold">
              FTIR Dashboard Comparison
            </Text>
            <ButtonGroup size="sm" isAttached>
              <Button
                variant={activeView === 'original' ? 'solid' : 'outline'}
                colorScheme="blue"
                onClick={() => setActiveView('original')}
              >
                Original Dashboard
              </Button>
              <Button
                variant={activeView === 'redesigned' ? 'solid' : 'outline'}
                colorScheme="blue"
                onClick={() => setActiveView('redesigned')}
              >
                Redesigned Dashboard
              </Button>
            </ButtonGroup>
          </VStack>
        </Box>

        {/* Content area */}
        <Box w="full" h="calc(100vh - 80px)">
          {activeView === 'original' && <Dashboard />}
          {activeView === 'redesigned' && <IntegrationTest />}
        </Box>
      </Box>
    </ChakraProvider>
  );
};

export default TestPage;