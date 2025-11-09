import React, { useState, useRef, useEffect } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Box,
    Flex,
    Text,
    Input,
} from '@chakra-ui/react';

export interface RangeWeight {
    min: number;
    max: number;
    weight: number;
    label: string;
    key: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (weights: RangeWeight[]) => void;
    initialWeights?: RangeWeight[];
}

const handleColors = ["black", "gray.700", "gray.500", "gray.300"];
const labels = ["Starting", "Evaporation", "Other", "Oxidation"];

const AbnormalityWeightDialog: React.FC<Props> = ({
    isOpen,
    onClose,
    onSave,
    initialWeights
}) => {
    const [breakpoints, setBreakpoints] = useState<number[]>([2750, 2000, 1750, 550]);
    const [weights, setWeights] = useState<number[]>([0.25, 0.25, 0.25, 0.25]);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    const MIN = 550;
    const MAX = 4000;

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const isValid = Math.abs(totalWeight - 1.0) < 0.0001;

    useEffect(() => {
        if (draggingIndex === null) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!trackRef.current) return;

            const rect = trackRef.current.getBoundingClientRect();
            const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const reversedPercentage = 1 - percentage;
            const newValue = MIN + reversedPercentage * (MAX - MIN);

            setBreakpoints((prev) => {
                const updated = [...prev];
                updated[draggingIndex] = Math.max(MIN, Math.min(MAX, newValue));
                updated.sort((a, b) => b - a);
                return updated;
            });
        };

        const handleMouseUp = () => {
            setDraggingIndex(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingIndex]);

    const updateWeight = (index: number, value: string) => {
        const updated = [...weights];
        updated[index] = Math.max(0, Math.min(1, parseFloat(value) || 0));
        setWeights(updated);
    };

    const handleMouseDown = (index: number) => {
        setDraggingIndex(index);
    };

    const getPosition = (value: number) => (1 - (value - MIN) / (MAX - MIN)) * 100;

    const handleSave = () => {
        if (!isValid) return;

        // Convert to RangeWeight format
        const rangeWeights: RangeWeight[] = [];

        rangeWeights.push({
            min: breakpoints[0],
            max: MAX,
            weight: weights[0] * 100,
            label: `${labels[0]} (${MAX}-${Math.round(breakpoints[0])} cm⁻¹)`,
            key: 'range_starting'
        });

        rangeWeights.push({
            min: breakpoints[1],
            max: breakpoints[0],
            weight: weights[1] * 100,
            label: `${labels[1]} (${Math.round(breakpoints[0])}-${Math.round(breakpoints[1])} cm⁻¹)`,
            key: 'range_evaporation'
        });

        rangeWeights.push({
            min: breakpoints[2],
            max: breakpoints[1],
            weight: weights[2] * 100,
            label: `${labels[2]} (${Math.round(breakpoints[1])}-${Math.round(breakpoints[2])} cm⁻¹)`,
            key: 'range_other'
        });

        rangeWeights.push({
            min: MIN,
            max: breakpoints[2],
            weight: weights[3] * 100,
            label: `${labels[3]} (${Math.round(breakpoints[2])}-${MIN} cm⁻¹)`,
            key: 'range_oxidation'
        });

        onSave(rangeWeights);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent maxW="800px">
                <ModalHeader fontSize="2xl" fontWeight="bold">Interval Weight Selector</ModalHeader>
                <ModalCloseButton />

                <ModalBody>
                    <Box mb={6}>
                        {/* Range slider track */}
                        <Box
                            ref={trackRef}
                            position="relative"
                            h="8px"
                            bg="gray.200"
                            borderRadius="full"
                            cursor="pointer"
                            userSelect="none"
                        >
                            {breakpoints.map((value, index) => {
                                const position = getPosition(value);
                                return (
                                    <Box
                                        key={index}
                                        position="absolute"
                                        top="50%"
                                        transform="translateY(-50%)"
                                        w="20px"
                                        h="20px"
                                        borderRadius="full"
                                        border="2px solid white"
                                        bg={handleColors[index]}
                                        boxShadow="md"
                                        cursor="grab"
                                        _active={{ cursor: 'grabbing' }}
                                        _hover={{ transform: 'translateY(-50%) scale(1.1)' }}
                                        transition="all 0.075s"
                                        left={`calc(${position}% - 10px)`}
                                        zIndex={draggingIndex === index ? 50 : 10}
                                        onMouseDown={() => handleMouseDown(index)}
                                    />
                                );
                            })}
                        </Box>

                        {/* Range labels */}
                        <Flex justify="space-between" mt={2} fontSize="xs" color="gray.500">
                            <Text>{MAX}</Text>
                            <Text>{MIN}</Text>
                        </Flex>
                    </Box>

                    <Box>
                        {labels.map((label, index) => {
                            const rangeStart = index === 0 ? MAX : Math.round(breakpoints[index - 1]);
                            const rangeEnd = Math.round(breakpoints[index]);

                            return (
                                <Box
                                    key={index}
                                    mb={3}
                                    p={4}
                                    bg="white"
                                    border="1px"
                                    borderColor="gray.200"
                                    borderRadius="lg"
                                >
                                    <Flex align="center" justify="space-between" gap={4}>
                                        <Box flex={1}>
                                            <Flex align="center" gap={2} mb={2}>
                                                <Box w="12px" h="12px" borderRadius="full" bg={handleColors[index]} />
                                                <Text fontWeight="semibold">{label}</Text>
                                            </Flex>
                                            <Text fontSize="xs" color="gray.500">
                                                Range: {rangeStart} → {rangeEnd} cm⁻¹
                                            </Text>
                                        </Box>
                                        <Box>
                                            <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                                                Weight
                                            </Text>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="1"
                                                step="0.01"
                                                value={weights[index].toFixed(2)}
                                                onChange={(e) => updateWeight(index, e.target.value)}
                                                w="64px"
                                                textAlign="center"
                                                size="sm"
                                            />
                                        </Box>
                                    </Flex>
                                </Box>
                            );
                        })}
                    </Box>

                    <Box
                        p={4}
                        borderRadius="lg"
                        border="1px"
                        borderColor={isValid ? 'gray.200' : 'red.400'}
                        bg="white"
                    >
                        <Flex justify="space-between" align="center">
                            <Text fontSize="sm" fontWeight="medium" color="gray.600">
                                Total Weight:
                            </Text>
                            <Text fontSize="lg" fontWeight="bold" color={isValid ? 'black' : 'red.500'}>
                                {totalWeight.toFixed(2)}
                                {!isValid && ' ⚠'}
                            </Text>
                        </Flex>
                    </Box>
                </ModalBody>

                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        colorScheme="blue"
                        onClick={handleSave}
                        isDisabled={!isValid}
                    >
                        Save Weights
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AbnormalityWeightDialog;
