import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';

// Mock data for testing
export const mockUser = {
  name: 'Dr. Sarah Johnson',
  email: 'sarah.johnson@lab.com',
  avatarUrl: 'https://via.placeholder.com/40'
};

export const mockRangeWeights = [
  { min: 4000, max: 2750, weight: 100, label: 'O-H, N-H stretch', key: 'oh-nh' },
  { min: 2750, max: 2000, weight: 100, label: 'C-H stretch', key: 'ch' },
  { min: 2000, max: 1750, weight: 100, label: 'C=C, C=N stretch', key: 'cc-cn' },
  { min: 1750, max: 550, weight: 100, label: 'Fingerprint region', key: 'fingerprint' }
];

export const mockSample = {
  filename: 'test-sample.csv',
  x: [4000, 3999, 3998, 3997],
  y: [0.1, 0.12, 0.11, 0.13],
  rawContent: 'Wavenumber,Absorbance\n4000,0.1\n3999,0.12\n3998,0.11\n3997,0.13',
  score: 85.5,
  isFavorite: false
};

export const mockSamples = [
  mockSample,
  {
    filename: 'sample-2.csv',
    x: [4000, 3999, 3998, 3997],
    y: [0.15, 0.14, 0.16, 0.15],
    rawContent: 'Wavenumber,Absorbance\n4000,0.15\n3999,0.14\n3998,0.16\n3997,0.15',
    score: 92.3,
    isFavorite: true
  },
  {
    filename: 'sample-3.csv',
    x: [4000, 3999, 3998, 3997],
    y: [0.08, 0.09, 0.07, 0.08],
    rawContent: 'Wavenumber,Absorbance\n4000,0.08\n3999,0.09\n3998,0.07\n3997,0.08',
    score: 65.1,
    isFavorite: false
  }
];

export const mockAnalysisResults = {
  success: true,
  scores: {
    'test-sample.csv': 85.5,
    'sample-2.csv': 92.3,
    'sample-3.csv': 65.1
  },
  deviationData: {
    x: [4000, 3999, 3998, 3997],
    deviation: [0.02, 0.01, 0.03, 0.02],
    maxDeviation: 0.03,
    avgDeviation: 0.02
  },
  processingTime: 1234,
  metadata: {
    baseline_filename: 'baseline.csv',
    sample_count: 3,
    scoring_method: 'hybrid' as const,
    zone_weights_used: mockRangeWeights,
    timestamp: '2025-11-28T06:30:00Z'
  }
};

export const mockFile = new File(['test content'], 'test.csv', { type: 'text/csv' });

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withRouter?: boolean;
  withChakra?: boolean;
}

const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <ChakraProvider>
        {children}
      </ChakraProvider>
    </BrowserRouter>
  );
};

const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

const ChakraOnlyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ChakraProvider>{children}</ChakraProvider>;
};

export const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { withRouter = false, withChakra = false, ...renderOptions } = options;
  
  let wrapper: React.ComponentType<{ children: React.ReactNode }> | undefined;
  
  if (withRouter && withChakra) {
    wrapper = AllProviders;
  } else if (withRouter) {
    wrapper = RouterProvider;
  } else if (withChakra) {
    wrapper = ChakraOnlyProvider;
  }
  
  return render(ui, { wrapper, ...renderOptions });
};

// Helper functions for testing
export const createMockFileList = (files: File[]): FileList => {
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] || null,
    [Symbol.iterator]: function* () {
      for (let i = 0; i < files.length; i++) {
        yield files[i];
      }
    }
  };
  
  // Add indexed properties
  files.forEach((file, index) => {
    (fileList as any)[index] = file;
  });
  
  return fileList as FileList;
};

export const createMockChangeEvent = (files: File[]): React.ChangeEvent<HTMLInputElement> => {
  const fileList = createMockFileList(files);
  return {
    target: { files: fileList },
    currentTarget: { files: fileList }
  } as React.ChangeEvent<HTMLInputElement>;
};

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Test helpers for API mocking
export const createMockApiResponse = (data: any, delay = 100) => {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), delay);
  });
};

export const createMockApiError = (message: string, status = 500, delay = 100) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(message) as any;
      error.response = { status, data: { error: message } };
      reject(error);
    }, delay);
  });
};