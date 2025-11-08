import React, { useState } from 'react';
import {
  SimpleGrid,
  VStack,
  Box,
  Button,
  useDisclosure
} from '@chakra-ui/react';
import FileUploadBox from '../components/FileUploadBox';
import GraphPreview from '../components/GraphPreview';
import SampleSidebar from '../components/SampleSidebar';
import ExportDialog from '../components/ExportDialog';
import DashboardLayout from '../components/DashboardLayout';
import { ParsedCSV } from '../types';

const Dashboard: React.FC = () => {
  const [baselineParsed, setBaselineParsed] = useState<ParsedCSV | undefined>();
  const [baselineFile, setBaselineFile] = useState<File | undefined>();
  const [sampleParsed, setSampleParsed] = useState<ParsedCSV[]>([]);
  const [sampleFiles, setSampleFiles] = useState<FileList | undefined>();
  const [selectedSample, setSelectedSample] = useState<string | undefined>();
  const { isOpen, onOpen, onClose } = useDisclosure();

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

  return (
    <DashboardLayout
      navbarTitle="MRG Labs Graphing Dashboard"
      navbarRightContent={
        <Button colorScheme="blue" onClick={onOpen}>
          Export Graphs
        </Button>
      }
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

          <GraphPreview
            baseline={baselineParsed}
            samples={sampleParsed}
            selectedSampleName={selectedSample}
            onSelectSample={setSelectedSample}
          />
        </VStack>
      </Box>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={isOpen}
        onClose={onClose}
        baseline={baselineParsed}
        samples={sampleParsed}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
