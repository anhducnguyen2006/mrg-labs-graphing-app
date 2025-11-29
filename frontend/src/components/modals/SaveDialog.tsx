import React, { useState } from 'react';
import { Button, Box, VStack, Text, List, ListItem, Spinner, HStack, Input } from '@chakra-ui/react';
import axios from 'axios';
import { SavedGraphResponse } from '../../types';

interface Props {
  baseline?: File;
  samples?: FileList;
  onSaved: (paths: string[]) => void;
}

const SaveDialog: React.FC<Props> = ({ baseline, samples, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [paths, setPaths] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [folder, setFolder] = useState<string>(() => {
    const d = new Date();
    const iso = d.toISOString().replace(/[:.]/g, '-');
    return `run-${iso}`;
  });

  const handleGenerate = async () => {
    if (!baseline || !samples || samples.length === 0) {
      setError('Baseline and at least one sample required');
      return;
    }
    setLoading(true); setError(null);
    try {
      const form = new FormData();
      form.append('baseline', baseline);
      Array.from(samples as FileList).forEach((f) => form.append('samples', f));
      form.append('save_dir', folder);
      const res = await axios.post<SavedGraphResponse>('/generate_graphs', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPaths(res.data.saved_paths);
      onSaved(res.data.saved_paths);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box w="100%" bg="white" p={4} borderWidth="1px" rounded="md" shadow="sm">
      <VStack align="start" spacing={3}>
        <Text fontWeight="bold">Batch Export</Text>
        <HStack>
          <Input size="sm" placeholder="Folder name (optional)" value={folder} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFolder(e.target.value)} />
          <Button colorScheme="purple" size="sm" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating…' : 'Batch Save Graphs'}
          </Button>
        </HStack>
        {loading && <Spinner size="sm" />}
        {error && <Text color="red.500" fontSize="sm">{error}</Text>}
        {paths.length > 0 && (
          <Box w="100%">
            <Text fontSize="sm" fontWeight="semibold">Saved Images:</Text>
            <List spacing={1}>
              {paths.map((p: string) => <ListItem key={p}><a className="text-blue-600 underline" href={p} target="_blank" rel="noreferrer">{p}</a></ListItem>)}
            </List>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default SaveDialog;
