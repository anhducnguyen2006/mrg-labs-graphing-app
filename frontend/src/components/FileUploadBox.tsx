import React, { useState, useRef } from 'react';
import Papa, { ParseResult } from 'papaparse';
import { Box, Text, Input, VStack, HStack, Tag, Button } from '@chakra-ui/react';
import { ParsedCSV } from '../types';

interface Props {
  label: string;
  multiple?: boolean;
  onFilesParsed: (files: ParsedCSV[], rawFiles: FileList) => void;
  acceptBaseline?: boolean; // distinguishes baseline upload
}

const FileUploadBox: React.FC<Props> = ({ label, multiple = false, onFilesParsed, acceptBaseline }) => {
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [accumulatedParsed, setAccumulatedParsed] = useState<ParsedCSV[]>([]);
  const [accumulatedFiles, setAccumulatedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    if (!multiple && files.length > 1) {
      setError('Only one file allowed for baseline');
      return;
    }
    
    // Check file types
    const fileArray: File[] = Array.from(files);
    const invalidFiles = fileArray.filter(f => !f.name.toLowerCase().endsWith('.csv'));
    if (invalidFiles.length > 0) {
      setError('Only CSV files are allowed');
      return;
    }
    
    // For baseline (single file), replace everything
    if (!multiple) {
      setFileNames([]);
      setAccumulatedParsed([]);
      setAccumulatedFiles([]);
      // Clear the input for baseline replacement
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    
    setError(null);
    const parsedList: ParsedCSV[] = [];

    let remaining = fileArray.length;
    fileArray.forEach((f: File) => {
      // Skip if file with same name already exists (for multiple uploads)
      if (multiple && accumulatedParsed.some(p => p.filename === f.name)) {
        remaining -= 1;
        if (remaining === 0) {
          // Still need to call callback with current accumulated data
          const combinedFileList = new DataTransfer();
          accumulatedFiles.forEach(file => combinedFileList.items.add(file));
          onFilesParsed(accumulatedParsed, combinedFileList.files);
        }
        return;
      }

      // First read the file as text to get raw content
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawContent = e.target?.result as string;
        
        Papa.parse(f, {
          header: false,
          skipEmptyLines: true,
          complete: (results: ParseResult<any[]>) => {
            // Skip first row similar to backend header=1
            const dataRows = (results.data as unknown as (string | number)[][]).slice(1);
            const x: number[] = [];
            const y: number[] = [];
            dataRows.forEach(row => {
              if (Array.isArray(row) && row.length >= 2) {
                const xv = Number(row[0]);
                const yv = Number(row[1]);
                if (!Number.isNaN(xv) && !Number.isNaN(yv)) {
                  x.push(xv); y.push(yv);
                }
              }
            });
            parsedList.push({ filename: f.name, x, y, rawContent });
            remaining -= 1;
            if (remaining === 0) {
              // Combine with existing data for multiple uploads
              const newParsedData = multiple ? [...accumulatedParsed, ...parsedList] : parsedList;
              const newFiles = multiple ? [...accumulatedFiles, ...fileArray] : fileArray;
              const newFileNames = newParsedData.map(p => p.filename);
              
              setAccumulatedParsed(newParsedData);
              setAccumulatedFiles(newFiles);
              setFileNames(newFileNames);

              // Create FileList from accumulated files
              const combinedFileList = new DataTransfer();
              newFiles.forEach(file => combinedFileList.items.add(file));
              onFilesParsed(newParsedData, combinedFileList.files);
            }
          },
          error: (err: any) => {
            setError(err?.message ?? 'Parse error');
          }
        });
      };
      reader.readAsText(f);
    });
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    processFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <Box 
      borderWidth="2px" 
      borderColor={isDragOver ? (acceptBaseline ? 'green.600' : 'blue.600') : (acceptBaseline ? 'green.400' : 'blue.400')}
      borderStyle={isDragOver ? 'solid' : 'dashed'}
      p={4} 
      rounded="md" 
      w="100%" 
      bg={isDragOver ? (acceptBaseline ? 'green.50' : 'blue.50') : 'white'} 
      shadow="sm"
      transition="all 0.2s"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      position="relative"
    >
      <VStack align="start" spacing={3}>
        <HStack justify="space-between" w="100%">
          <Text fontWeight="bold">{label}</Text>
          {multiple && fileNames.length > 0 && (
            <Text fontSize="sm" color="gray.600">
              {fileNames.length} file{fileNames.length !== 1 ? 's' : ''}
            </Text>
          )}
        </HStack>
        <Input ref={fileInputRef} type="file" multiple={multiple} accept=".csv" onChange={handleChange} />
        {!fileNames.length && (
          <Text fontSize="sm" color="gray.500" textAlign="center">
            Drag and drop CSV files here, or use the button above to select files
          </Text>
        )}
        {error && <Text color="red.500" fontSize="sm">{error}</Text>}
        
        {isDragOver && (
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg={acceptBaseline ? 'green.100' : 'blue.100'}
            border="2px dashed"
            borderColor={acceptBaseline ? 'green.500' : 'blue.500'}
            borderRadius="md"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex="1"
          >
            <Text
              fontSize="lg"
              fontWeight="bold"
              color={acceptBaseline ? 'green.600' : 'blue.600'}
            >
              📁 Drop CSV files here
            </Text>
          </Box>
        )}
        <HStack wrap="wrap">
          {fileNames.map((fn: string) => (
            <Tag key={fn} colorScheme={acceptBaseline ? 'green' : 'blue'} variant="solid">
              {fn}
              {multiple && (
                <Button
                  size="xs"
                  ml={2}
                  variant="ghost"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.300' }}
                  onClick={() => {
                    const newParsed = accumulatedParsed.filter((p: ParsedCSV) => p.filename !== fn);
                    const newFiles = accumulatedFiles.filter((f: File) => f.name !== fn);
                    const newFileNames = newParsed.map((p: ParsedCSV) => p.filename);
                    
                    setAccumulatedParsed(newParsed);
                    setAccumulatedFiles(newFiles);
                    setFileNames(newFileNames);

                    // If no files left, clear the input
                    if (newFiles.length === 0 && fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }

                    const combinedFileList = new DataTransfer();
                    newFiles.forEach((file: File) => combinedFileList.items.add(file));
                    onFilesParsed(newParsed, combinedFileList.files);
                  }}
                >
                  ×
                </Button>
              )}
            </Tag>
          ))}
        </HStack>
        {fileNames.length > 0 && <Button size="sm" onClick={() => {
          setFileNames([]);
          setAccumulatedParsed([]);
          setAccumulatedFiles([]);
          // Clear the file input element
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          onFilesParsed([], new DataTransfer().files);
        }}>Clear All</Button>}
      </VStack>
    </Box>
  );
};

export default FileUploadBox;
