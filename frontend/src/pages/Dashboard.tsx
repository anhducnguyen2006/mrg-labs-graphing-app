import React, { useState } from 'react';
import {
  SimpleGrid,
  VStack,
  Box,
  Button,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import FileUploadBox from '../components/FileUploadBox';
import GraphPreview from '../components/GraphPreview';
import SampleSidebar from '../components/SampleSidebar';
import ExportDialog from '../components/ExportDialog';
import DashboardLayout from '../components/DashboardLayout';
import Chatbox from '../components/Chatbox';
import ChangePasswordDialog from '../components/ChangePasswordDialog';
import AbnormalityWeightDialog from '../components/AbnormalityWeightDialog';
import type { RangeWeight } from '../components/AbnormalityWeightDialog';
import { ParsedCSV, User } from '../types';

const Dashboard: React.FC = () => {
  const [baselineParsed, setBaselineParsed] = useState<ParsedCSV | undefined>();
  const [baselineFile, setBaselineFile] = useState<File | undefined>();
  const [sampleParsed, setSampleParsed] = useState<ParsedCSV[]>([]);
  const [sampleFiles, setSampleFiles] = useState<FileList | undefined>();
  const [selectedSample, setSelectedSample] = useState<string | undefined>();
  const [abnormalityWeights, setAbnormalityWeights] = useState<RangeWeight[]>([]);
  const [sampleScores, setSampleScores] = useState<{ [filename: string]: number }>({});
  const { isOpen: isExportOpen, onOpen: onExportOpen, onClose: onExportClose } = useDisclosure();
  const { isOpen: isChangePasswordOpen, onOpen: onChangePasswordOpen, onClose: onChangePasswordClose } = useDisclosure();
  const { isOpen: isWeightOpen, onOpen: onWeightOpen, onClose: onWeightClose } = useDisclosure();
  const toast = useToast();

  // Mock user data - replace with actual user data from authentication
  const currentUser: User = {
    name: 'John Doe',
    email: 'john@example.com',
    avatarUrl: undefined, // Will use initials from name
    backgroundUrl: undefined, // Optional: Add a custom background URL
  };

  // User profile menu handlers
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

      // Redirect to login page
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

    // Update selected sample if the removed one was selected
    if (selectedSample === filename) {
      setSelectedSample(updatedSamples.length > 0 ? updatedSamples[0].filename : undefined);
    }

    // Update FileList for backend compatibility
    if (sampleFiles) {
      const dt = new DataTransfer();
      Array.from(sampleFiles)
        .filter(file => file.name !== filename)
        .forEach(file => dt.items.add(file));
      setSampleFiles(dt.files);
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
      navbarTitle="MRG Labs Graphing Dashboard"
      navbarRightContent={
        <Button colorScheme="blue" onClick={onExportOpen}>
          Export Graphs
        </Button>
      }
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
          sampleScores={sampleScores}
        />
      }
    >
      <Box p={6}>
        <VStack align="stretch" spacing={6}>
          <SimpleGrid columns={[1, null, 2]} spacing={4}>
            <FileUploadBox
              label="Baseline CSV"
              multiple={false}
              acceptBaseline
              onFilesParsed={(files, raw) => {
                setBaselineParsed(files[0]);
                setBaselineFile(raw[0]);
              }}
            />
            <FileUploadBox
              label="Sample CSVs"
              multiple
              onFilesParsed={(files: ParsedCSV[], raw: FileList) => {
                setSampleParsed(files);
                setSampleFiles(raw);
                // Update selected sample: keep current if still exists, otherwise pick first available
                if (files.length === 0) {
                  setSelectedSample(undefined);
                } else if (!selectedSample || !files.some(f => f.filename === selectedSample)) {
                  setSelectedSample(files[0].filename);
                }
              }}
            />
          </SimpleGrid>

          <Box display="flex" justifyContent="flex-start">
            <Button
              colorScheme="purple"
              variant="outline"
              size="md"
              onClick={onWeightOpen}
            >
              Configure Abnormality Weights
            </Button>
          </Box>

          <GraphPreview
            baseline={baselineParsed}
            samples={sampleParsed}
            selectedSampleName={selectedSample}
            onSelectSample={setSelectedSample}
            baselineFile={baselineFile}
            sampleFiles={sampleFiles}
            abnormalityWeights={abnormalityWeights}
            onScoreUpdate={setSampleScores}
          />
        </VStack>
      </Box>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportOpen}
        onClose={onExportClose}
        baseline={baselineParsed}
        samples={sampleParsed}
      />

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        isOpen={isChangePasswordOpen}
        onClose={onChangePasswordClose}
      />

      {/* Abnormality Weight Configuration Dialog */}
      <AbnormalityWeightDialog
        isOpen={isWeightOpen}
        onClose={onWeightClose}
        onSave={(weights) => {
          setAbnormalityWeights(weights);
          localStorage.setItem('abnormalityWeights', JSON.stringify(weights));
          toast({
            title: 'Weights Saved',
            description: 'Abnormality calculation weights have been configured',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }}
        initialWeights={abnormalityWeights}
      />

      {/* AI Chatbox */}
      <Chatbox
        graphContext={
          baselineParsed && selectedSample
            ? `Analyzing comparison between ${baselineParsed.filename} (baseline) and ${selectedSample} (sample)`
            : undefined
        }
        graphData={{
          baseline: baselineParsed,
          selectedSample: sampleParsed.find(s => s.filename === selectedSample),
          selectedSampleName: selectedSample,
          allSamples: sampleParsed
        }}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
