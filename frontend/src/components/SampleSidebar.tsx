import React, { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  Input,
  Text,
  List,
  ListItem,
  InputGroup,
  InputLeftElement,
  IconButton,
  HStack,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge,
  Flex
} from '@chakra-ui/react';
import { SearchIcon, SmallCloseIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { FiHeart, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { FaHeart, FaSortAlphaDown, FaSortAlphaUp, FaHeart as FaHeartFilled, FaSortNumericDown, FaSortNumericUp } from 'react-icons/fa';
import { ParsedCSV } from '../types';

interface Props {
  samples: ParsedCSV[];
  selectedSampleName?: string;
  onSelectSample: (name: string) => void;
  onRemoveSample: (name: string) => void;
  onToggleFavorite: (filename: string) => void;
  sampleScores?: { [filename: string]: number };
}

type SortOption = 'name-asc' | 'name-desc' | 'favorites' | 'date-added' | 'score-desc' | 'score-asc';
type FilterOption = 'all' | 'green' | 'yellow' | 'red';

const SampleSidebar: React.FC<Props> = ({
  samples,
  selectedSampleName,
  onSelectSample,
  onRemoveSample,
  onToggleFavorite,
  sampleScores = {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  const getSortLabel = (sortOption: SortOption) => {
    switch (sortOption) {
      case 'name-asc': return 'Name (A-Z)';
      case 'name-desc': return 'Name (Z-A)';
      case 'favorites': return 'Favorites First';
      case 'date-added': return 'Recently Added';
      case 'score-desc': return 'Best Score First';
      case 'score-asc': return 'Worst Score First';
      default: return 'Name (A-Z)';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'green';
    if (score >= 70) return 'yellow';
    return 'red';
  };

  const getScoreCategory = (score: number): FilterOption => {
    if (score >= 90) return 'green';
    if (score >= 70) return 'yellow';
    return 'red';
  };

  const getSortIcon = (sortOption: SortOption) => {
    switch (sortOption) {
      case 'name-asc': return <FaSortAlphaDown />;
      case 'name-desc': return <FaSortAlphaUp />;
      case 'favorites': return <FaHeartFilled color="#E53E3E" />;
      case 'date-added': return <FiArrowDown />;
      case 'score-desc': return <FiArrowDown />;
      case 'score-asc': return <FiArrowUp />;
      default: return <FaSortAlphaDown />;
    }
  };

  const filteredAndSortedSamples = useMemo(() => {
    let filtered = samples.filter(sample =>
      sample.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply score filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(sample => {
        const score = sampleScores[sample.filename] ?? 0;
        return getScoreCategory(score) === filterBy;
      });
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'favorites':
          // Sort by favorites first (favorites come first)
          if (a.isFavorite !== b.isFavorite) {
            return b.isFavorite ? 1 : -1;
          }
          // If both have same favorite status, sort by name A-Z
          return a.filename.localeCompare(b.filename);
        
        case 'name-desc':
          // Sort by name Z-A
          return b.filename.localeCompare(a.filename);
        
        case 'date-added':
          // Sort by array index (recently added items are at the end, so reverse)
          const aIndex = samples.indexOf(a);
          const bIndex = samples.indexOf(b);
          return bIndex - aIndex;

        case 'score-desc':
          // Sort by score (highest first)
          const scoreA = sampleScores[a.filename] ?? 0;
          const scoreB = sampleScores[b.filename] ?? 0;
          return scoreB - scoreA;

        case 'score-asc':
          // Sort by score (lowest first)
          const scoreA2 = sampleScores[a.filename] ?? 0;
          const scoreB2 = sampleScores[b.filename] ?? 0;
          return scoreA2 - scoreB2;
        
        case 'name-asc':
        default:
          // Sort by name A-Z
          return a.filename.localeCompare(b.filename);
      }
    });
  }, [samples, searchTerm, sortBy, filterBy, sampleScores]);

  return (
    <Box
      w="300px"
      h="100vh"
      bg="gray.50"
      borderRight="1px"
      borderColor="gray.200"
      p={4}
      display="flex"
      flexDirection="column"
    >
      <VStack align="start" spacing={4} flex={1} h="100%">
        {/* Sample Files Section */}
        <Text fontSize="lg" fontWeight="bold">Sample Files</Text>

        {/* Selected Sample Headline */}
        {selectedSampleName && (
          <Box w="100%" p={3} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
            <Text fontSize="sm" fontWeight="medium" color="blue.600" mb={1}>
              Currently Selected:
            </Text>
            <Flex align="center" justify="space-between">
              <Text fontSize="md" fontWeight="bold" color="blue.800" noOfLines={1} flex={1} mr={2}>
                {selectedSampleName}
              </Text>
              {sampleScores && sampleScores[selectedSampleName] !== undefined && (
                <Badge
                  colorScheme={getScoreColor(sampleScores[selectedSampleName])}
                  size="md"
                  fontSize="sm"
                  fontWeight="bold"
                  px={3}
                  py={1}
                >
                  Score: {Math.round(sampleScores[selectedSampleName])}
                </Badge>
              )}
            </Flex>
          </Box>
        )}

        <VStack w="100%" spacing={3}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search samples..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg="white"
              borderRadius="md"
              border="1px solid"
              borderColor="gray.200"
              _focus={{ 
                borderColor: "blue.400",
                boxShadow: "0 0 0 1px blue.400"
              }}
            />
          </InputGroup>

          {/* Filter Controls */}
          {sampleScores && Object.keys(sampleScores).length > 0 && (
            <Box w="100%">
              <Text fontSize="xs" fontWeight="medium" color="gray.600" mb={2}>
                Anomaly Filter
              </Text>
              <HStack spacing={2} w="100%">
                <Button
                  size="xs"
                  leftIcon={<Box w={2} h={2} bg="green.500" borderRadius="full" />}
                  variant={filterBy === 'green' ? 'solid' : 'outline'}
                  colorScheme={filterBy === 'green' ? 'green' : 'gray'}
                  onClick={() => setFilterBy(filterBy === 'green' ? 'all' : 'green')}
                  flex={1}
                  fontSize="xs"
                >
                  Good ({samples.filter(s => sampleScores[s.filename] >= 90).length})
                </Button>
                <Button
                  size="xs"
                  leftIcon={<Box w={2} h={2} bg="yellow.500" borderRadius="full" />}
                  variant={filterBy === 'yellow' ? 'solid' : 'outline'}
                  colorScheme={filterBy === 'yellow' ? 'yellow' : 'gray'}
                  onClick={() => setFilterBy(filterBy === 'yellow' ? 'all' : 'yellow')}
                  flex={1}
                  fontSize="xs"
                >
                  Warning ({samples.filter(s => {
                    const score = sampleScores[s.filename];
                    return score >= 70 && score < 90;
                  }).length})
                </Button>
                <Button
                  size="xs"
                  leftIcon={<Box w={2} h={2} bg="red.500" borderRadius="full" />}
                  variant={filterBy === 'red' ? 'solid' : 'outline'}
                  colorScheme={filterBy === 'red' ? 'red' : 'gray'}
                  onClick={() => setFilterBy(filterBy === 'red' ? 'all' : 'red')}
                  flex={1}
                  fontSize="xs"
                >
                  Critical ({samples.filter(s => sampleScores[s.filename] < 70).length})
                </Button>
              </HStack>
            </Box>
          )}

          <Box w="100%">
            <Text fontSize="xs" fontWeight="medium" color="gray.600" mb={1}>
              Sort Options
            </Text>
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                leftIcon={getSortIcon(sortBy)}
                size="sm"
                w="100%"
                justifyContent="space-between"
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                _hover={{ 
                  borderColor: "gray.300",
                  bg: "gray.50"
                }}
                _active={{ 
                  bg: "gray.100" 
                }}
                fontWeight="normal"
              >
                <Text fontSize="sm" noOfLines={1}>
                  {getSortLabel(sortBy)}
                </Text>
              </MenuButton>
              <MenuList
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                boxShadow="lg"
                borderRadius="md"
                py={2}
                minW="200px"
              >
                <Text fontSize="xs" fontWeight="bold" color="gray.500" px={3} py={1} mb={1}>
                  ALPHABETICAL
                </Text>
                <MenuItem
                  icon={<FaSortAlphaDown />}
                  onClick={() => setSortBy('name-asc')}
                  bg={sortBy === 'name-asc' ? 'blue.50' : 'transparent'}
                  color={sortBy === 'name-asc' ? 'blue.700' : 'gray.700'}
                  fontWeight={sortBy === 'name-asc' ? 'semibold' : 'normal'}
                  _hover={{ bg: 'gray.50' }}
                  borderRadius="md"
                  mx={2}
                >
                  Name (A → Z)
                </MenuItem>
                <MenuItem
                  icon={<FaSortAlphaUp />}
                  onClick={() => setSortBy('name-desc')}
                  bg={sortBy === 'name-desc' ? 'blue.50' : 'transparent'}
                  color={sortBy === 'name-desc' ? 'blue.700' : 'gray.700'}
                  fontWeight={sortBy === 'name-desc' ? 'semibold' : 'normal'}
                  _hover={{ bg: 'gray.50' }}
                  borderRadius="md"
                  mx={2}
                >
                  Name (Z → A)
                </MenuItem>

                <MenuDivider />

                <Text fontSize="xs" fontWeight="bold" color="gray.500" px={3} py={1} mb={1}>
                  BY PRIORITY
                </Text>
                <MenuItem
                  icon={<FaHeartFilled color="#E53E3E" />}
                  onClick={() => setSortBy('favorites')}
                  bg={sortBy === 'favorites' ? 'blue.50' : 'transparent'}
                  color={sortBy === 'favorites' ? 'blue.700' : 'gray.700'}
                  fontWeight={sortBy === 'favorites' ? 'semibold' : 'normal'}
                  _hover={{ bg: 'gray.50' }}
                  borderRadius="md"
                  mx={2}
                >
                  <Flex align="center" justify="space-between" w="100%">
                    Favorites First
                    <Badge colorScheme="red" size="sm" ml={2}>
                      {samples.filter(s => s.isFavorite).length}
                    </Badge>
                  </Flex>
                </MenuItem>
                <MenuItem
                  icon={<FiArrowDown />}
                  onClick={() => setSortBy('date-added')}
                  bg={sortBy === 'date-added' ? 'blue.50' : 'transparent'}
                  color={sortBy === 'date-added' ? 'blue.700' : 'gray.700'}
                  fontWeight={sortBy === 'date-added' ? 'semibold' : 'normal'}
                  _hover={{ bg: 'gray.50' }}
                  borderRadius="md"
                  mx={2}
                >
                  Recently Added
                </MenuItem>

                {/* Score Sorting - Only show if scores are available */}
                {sampleScores && Object.keys(sampleScores).length > 0 && (
                  <>
                    <MenuDivider />
                    <Text fontSize="xs" fontWeight="bold" color="gray.500" px={3} py={1} mb={1}>
                      ANOMALY SCORE
                    </Text>
                    <MenuItem
                      icon={<FaSortNumericDown />}
                      onClick={() => setSortBy('score-desc')}
                      bg={sortBy === 'score-desc' ? 'blue.50' : 'transparent'}
                      color={sortBy === 'score-desc' ? 'blue.700' : 'gray.700'}
                      fontWeight={sortBy === 'score-desc' ? 'semibold' : 'normal'}
                      _hover={{ bg: 'gray.50' }}
                      borderRadius="md"
                      mx={2}
                    >
                      Highest Score First
                    </MenuItem>
                    <MenuItem
                      icon={<FaSortNumericUp />}
                      onClick={() => setSortBy('score-asc')}
                      bg={sortBy === 'score-asc' ? 'blue.50' : 'transparent'}
                      color={sortBy === 'score-asc' ? 'blue.700' : 'gray.700'}
                      fontWeight={sortBy === 'score-asc' ? 'semibold' : 'normal'}
                      _hover={{ bg: 'gray.50' }}
                      borderRadius="md"
                      mx={2}
                    >
                      Lowest Score First
                    </MenuItem>
                  </>
                )}
              </MenuList>
            </Menu>
          </Box>
        </VStack>

        {/* Results Summary */}
        {samples.length > 0 && (
          <Flex justify="space-between" align="center" w="100%" px={1}>
            <Text fontSize="xs" color="gray.500">
              {filteredAndSortedSamples.length} of {samples.length} files
              {searchTerm && ` matching "${searchTerm}"`}
            </Text>
            {samples.filter(s => s.isFavorite).length > 0 && (
              <Badge colorScheme="red" size="sm" fontSize="xs">
                {samples.filter(s => s.isFavorite).length} ❤️
              </Badge>
            )}
          </Flex>
        )}

        <Box w="100%" flex={1} overflowY="auto" minH={0}>
          <List spacing={2}>
            {filteredAndSortedSamples.map((sample, index) => (
              <ListItem key={sample.filename}>
                <HStack
                  p={3}
                  bg={selectedSampleName === sample.filename ? 'blue.50' : 'white'}
                  border="1px solid"
                  borderColor={selectedSampleName === sample.filename ? 'blue.200' : 'gray.200'}
                  borderRadius="md"
                  cursor="pointer"
                  _hover={{ 
                    bg: selectedSampleName === sample.filename ? 'blue.100' : 'gray.50',
                    borderColor: selectedSampleName === sample.filename ? 'blue.300' : 'gray.300',
                    transform: 'translateY(-1px)',
                    boxShadow: 'sm'
                  }}
                  onClick={() => onSelectSample(sample.filename)}
                  justify="space-between"
                  transition="all 0.2s"
                  position="relative"
                >
                  {/* Position indicator for sorted lists */}
                  {(sortBy === 'date-added' || sortBy === 'favorites') && (
                    <Box
                      position="absolute"
                      left={1}
                      top={1}
                      bg="blue.500"
                      color="white"
                      fontSize="xs"
                      w={4}
                      h={4}
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontWeight="bold"
                    >
                      {index + 1}
                    </Box>
                  )}

                  <VStack align="start" spacing={0} flex={1} ml={sortBy === 'date-added' || sortBy === 'favorites' ? 4 : 0}>
                    <Flex align="center" w="100%">
                      {sample.isFavorite && (
                        <FaHeart color="#E53E3E" size="12" style={{ marginRight: '6px' }} />
                      )}
                      <Text
                        fontSize="sm"
                        fontWeight={selectedSampleName === sample.filename ? 'semibold' : 'normal'}
                        noOfLines={1}
                        flex={1}
                        color={selectedSampleName === sample.filename ? 'blue.700' : 'gray.700'}
                      >
                        {sample.filename}
                      </Text>
                      {/* Score Badge */}
                      {sampleScores && sampleScores[sample.filename] !== undefined && (
                        <Badge
                          colorScheme={getScoreColor(sampleScores[sample.filename])}
                          size="sm"
                          fontSize="xs"
                          fontWeight="bold"
                          ml={2}
                        >
                          {Math.round(sampleScores[sample.filename])}
                        </Badge>
                      )}
                    </Flex>
                    <Text fontSize="xs" color="gray.500">
                      {sample.x?.length || 0} data points
                    </Text>
                  </VStack>
                  <HStack spacing={1}>
                    <IconButton
                      aria-label={sample.isFavorite ? "Remove from favorites" : "Add to favorites"}
                      icon={sample.isFavorite ? <FaHeart /> : <FiHeart />}
                      size="xs"
                      variant="ghost"
                      color={sample.isFavorite ? "red.500" : "gray.400"}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(sample.filename);
                      }}
                      _hover={{ 
                        bg: sample.isFavorite ? 'red.100' : 'gray.100',
                        color: sample.isFavorite ? "red.600" : "red.400"
                      }}
                    />
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
                </HStack>
              </ListItem>
            ))}
          </List>

          {filteredAndSortedSamples.length === 0 && searchTerm && (
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