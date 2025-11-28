// Comprehensive test suite setup
// vitest.config.ts

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@redesign': resolve(__dirname, './src/components/redesign'),
    },
  },
});

// src/test/setup.ts
import '@testing-library/jest-dom';
import 'vitest-canvas-mock';

// Mock Chart.js for testing
vi.mock('react-chartjs-2', () => ({
  Line: ({ data, options, ...props }: any) => (
    <div data-testid="mock-chart" data-chart-type="line" {...props}>
      Mock Chart - {data?.datasets?.length || 0} datasets
    </div>
  ),
}));

// Mock file reading APIs
Object.defineProperty(window, 'FileReader', {
  writable: true,
  value: class MockFileReader {
    onload = null;
    onerror = null;
    readAsText = vi.fn().mockImplementation(function(this: any, file: File) {
      setTimeout(() => {
        if (this.onload) {
          this.onload({ 
            target: { 
              result: 'mock,csv,content\n1,2,3\n4,5,6' 
            } 
          });
        }
      }, 0);
    });
  },
});

// Mock intersection observer for virtualization
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  },
});

// Setup test utilities
export const createMockSample = (overrides = {}) => ({
  filename: 'test-sample.csv',
  name: 'Test Sample',
  score: 85,
  starred: false,
  isFavorite: false,
  x: [1000, 2000, 3000, 4000],
  y: [0.1, 0.2, 0.15, 0.05],
  rawContent: 'mock csv content',
  ...overrides,
});

export const createMockBaseline = (overrides = {}) => ({
  filename: 'baseline.csv',
  x: [1000, 2000, 3000, 4000],
  y: [0.1, 0.2, 0.15, 0.05],
  rawContent: 'mock baseline csv',
  ...overrides,
});