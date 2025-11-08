import React, { useState } from 'react';
import { 
  Box, 
  VStack, 
  Input, 
  Text, 
  Button, 
  List, 
  ListItem, 
  InputGroup,
  InputLeftElement,
  IconButton,
  HStack
} from '@chakra-ui/react';
import { SearchIcon, SmallCloseIcon } from '@chakra-ui/icons';
import { ParsedCSV } from '../types';

interface Props {
  samples: ParsedCSV[];
  selectedSampleName?: string;
  onSelectSample: (name: string) => void;
  onRemoveSample: (name: string) => void;
}

const SampleSidebar: React.FC<Props> = ({ 
  samples, 
  selectedSampleName, 
  onSelectSample, 
  onRemoveSample 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSamples = samples.filter(sample => 
    sample.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box 
      w="300px" 
      h="100vh" 
      bg="gray.50" 
      borderRight="1px" 
      borderColor="gray.200" 
      p={4}
    >
      <VStack align="start" spacing={4}>
        <Text fontSize="lg" fontWeight="bold">Sample Files</Text>
        
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Search samples..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            bg="white"
          />
        </InputGroup>

        <Box w="100%" flex={1} overflowY="auto">
          <List spacing={2}>
            {filteredSamples.map((sample) => (
              <ListItem key={sample.filename}>
                <HStack 
                  p={3} 
                  bg={selectedSampleName === sample.filename ? 'blue.100' : 'white'}
                  borderRadius="md" 
                  cursor="pointer"
                  _hover={{ bg: selectedSampleName === sample.filename ? 'blue.100' : 'gray.100' }}
                  onClick={() => onSelectSample(sample.filename)}
                  justify="space-between"
                >
                  <Text 
                    fontSize="sm" 
                    fontWeight={selectedSampleName === sample.filename ? 'semibold' : 'normal'}
                    noOfLines={1}
                    flex={1}
                  >
                    {sample.filename}
                  </Text>
                  <IconButton
                    aria-label="Remove sample"
                    icon={<SmallCloseIcon />}
                    size="xs"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSample(sample.filename);
                    }}
                    _hover={{ bg: 'red.100' }}
                  />
                </HStack>
              </ListItem>
            ))}
          </List>
          
          {filteredSamples.length === 0 && searchTerm && (
            <Text fontSize="sm" color="gray.500" textAlign="center" mt={4}>
              No samples found matching "{searchTerm}"
            </Text>
          )}
          
          {samples.length === 0 && (
            <Text fontSize="sm" color="gray.500" textAlign="center" mt={4}>
              No sample files uploaded yet
            </Text>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default SampleSidebar;