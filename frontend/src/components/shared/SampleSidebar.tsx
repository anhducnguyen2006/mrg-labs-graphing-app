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
  Flex,
  Collapse,
  useDisclosure,
  useColorModeValue
} from '@chakra-ui/react';
import { SearchIcon, SmallCloseIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { FiHeart, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { FaSortAlphaDown, FaSortAlphaUp, FaHeart, FaHeart as FaHeartFilled, FaSortNumericDown, FaSortNumericUp } from 'react-icons/fa';
import { ParsedCSV } from '../../types';

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

  // Calculate critical samples count
  const criticalCount = samples.filter(s => {
    const score = sampleScores[s.filename];
    return score !== undefined && score < 70;
  }).length;

  // Collapsible controls
  const { isOpen: isAlertsOpen, onToggle: onToggleAlerts } = useDisclosure({ defaultIsOpen: true });
  const { isOpen: isFiltersOpen, onToggle: onToggleFilters } = useDisclosure({ defaultIsOpen: true });

  // Color mode values
  const bgSidebar = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgSurface = useColorModeValue('white', 'gray.800');
  const textPrimary = useColorModeValue('gray.800', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const textMuted = useColorModeValue('gray.500', 'gray.500');
  const searchIconColor = useColorModeValue('gray.300', 'gray.600');
  const inputBg = useColorModeValue('white', 'gray.700');
  const inputBorder = useColorModeValue('gray.200', 'gray.600');
  const menuBg = useColorModeValue('white', 'gray.800');
  const menuBorder = useColorModeValue('gray.200', 'gray.600');
  const menuItemHoverBg = useColorModeValue('gray.50', 'gray.700');
  const selectedItemBg = useColorModeValue('blue.50', 'blue.900');
  const selectedItemBorder = useColorModeValue('blue.200', 'blue.700');
  const selectedItemText = useColorModeValue('blue.700', 'blue.300');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const positionBadgeBg = useColorModeValue('blue.500', 'blue.600');
  const alertBg = useColorModeValue('red.50', 'red.900');
  const criticalAlertSelectedBg = useColorModeValue('red.100', 'red.800');
  const heartRed = useColorModeValue('#E53E3E', '#FC8181');

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
      bg={bgSidebar}
      borderRight="1px"
      borderColor={borderColor}
      p={4}
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      <VStack align="start" spacing={4} flex={1} h="100%" overflow="hidden">
        {/* Sample Files Section */}
        <Text fontSize="lg" fontWeight="bold" color={textPrimary}>Sample Files</Text>

        {/* Critical Samples Alert - Collapsible with clickable samples */}
        <Box w="100%">
          <HStack justify="space-between" align="center" mb={2}>
            <Text fontSize="md" fontWeight="semibold" color={useColorModeValue('red.600', 'red.400')}>
              🚨 Critical Alerts
            </Text>
            <IconButton
              aria-label={isAlertsOpen ? "Collapse alerts" : "Expand alerts"}
              icon={isAlertsOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              size="sm"
              variant="ghost"
              onClick={onToggleAlerts}
            />
          </HStack>
          <Collapse in={isAlertsOpen} animateOpacity>
            <Box p={3} bg={alertBg} borderRadius="md">
              {criticalCount === 0 ? (
                <Text fontSize="sm" color={useColorModeValue('green.700', 'green.300')}>
                  ✓ No critical samples
                </Text>
              ) : (
                <VStack align="start" spacing={2}>
                  <Text fontSize="xs" fontWeight="semibold" color={useColorModeValue('red.800', 'red.300')}>
                    ⚠️ {criticalCount} critical sample{criticalCount > 1 ? 's' : ''} detected
                  </Text>
                  <VStack align="start" spacing={1} w="100%" maxH="150px" overflowY="auto">
                    {samples
                      .filter(s => {
                        const score = sampleScores[s.filename];
                        return score !== undefined && score < 70;
                      })
                      .sort((a, b) => (sampleScores[a.filename] || 0) - (sampleScores[b.filename] || 0))
                      .map(sample => (
                        <Button
                          key={sample.filename}
                          size="xs"
                          variant="ghost"
                          w="100%"
                          justifyContent="space-between"
                          onClick={() => onSelectSample(sample.filename)}
                          bg={selectedSampleName === sample.filename ? criticalAlertSelectedBg : bgSurface}
                          _hover={{ bg: criticalAlertSelectedBg }}
                          px={2}
                        >
                          <Text fontSize="xs" noOfLines={1} flex={1} textAlign="left">
                            {sample.filename}
                          </Text>
                          <Badge colorScheme="red" fontSize="xs" ml={1}>
                            {Math.round(sampleScores[sample.filename] || 0)}
                          </Badge>
                        </Button>
                      ))}
                  </VStack>
                </VStack>
              )}
            </Box>
          </Collapse>
        </Box>

        {/* Search and Filters - Always visible */}
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color={searchIconColor} />
          </InputLeftElement>
          <Input
            placeholder="Search samples..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            bg={inputBg}
            borderRadius="md"
            border="1px solid"
            borderColor={inputBorder}
            _focus={{ 
              borderColor: useColorModeValue("blue.400", "blue.500"),
              boxShadow: useColorModeValue("0 0 0 1px #3182ce", "0 0 0 1px #4299e1")
            }}
          />
        </InputGroup>

        {/* Collapsible Filter Controls */}
        <Box w="100%">
          <HStack justify="space-between" align="center" mb={2}>
            <Text fontSize="sm" fontWeight="semibold" color={textPrimary}>
              Filters & Sort
            </Text>
            <IconButton
              aria-label={isFiltersOpen ? "Collapse filters" : "Expand filters"}
              icon={isFiltersOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              size="sm"
              variant="ghost"
              onClick={onToggleFilters}
            />
          </HStack>
          <Collapse in={isFiltersOpen} animateOpacity>
            <VStack w="100%" spacing={3}>
              {/* Filter Controls - Stacked Layout */}
              {sampleScores && Object.keys(sampleScores).length > 0 && (
                <Box w="100%">
                  <Text fontSize="xs" fontWeight="medium" color={textSecondary} mb={2}>
                    Anomaly Filter
                  </Text>
                  <VStack spacing={2} w="100%">
                    <Button
                      size="sm"
                      leftIcon={<Box w={2} h={2} bg="green.500" borderRadius="full" />}
                      variant={filterBy === 'green' ? 'solid' : 'outline'}
                      colorScheme={filterBy === 'green' ? 'green' : 'gray'}
                      onClick={() => setFilterBy(filterBy === 'green' ? 'all' : 'green')}
                      w="100%"
                      justifyContent="space-between"
                      fontSize="sm"
                    >
                      <Text>Good</Text>
                      <Badge ml={2} colorScheme="green">
                        {samples.filter(s => sampleScores[s.filename] >= 90).length}
                      </Badge>
                    </Button>
                    <Button
                      size="sm"
                      leftIcon={<Box w={2} h={2} bg="yellow.500" borderRadius="full" />}
                      variant={filterBy === 'yellow' ? 'solid' : 'outline'}
                      colorScheme={filterBy === 'yellow' ? 'yellow' : 'gray'}
                      onClick={() => setFilterBy(filterBy === 'yellow' ? 'all' : 'yellow')}
                      w="100%"
                      justifyContent="space-between"
                      fontSize="sm"
                    >
                      <Text>Warning</Text>
                      <Badge ml={2} colorScheme="yellow">
                        {samples.filter(s => {
                          const score = sampleScores[s.filename];
                          return score >= 70 && score < 90;
                        }).length}
                      </Badge>
                    </Button>
                    <Button
                      size="sm"
                      leftIcon={<Box w={2} h={2} bg="red.500" borderRadius="full" />}
                      variant={filterBy === 'red' ? 'solid' : 'outline'}
                      colorScheme={filterBy === 'red' ? 'red' : 'gray'}
                      onClick={() => setFilterBy(filterBy === 'red' ? 'all' : 'red')}
                      w="100%"
                      justifyContent="space-between"
                      fontSize="sm"
                    >
                      <Text>Critical</Text>
                      <Badge ml={2} colorScheme="red">
                        {samples.filter(s => sampleScores[s.filename] < 70).length}
                      </Badge>
                    </Button>
                  </VStack>
                </Box>
              )}

              <Box w="100%">
                <Text fontSize="xs" fontWeight="medium" color={textSecondary} mb={1}>
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
                    bg={bgSurface}
                    border="1px solid"
                    borderColor={inputBorder}
                    _hover={{ 
                      borderColor: borderColor,
                      bg: hoverBg
                    }}
                    _active={{ 
                      bg: hoverBg 
                    }}
                    fontWeight="normal"
                  >
                    <Text fontSize="sm" noOfLines={1}>
                      {getSortLabel(sortBy)}
                    </Text>
                  </MenuButton>
                  <MenuList
                    bg={menuBg}
                    border="1px solid"
                    borderColor={menuBorder}
                    boxShadow="lg"
                    borderRadius="md"
                    py={2}
                    minW="200px"
                  >
                    <Text fontSize="xs" fontWeight="bold" color={textMuted} px={3} py={1} mb={1}>
                      ALPHABETICAL
                    </Text>
                    <MenuItem
                      icon={<FaSortAlphaDown />}
                      onClick={() => setSortBy('name-asc')}
                      bg={sortBy === 'name-asc' ? selectedItemBg : 'transparent'}
                      color={sortBy === 'name-asc' ? selectedItemText : textPrimary}
                      fontWeight={sortBy === 'name-asc' ? 'semibold' : 'normal'}
                      _hover={{ bg: menuItemHoverBg }}
                      borderRadius="md"
                      mx={2}
                    >
                      Name (A → Z)
                    </MenuItem>
                    <MenuItem
                      icon={<FaSortAlphaUp />}
                      onClick={() => setSortBy('name-desc')}
                      bg={sortBy === 'name-desc' ? selectedItemBg : 'transparent'}
                      color={sortBy === 'name-desc' ? selectedItemText : textPrimary}
                      fontWeight={sortBy === 'name-desc' ? 'semibold' : 'normal'}
                      _hover={{ bg: menuItemHoverBg }}
                      borderRadius="md"
                      mx={2}
                    >
                      Name (Z → A)
                    </MenuItem>

                    <MenuDivider />

                    <Text fontSize="xs" fontWeight="bold" color={textMuted} px={3} py={1} mb={1}>
                      BY PRIORITY
                    </Text>
                    <MenuItem
                      icon={<FaHeartFilled color={heartRed} />}
                      onClick={() => setSortBy('favorites')}
                      bg={sortBy === 'favorites' ? selectedItemBg : 'transparent'}
                      color={sortBy === 'favorites' ? selectedItemText : textPrimary}
                      fontWeight={sortBy === 'favorites' ? 'semibold' : 'normal'}
                      _hover={{ bg: menuItemHoverBg }}
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
                      bg={sortBy === 'date-added' ? selectedItemBg : 'transparent'}
                      color={sortBy === 'date-added' ? selectedItemText : textPrimary}
                      fontWeight={sortBy === 'date-added' ? 'semibold' : 'normal'}
                      _hover={{ bg: menuItemHoverBg }}
                      borderRadius="md"
                      mx={2}
                    >
                      Recently Added
                    </MenuItem>

                    {/* Score Sorting - Only show if scores are available */}
                    {sampleScores && Object.keys(sampleScores).length > 0 && (
                      <>
                        <MenuDivider />
                        <Text fontSize="xs" fontWeight="bold" color={textMuted} px={3} py={1} mb={1}>
                          ANOMALY SCORE
                        </Text>
                        <MenuItem
                          icon={<FaSortNumericDown />}
                          onClick={() => setSortBy('score-desc')}
                          bg={sortBy === 'score-desc' ? selectedItemBg : 'transparent'}
                          color={sortBy === 'score-desc' ? selectedItemText : textPrimary}
                          fontWeight={sortBy === 'score-desc' ? 'semibold' : 'normal'}
                          _hover={{ bg: menuItemHoverBg }}
                          borderRadius="md"
                          mx={2}
                        >
                          Highest Score First
                        </MenuItem>
                        <MenuItem
                          icon={<FaSortNumericUp />}
                          onClick={() => setSortBy('score-asc')}
                          bg={sortBy === 'score-asc' ? selectedItemBg : 'transparent'}
                          color={sortBy === 'score-asc' ? selectedItemText : textPrimary}
                          fontWeight={sortBy === 'score-asc' ? 'semibold' : 'normal'}
                          _hover={{ bg: menuItemHoverBg }}
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
          </Collapse>
        </Box>

        {/* Results Summary */}
        {samples.length > 0 && (
          <Flex justify="space-between" align="center" w="100%" px={1} flexShrink={0}>
            <Text fontSize="xs" color={textMuted}>
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

        {/* Sample List - Scrollable with remaining space */}
        <Box w="100%" flex={1} overflowY="auto" minH={0} maxH="100%">
          <List spacing={2}>
            {filteredAndSortedSamples.map((sample, index) => (
              <ListItem key={sample.filename}>
                <HStack
                  p={3}
                  bg={selectedSampleName === sample.filename ? selectedItemBg : bgSurface}
                  border="1px solid"
                  borderColor={selectedSampleName === sample.filename ? selectedItemBorder : borderColor}
                  borderRadius="md"
                  cursor="pointer"
                  _hover={{ 
                    bg: selectedSampleName === sample.filename ? selectedItemBg : hoverBg,
                    borderColor: selectedSampleName === sample.filename ? selectedItemBorder : borderColor,
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
                      bg={positionBadgeBg}
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

                  <VStack align="start" spacing={0} flex={1} ml={sortBy === 'date-added' || sortBy === 'favorites' ? 4 : 0} minW={0}>
                    <Flex align="center" w="100%" gap={1}>
                      {sample.isFavorite && (
                        <FaHeart color={heartRed} size="12" style={{ flexShrink: 0 }} />
                      )}
                      <Text
                        fontSize="sm"
                        fontWeight={selectedSampleName === sample.filename ? 'semibold' : 'normal'}
                        noOfLines={1}
                        flex={1}
                        minW={0}
                        color={selectedSampleName === sample.filename ? selectedItemText : textPrimary}
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
                          flexShrink={0}
                          minW="42px"
                          textAlign="center"
                        >
                          {Math.round(sampleScores[sample.filename])}
                        </Badge>
                      )}
                    </Flex>
                    <Text fontSize="xs" color={textMuted}>
                      {sample.x?.length || 0} data points
                    </Text>
                  </VStack>
                  <HStack spacing={1}>
                    <IconButton
                      aria-label={sample.isFavorite ? "Remove from favorites" : "Add to favorites"}
                      icon={sample.isFavorite ? <FaHeart /> : <FiHeart />}
                      size="xs"
                      variant="ghost"
                      color={sample.isFavorite ? useColorModeValue("red.500", "red.400") : useColorModeValue("gray.400", "gray.500")}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(sample.filename);
                      }}
                      _hover={{ 
                        bg: sample.isFavorite ? useColorModeValue('red.100', 'red.900') : hoverBg,
                        color: sample.isFavorite ? useColorModeValue("red.600", "red.300") : useColorModeValue("red.400", "red.400")
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
                      _hover={{ bg: useColorModeValue('red.100', 'red.900') }}
                    />
                  </HStack>
                </HStack>
              </ListItem>
            ))}
          </List>

          {filteredAndSortedSamples.length === 0 && searchTerm && (
            <Text fontSize="sm" color={textMuted} textAlign="center" mt={4}>
              No samples found matching "{searchTerm}"
            </Text>
          )}

          {samples.length === 0 && (
            <Text fontSize="sm" color={textMuted} textAlign="center" mt={4}>
              No sample files uploaded yet
            </Text>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default SampleSidebar;