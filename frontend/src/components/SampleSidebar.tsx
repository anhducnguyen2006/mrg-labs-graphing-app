import React, { useState, useEffect, useMemo } from 'react';
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
  InputRightElement,
  IconButton,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Tooltip,
  Flex,
  Divider,
  useColorModeValue,
  Progress,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
  Center,
  ScaleFade,
  useDisclosure,
  Collapse
} from '@chakra-ui/react';
import { 
  SearchIcon, 
  SmallCloseIcon, 
  ChevronDownIcon, 
  StarIcon,
  AttachmentIcon,
  TimeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  InfoIcon,
  ViewIcon,
  DownloadIcon,
  SettingsIcon
} from '@chakra-ui/icons';
import { ParsedCSV } from '../types';

interface Props {
  samples: ParsedCSV[];
  selectedSampleName?: string;
  onSelectSample: (name: string) => void;
  onRemoveSample: (name: string) => void;
}

interface SampleWithMetadata extends ParsedCSV {
  isFavorite: boolean;
  fileSize: string;
}

type SortOption = 'name' | 'size' | 'favorites';
type SortDirection = 'asc' | 'desc';

const SampleSidebar: React.FC<Props> = ({ 
  samples, 
  selectedSampleName, 
  onSelectSample, 
  onRemoveSample 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('favorites');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBgColor = useColorModeValue('white', 'gray.700');
  const selectedBgColor = useColorModeValue('blue.100', 'blue.800');
  const hoverBgColor = useColorModeValue('gray.100', 'gray.600');

  // Load favorites from localStorage on component mount
  useEffect(() => {
    const storedFavorites = localStorage.getItem('sampleFavorites');
    if (storedFavorites) {
      try {
        setFavorites(new Set(JSON.parse(storedFavorites)));
      } catch (error) {
        console.error('Failed to parse favorites from localStorage:', error);
      }
    }
  }, []);

  // Save favorites to localStorage whenever favorites change
  useEffect(() => {
    localStorage.setItem('sampleFavorites', JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  // Transform samples with metadata
  const samplesWithMetadata = useMemo((): SampleWithMetadata[] => {
    return samples.map((sample) => {
      return {
        ...sample,
        isFavorite: favorites.has(sample.filename),
        fileSize: `${Math.round(sample.rawContent.length / 1024)}KB`,
      };
    });
  }, [samples, favorites]);

  // Filter and sort samples
  const processedSamples = useMemo(() => {
    let filtered = samplesWithMetadata.filter(sample => 
      sample.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort based on current criteria
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.filename.localeCompare(b.filename);
          break;
        case 'size':
          comparison = a.rawContent.length - b.rawContent.length;
          break;
        case 'favorites':
          // Sort favorites first, then by name
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          comparison = a.filename.localeCompare(b.filename);
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [samplesWithMetadata, searchTerm, sortBy, sortDirection]);

  const toggleFavorite = (filename: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(filename)) {
        newFavorites.delete(filename);
      } else {
        newFavorites.add(filename);
      }
      return newFavorites;
    });
  };

  const handleSortChange = (newSortBy: SortOption) => {
    if (newSortBy === sortBy) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (option: SortOption) => {
    if (sortBy !== option) return null;
    return sortDirection === 'asc' ? <ArrowUpIcon boxSize={3} /> : <ArrowDownIcon boxSize={3} />;
  };



  return (
    <Box 
      w="320px" 
      h="100vh" 
      bg={bgColor} 
      borderRight="1px" 
      borderColor={borderColor} 
      p={4}
    >
      <VStack align="start" spacing={4} h="100%">
        {/* Header */}
        <VStack spacing={3} w="100%">
          <Flex justify="space-between" align="center" w="100%">
            <HStack spacing={2}>
              <Text fontSize="xl" fontWeight="bold" bgGradient="linear(to-r, blue.600, purple.600)" bgClip="text">
                📊 Data Files
              </Text>
            </HStack>
            <HStack spacing={2}>
              {Array.from(favorites).length > 0 && (
                <Badge colorScheme="yellow" variant="subtle">
                  ⭐ {Array.from(favorites).length}
                </Badge>
              )}
              <Badge colorScheme="blue" variant="solid" borderRadius="full">
                {samples.length} files
              </Badge>
            </HStack>
          </Flex>
          
          {/* Quick Stats */}
          {samples.length > 0 && (
            <HStack spacing={4} w="100%" justify="center" py={2} px={3} bg={cardBgColor} borderRadius="lg" border="1px solid" borderColor={borderColor}>
              <VStack spacing={0} align="center">
                <Text fontSize="lg" fontWeight="bold" color="blue.500">
                  {samples.length}
                </Text>
                <Text fontSize="xs" color="gray.500">Files</Text>
              </VStack>
              <Divider orientation="vertical" h="8" />
              <VStack spacing={0} align="center">
                <Text fontSize="lg" fontWeight="bold" color="purple.500">
                  {Math.round(samplesWithMetadata.reduce((sum, s) => sum + s.rawContent.length, 0) / 1024)}KB
                </Text>
                <Text fontSize="xs" color="gray.500">Total Size</Text>
              </VStack>
            </HStack>
          )}
        </VStack>
        
        {/* Search */}
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="🔍 Search files by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            bg={cardBgColor}
            border="2px solid"
            borderColor="transparent"
            borderRadius="xl"
            _focus={{ 
              borderColor: 'blue.400', 
              boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.15)',
              bg: 'white'
            }}
            _hover={{
              borderColor: 'gray.300'
            }}
            fontSize="sm"
            h="12"
          />
          {searchTerm && (
            <InputRightElement>
              <IconButton
                aria-label="Clear search"
                icon={<SmallCloseIcon />}
                size="xs"
                variant="ghost"
                onClick={() => setSearchTerm('')}
                borderRadius="full"
              />
            </InputRightElement>
          )}
        </InputGroup>

        {/* Sort Controls */}
        <Box w="100%" bg={cardBgColor} p={3} borderRadius="xl" border="1px solid" borderColor={borderColor}>
          <VStack spacing={3}>
            <HStack justify="space-between" w="100%">
              <HStack spacing={2}>
                <SettingsIcon boxSize={4} color="gray.500" />
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Sort & Filter
                </Text>
              </HStack>
              <HStack spacing={0}>
                <Button
                  size="xs"
                  variant={sortDirection === 'asc' ? 'solid' : 'ghost'}
                  colorScheme={sortDirection === 'asc' ? 'blue' : 'gray'}
                  onClick={() => setSortDirection('asc')}
                  borderRightRadius="0"
                  leftIcon={<ArrowUpIcon boxSize={2} />}
                  fontSize="xs"
                >
                  Asc
                </Button>
                <Button
                  size="xs"
                  variant={sortDirection === 'desc' ? 'solid' : 'ghost'}
                  colorScheme={sortDirection === 'desc' ? 'blue' : 'gray'}
                  onClick={() => setSortDirection('desc')}
                  borderLeftRadius="0"
                  leftIcon={<ArrowDownIcon boxSize={2} />}
                  fontSize="xs"
                >
                  Desc
                </Button>
              </HStack>
            </HStack>
            
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                size="sm"
                variant="outline"
                bg="white"
                w="100%"
                borderRadius="lg"
                justifyContent="space-between"
              >
                <HStack>
                  {sortBy === 'favorites' && <>⭐ Favorites First</>}
                  {sortBy === 'name' && <>📝 File Name</>}
                  {sortBy === 'size' && <>📊 File Size</>}
                </HStack>
              </MenuButton>
              <MenuList borderRadius="xl" border="1px solid" borderColor={borderColor}>
                <MenuItem onClick={() => handleSortChange('favorites')} borderRadius="lg">
                  <HStack justify="space-between" w="100%">
                    <HStack>
                      <StarIcon color="yellow.500" boxSize={3} />
                      <Text>Favorites First</Text>
                    </HStack>
                    {getSortIcon('favorites')}
                  </HStack>
                </MenuItem>
                <MenuItem onClick={() => handleSortChange('name')} borderRadius="lg">
                  <HStack justify="space-between" w="100%">
                    <HStack>
                      <AttachmentIcon boxSize={3} />
                      <Text>File Name</Text>
                    </HStack>
                    {getSortIcon('name')}
                  </HStack>
                </MenuItem>
                <MenuItem onClick={() => handleSortChange('size')} borderRadius="lg">
                  <HStack justify="space-between" w="100%">
                    <HStack>
                      <Text>📊</Text>
                      <Text>File Size</Text>
                    </HStack>
                    {getSortIcon('size')}
                  </HStack>
                </MenuItem>
              </MenuList>
            </Menu>
          </VStack>
        </Box>

        <Divider />

        {/* File List */}
        <Box w="100%" flex={1} overflowY="auto">
          <List spacing={3}>
            {processedSamples.map((sample, index) => (
              <ScaleFade key={sample.filename} initialScale={0.9} in={true} delay={index * 0.05}>
                <ListItem>
                  <Box
                    p={4}
                    bg={selectedSampleName === sample.filename ? selectedBgColor : cardBgColor}
                    borderRadius="xl"
                    cursor="pointer"
                    border="2px solid"
                    borderColor={selectedSampleName === sample.filename ? 'blue.400' : 'transparent'}
                    _hover={{ 
                      bg: selectedSampleName === sample.filename ? selectedBgColor : hoverBgColor,
                      transform: 'translateY(-2px)',
                      boxShadow: 'lg',
                      borderColor: selectedSampleName === sample.filename ? 'blue.500' : 'gray.300'
                    }}
                    onClick={() => onSelectSample(sample.filename)}
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    position="relative"
                    overflow="hidden"
                  >
                    {/* Gradient overlay for selected items */}
                    {selectedSampleName === sample.filename && (
                      <Box
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        h="3px"
                        bgGradient="linear(to-r, blue.400, purple.400)"
                      />
                    )}

                    {/* Header Row */}
                    <HStack justify="space-between" mb={3}>
                      <HStack spacing={2} flex={1} minW="0">
                        <Tooltip label={sample.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                          <IconButton
                            aria-label="Toggle favorite"
                            icon={<StarIcon />}
                            size="sm"
                            variant="ghost"
                            color={sample.isFavorite ? 'yellow.500' : 'gray.400'}
                            _hover={{ 
                              color: sample.isFavorite ? 'yellow.600' : 'yellow.500',
                              bg: 'yellow.50',
                              transform: 'scale(1.1)'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(sample.filename);
                            }}
                            transition="all 0.2s"
                          />
                        </Tooltip>
                        
                        <VStack align="start" spacing={0} flex={1} minW="0">
                          <Text 
                            fontSize="sm" 
                            fontWeight="semibold"
                            noOfLines={1}
                            title={sample.filename}
                            color={selectedSampleName === sample.filename ? 'blue.700' : 'gray.700'}
                          >
                            {sample.filename.replace('.csv', '')}
                          </Text>
                          <Text fontSize="xs" color="gray.500" noOfLines={1}>
                            CSV File
                          </Text>
                        </VStack>
                      </HStack>
                      
                      <Tooltip label="Remove sample">
                        <IconButton
                          aria-label="Remove sample"
                          icon={<SmallCloseIcon />}
                          size="xs"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveSample(sample.filename);
                          }}
                          _hover={{ bg: 'red.100', color: 'red.600', transform: 'scale(1.1)' }}
                          transition="all 0.2s"
                        />
                      </Tooltip>
                    </HStack>

                    {/* File Info */}
                    <HStack justify="space-between" w="100%" fontSize="xs" color="gray.500">
                      <Text>{sample.fileSize}</Text>
                      <Text>{sample.x.length} data points</Text>
                    </HStack>

                    {/* Favorite Corner Badge */}
                    {sample.isFavorite && (
                      <Box
                        position="absolute"
                        top={2}
                        right={2}
                        bg="yellow.400"
                        borderRadius="full"
                        p={1}
                        boxSize={5}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        zIndex={1}
                      >
                        <StarIcon boxSize={2} color="white" />
                      </Box>
                    )}
                  </Box>
                </ListItem>
              </ScaleFade>
            ))}
          </List>
          
          {/* Empty States */}
          {processedSamples.length === 0 && searchTerm && (
            <Center h="200px">
              <VStack spacing={4} textAlign="center">
                <Box fontSize="4xl" opacity={0.6}>🔍</Box>
                <VStack spacing={2}>
                  <Text fontSize="md" fontWeight="medium" color="gray.600">
                    No files found
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    No results for "<Text as="span" fontWeight="semibold">{searchTerm}</Text>"
                  </Text>
                </VStack>
                <Button 
                  size="sm" 
                  variant="outline" 
                  colorScheme="blue"
                  onClick={() => setSearchTerm('')}
                  borderRadius="full"
                >
                  Clear search
                </Button>
              </VStack>
            </Center>
          )}
          
          {samples.length === 0 && (
            <Center h="300px">
              <VStack spacing={6} textAlign="center" maxW="250px">
                <Box fontSize="5xl" opacity={0.7}>📊</Box>
                <VStack spacing={3}>
                  <Text fontSize="lg" fontWeight="semibold" color="gray.600">
                    Ready for Data
                  </Text>
                  <Text fontSize="sm" color="gray.500" textAlign="center" lineHeight="1.5">
                    Upload your CSV files to start creating beautiful graphs and analyzing your data
                  </Text>
                </VStack>
                <VStack spacing={2}>
                  <Text fontSize="xs" color="gray.400">
                    Supported formats: CSV with X,Y columns
                  </Text>
                  <HStack spacing={4} fontSize="xs" color="gray.400">
                    <Text>📈 Wavenumber</Text>
                    <Text>📊 Absorbance</Text>
                    <Text>🔢 Any numeric data</Text>
                  </HStack>
                </VStack>
              </VStack>
            </Center>
          )}
        </Box>

        {/* Footer Stats */}
        {samples.length > 0 && (
          <>
            <Divider />
            <VStack spacing={2} w="100%">
              <HStack justify="space-between" w="100%" fontSize="xs" color="gray.500">
                <Text fontWeight="medium">
                  {processedSamples.length === samples.length 
                    ? `${samples.length} files`
                    : `${processedSamples.length} of ${samples.length} shown`
                  }
                </Text>
                {Array.from(favorites).length > 0 && (
                  <HStack spacing={1}>
                    <StarIcon boxSize={3} color="yellow.500" />
                    <Text>{Array.from(favorites).length} favorites</Text>
                  </HStack>
                )}
              </HStack>
              
              {searchTerm && (
                <HStack w="100%" fontSize="xs" color="gray.400" justify="center">
                  <SearchIcon boxSize={3} />
                  <Text>Filtered by: "{searchTerm}"</Text>
                </HStack>
              )}
            </VStack>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default SampleSidebar;