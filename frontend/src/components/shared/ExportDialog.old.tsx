import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  RadioGroup,
  Radio,
  Input,
  Button,
  Checkbox,
  CheckboxGroup,
  List,
  ListItem,
  InputGroup,
  InputLeftElement,
  Box,
  useToast,
  Tooltip,
  Icon
} from '@chakra-ui/react';
import { SearchIcon, DownloadIcon } from '@chakra-ui/icons';
import { FaFolderOpen } from 'react-icons/fa';
import { ParsedCSV } from '../../types';
import { checkFolderAccessSupported, exportBlob } from '../../utils/fileSystemAccess';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  baseline?: ParsedCSV;
  samples: ParsedCSV[];
}

const ExportDialog: React.FC<Props> = ({ isOpen, onClose, baseline, samples }) => {
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [selectedSamples, setSelectedSamples] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();

  const filteredSamples = samples.filter(sample => 
    sample.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    setSelectedSamples(filteredSamples.map(s => s.filename));
  };

  const handleClearAll = () => {
    setSelectedSamples([]);
  };

  const handleExport = async (useFolderPicker: boolean = false) => {
    if (!baseline) {
      toast({
        title: 'Error',
        description: 'Please upload a baseline file first',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (selectedSamples.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one sample to export',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsExporting(true);

    try {
      const formData = new FormData();
      
      // Add baseline file
      const baselineBlob = new Blob([baseline.rawContent], { type: 'text/csv' });
      formData.append('baseline', baselineBlob, baseline.filename);

      // Add selected sample files
      selectedSamples.forEach(sampleName => {
        const sample = samples.find(s => s.filename === sampleName);
        if (sample) {
          const sampleBlob = new Blob([sample.rawContent], { type: 'text/csv' });
          formData.append('samples', sampleBlob, sample.filename);
        }
      });

      // Add format info
      formData.append('format', format);

      const response = await fetch('http://localhost:8080/generate_graphs', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const filename = `exported_graphs_${format}.zip`;
      
      // Use folder picker if requested and supported, otherwise fallback
      const result = await exportBlob(blob, filename, useFolderPicker);
      
      if (result.success) {
        if (result.method === 'folder') {
          toast({
            title: 'Exported to folder successfully!',
            description: `${filename} saved to selected folder`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        } else {
          toast({
            title: 'Export Complete',
            description: `Downloaded ${selectedSamples.length} graph(s) as ${format.toUpperCase()} ZIP file`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        }
      } else {
        toast({
          title: 'Export Cancelled',
          description: 'Folder selection was cancelled',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }

      onClose();
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'An error occurred during export. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setFormat('png');
    setSelectedSamples([]);
    setSearchTerm('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Export Graphs</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="start">
            {/* Format Selection */}
            <Box w="100%">
              <Text fontWeight="semibold" mb={2}>Export Format</Text>
              <RadioGroup value={format} onChange={(value) => setFormat(value as 'png' | 'jpeg')}>
                <HStack spacing={4}>
                  <Radio value="png">PNG</Radio>
                  <Radio value="jpeg">JPEG</Radio>
                </HStack>
              </RadioGroup>
            </Box>

            {/* Download Info */}
            <Box w="100%" p={3} bg="blue.50" borderRadius="md">
              <Text fontSize="sm" color="blue.700">
                💡 <strong>Export Options:</strong> Use "Export Graphs" to choose a custom folder (Chromium browsers only), or use standard "Export" for default Downloads folder.
              </Text>
            </Box>

            {/* Sample Selection */}
            <Box w="100%">
              <Text fontWeight="semibold" mb={2}>Select Samples to Export</Text>
              
              <HStack mb={3}>
                <Button size="sm" onClick={handleSelectAll} variant="outline">
                  Select All
                </Button>
                <Button size="sm" onClick={handleClearAll} variant="outline">
                  Clear All
                </Button>
                <Text fontSize="sm" color="gray.600">
                  {selectedSamples.length} of {samples.length} selected
                </Text>
              </HStack>

              <InputGroup mb={3}>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search samples..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <Box maxH="200px" overflowY="auto" border="1px" borderColor="gray.200" borderRadius="md" p={2}>
                <CheckboxGroup value={selectedSamples} onChange={(value) => setSelectedSamples(value as string[])}>
                  <VStack align="start" spacing={2}>
                    {filteredSamples.map((sample) => (
                      <Checkbox key={sample.filename} value={sample.filename}>
                        <Text fontSize="sm">{sample.filename}</Text>
                      </Checkbox>
                    ))}
                  </VStack>
                </CheckboxGroup>
                
                {filteredSamples.length === 0 && searchTerm && (
                  <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                    No samples found matching "{searchTerm}"
                  </Text>
                )}
              </Box>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleReset}>
            Reset
          </Button>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Tooltip 
            label={checkFolderAccessSupported() 
              ? "Choose a folder to save the ZIP file" 
              : "Folder picker not supported in this browser. Use Chrome, Edge, or Opera."
            }
            placement="top"
          >
            <Button 
              colorScheme="green"
              leftIcon={<Icon as={FaFolderOpen} />}
              onClick={() => handleExport(true)}
              isLoading={isExporting}
              loadingText="Exporting..."
              mr={3}
              isDisabled={!checkFolderAccessSupported()}
            >
              Export Graphs
            </Button>
          </Tooltip>
          <Button 
            colorScheme="blue"
            leftIcon={<DownloadIcon />}
            onClick={() => handleExport(false)}
            isLoading={isExporting}
            loadingText="Exporting..."
          >
            Export
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ExportDialog;