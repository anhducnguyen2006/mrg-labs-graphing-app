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
import { FaHeart, FaSortAlphaDown, FaSortAlphaUp, FaHeart as FaHeartFilled } from 'react-icons/fa';
import { ParsedCSV } from '../types';

interface Props {
  samples: ParsedCSV[];
  selectedSampleName?: string;
  onSelectSample: (name: string) => void;
  onRemoveSample: (name: string) => void;
  onToggleFavorite: (filename: string) => void;
}

type SortOption = 'name-asc' | 'name-desc' | 'favorites' | 'date-added';

const SampleSidebar: React.FC<Props> = ({
  samples,
  selectedSampleName,
  onSelectSample,
  onRemoveSample,
  onToggleFavorite
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  const getSortLabel = (sortOption: SortOption) => {
    switch (sortOption) {
      case 'name-asc': return 'Name (A-Z)';
      case 'name-desc': return 'Name (Z-A)';
      case 'favorites': return 'Favorites First';
      case 'date-added': return 'Recently Added';
      default: return 'Name (A-Z)';
    }
  };

  const getSortIcon = (sortOption: SortOption) => {
    switch (sortOption) {
      case 'name-asc': return <FaSortAlphaDown />;
      case 'name-desc': return <FaSortAlphaUp />;
      case 'favorites': return <FaHeartFilled color="red.500" />;
      case 'date-added': return <FiArrowDown />;
      default: return <FaSortAlphaDown />;
    }
  };

  const filteredAndSortedSamples = useMemo(() => {
    const filtered = samples.filter(sample =>
      sample.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        
        case 'name-asc':
        default:
          // Sort by name A-Z
          return a.filename.localeCompare(b.filename);
      }
    });
  }, [samples, searchTerm, sortBy]);

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
        {/* Sample Files Section */}
        <Text fontSize="lg" fontWeight="bold">Sample Files</Text>

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

        <Box w="100%" flex={1} overflowY="auto">
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