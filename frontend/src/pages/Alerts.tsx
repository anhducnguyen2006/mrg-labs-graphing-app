import React, { useState } from 'react';
import {
    Box,
    VStack,
    Heading,
    Text,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    useToast,
    useDisclosure
} from '@chakra-ui/react';
import DashboardLayout from '../components/DashboardLayout';
import SampleSidebar from '../components/SampleSidebar';
import ChangePasswordDialog from '../components/ChangePasswordDialog';
import { ParsedCSV, User } from '../types';

const Alerts: React.FC = () => {
    const [sampleParsed, setSampleParsed] = useState<ParsedCSV[]>([]);
    const [selectedSample, setSelectedSample] = useState<string | undefined>();
    const { isOpen: isChangePasswordOpen, onOpen: onChangePasswordOpen, onClose: onChangePasswordClose } = useDisclosure();
    const toast = useToast();

    // Mock user data - replace with actual user data from authentication
    const currentUser: User = {
        name: 'John Doe',
        email: 'john@example.com',
        avatarUrl: undefined,
        backgroundUrl: undefined,
    };

    const handleChangePasswordClick = () => {
        onChangePasswordOpen();
    };

    const handleLogoutClick = async () => {
        try {
            await fetch('http://localhost:8080/logout', {
                method: 'POST',
                credentials: 'include',
            });

            toast({
                title: 'Logged Out',
                description: 'You have been successfully logged out.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            window.location.href = '/login';
        } catch (error) {
            toast({
                title: 'Logout Failed',
                description: 'An error occurred during logout.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleRemoveSample = (filename: string) => {
        const updatedSamples = sampleParsed.filter(s => s.filename !== filename);
        setSampleParsed(updatedSamples);

        if (selectedSample === filename) {
            setSelectedSample(updatedSamples.length > 0 ? updatedSamples[0].filename : undefined);
        }
    };

    const handleToggleFavorite = (filename: string) => {
        const updatedSamples = sampleParsed.map(sample =>
            sample.filename === filename
                ? { ...sample, isFavorite: !sample.isFavorite }
                : sample
        );
        setSampleParsed(updatedSamples);
    };

    return (
        <DashboardLayout
            navbarTitle="Alerts"
            user={currentUser}
            onChangePasswordClick={handleChangePasswordClick}
            onLogoutClick={handleLogoutClick}
            sidebar={
                <SampleSidebar
                    samples={sampleParsed}
                    selectedSampleName={selectedSample}
                    onSelectSample={setSelectedSample}
                    onRemoveSample={handleRemoveSample}
                    onToggleFavorite={handleToggleFavorite}
                />
            }
        >
            <Box p={6}>
                <VStack align="stretch" spacing={6}>
                    <Box>
                        <Heading size="lg" mb={2}>Alerts & Notifications</Heading>
                        <Text color="gray.600">
                            View system alerts, warnings, and notifications about your data analysis.
                        </Text>
                    </Box>

                    {/* Sample alerts - replace with actual alert logic */}
                    <VStack align="stretch" spacing={4}>
                        <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            <Box>
                                <AlertTitle>Welcome to Alerts</AlertTitle>
                                <AlertDescription>
                                    This page will display alerts and notifications about your data analysis.
                                </AlertDescription>
                            </Box>
                        </Alert>

                        <Alert status="success" borderRadius="md">
                            <AlertIcon />
                            <Box>
                                <AlertTitle>System Status</AlertTitle>
                                <AlertDescription>
                                    All systems are operational.
                                </AlertDescription>
                            </Box>
                        </Alert>

                        <Alert status="warning" borderRadius="md">
                            <AlertIcon />
                            <Box>
                                <AlertTitle>Sample Alert</AlertTitle>
                                <AlertDescription>
                                    This is a placeholder alert. Configure alert rules to see real notifications here.
                                </AlertDescription>
                            </Box>
                        </Alert>
                    </VStack>
                </VStack>
            </Box>

            {/* Change Password Dialog */}
            <ChangePasswordDialog
                isOpen={isChangePasswordOpen}
                onClose={onChangePasswordClose}
            />
        </DashboardLayout>
    );
};

export default Alerts;
