import React, { useState } from 'react';
import {
    Box,
    VStack,
    Heading,
    Text,
    useToast
} from '@chakra-ui/react';
import DashboardLayout from '../components/DashboardLayout';
import SampleSidebar from '../components/SampleSidebar';
import GraphPreview from '../components/GraphPreview';
import ChangePasswordDialog from '../components/ChangePasswordDialog';
import { useDisclosure } from '@chakra-ui/react';
import { ParsedCSV, User } from '../types';

const SampleSearch: React.FC = () => {
    const [baselineParsed, setBaselineParsed] = useState<ParsedCSV | undefined>();
    const [baselineFile, setBaselineFile] = useState<File | undefined>();
    const [sampleParsed, setSampleParsed] = useState<ParsedCSV[]>([]);
    const [sampleFiles, setSampleFiles] = useState<FileList | undefined>();
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

        if (sampleFiles) {
            const dt = new DataTransfer();
            Array.from(sampleFiles)
                .filter(file => file.name !== filename)
                .forEach(file => dt.items.add(file));
            setSampleFiles(dt.files);
        }
    };

    return (
        <DashboardLayout
            navbarTitle="Sample Search"
            user={currentUser}
            onChangePasswordClick={handleChangePasswordClick}
            onLogoutClick={handleLogoutClick}
            sidebar={
                <SampleSidebar
                    samples={sampleParsed}
                    selectedSampleName={selectedSample}
                    onSelectSample={setSelectedSample}
                    onRemoveSample={handleRemoveSample}
                />
            }
        >
            <Box p={6}>
                <VStack align="stretch" spacing={6}>
                    <Box>
                        <Heading size="lg" mb={2}>Sample Search</Heading>
                        <Text color="gray.600">
                            Search and analyze sample data. Upload samples through the Dashboard page first.
                        </Text>
                    </Box>

                    <GraphPreview
                        baseline={baselineParsed}
                        samples={sampleParsed}
                        selectedSampleName={selectedSample}
                        onSelectSample={setSelectedSample}
                        baselineFile={baselineFile}
                        sampleFiles={sampleFiles}
                    />
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

export default SampleSearch;
