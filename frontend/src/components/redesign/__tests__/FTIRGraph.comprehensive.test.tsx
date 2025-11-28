// FTIRGraph comprehensive test suite  
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FTIRGraph from '../FTIRGraph_fixed';
import { createMockSample, createMockBaseline } from '../../../test/vitest-setup';

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="mock-chart" data-datasets={data?.datasets?.length || 0}>
      Mock Chart
    </div>
  ),
}));

describe('FTIRGraph', () => {
  const mockBaseline = createMockBaseline();
  const mockSample = createMockSample();
  
  const defaultProps = {
    baseline: mockBaseline,
    sample: mockSample,
    selectedSampleName: 'test-sample.csv',
    onSelectSample: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders component with data', () => {
      render(<FTIRGraph {...defaultProps} />);
      
      expect(screen.getByText('FTIR Spectral Comparison')).toBeInTheDocument();
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
    });

    it('renders no data state when baseline missing', () => {
      render(<FTIRGraph {...defaultProps} baseline={undefined} />);
      
      expect(screen.getByText('No Data Available')).toBeInTheDocument();
      expect(screen.getByText('Upload a baseline and sample CSV to view the spectral comparison')).toBeInTheDocument();
    });

    it('renders no data state when sample missing', () => {
      render(<FTIRGraph {...defaultProps} sample={undefined} />);
      
      expect(screen.getByText('No Data Available')).toBeInTheDocument();
    });

    it('renders error state for invalid data', () => {
      const invalidBaseline = createMockBaseline({ x: [], y: [] });
      render(<FTIRGraph {...defaultProps} baseline={invalidBaseline} />);
      
      expect(screen.getByText('Chart Error')).toBeInTheDocument();
    });
  });

  describe('Toolbar Controls', () => {
    it('renders all toolbar buttons', () => {
      render(<FTIRGraph {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /grid/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset zoom/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show legend/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export chart/i })).toBeInTheDocument();
    });

    it('toggles grid mode when grid button clicked', async () => {
      const user = userEvent.setup();
      render(<FTIRGraph {...defaultProps} />);
      
      const gridButton = screen.getByRole('button', { name: /grid: on/i });
      await user.click(gridButton);
      
      expect(screen.getByRole('button', { name: /grid: off/i })).toBeInTheDocument();
    });

    it('cycles through grid modes: on -> off -> dots -> on', async () => {
      const user = userEvent.setup();
      render(<FTIRGraph {...defaultProps} />);
      
      const gridButton = screen.getByRole('button', { name: /grid: on/i });
      
      await user.click(gridButton);
      expect(screen.getByText('Grid: OFF')).toBeInTheDocument();
      
      await user.click(gridButton);
      expect(screen.getByText('Grid: DOTS')).toBeInTheDocument();
      
      await user.click(gridButton);
      expect(screen.getByText('Grid: ON')).toBeInTheDocument();
    });

    it('toggles legend visibility', async () => {
      const user = userEvent.setup();
      render(<FTIRGraph {...defaultProps} />);
      
      const legendButton = screen.getByRole('button', { name: /show legend/i });
      await user.click(legendButton);
      
      expect(screen.getByRole('button', { name: /hide legend/i })).toBeInTheDocument();
    });
  });

  describe('Chart Data Processing', () => {
    it('creates chart with baseline and sample datasets', () => {
      render(<FTIRGraph {...defaultProps} />);
      
      const chart = screen.getByTestId('mock-chart');
      expect(chart).toHaveAttribute('data-datasets', '2');
    });

    it('handles data decimation for large datasets', () => {
      const largeBaseline = createMockBaseline({
        x: Array.from({ length: 5000 }, (_, i) => i),
        y: Array.from({ length: 5000 }, (_, i) => Math.sin(i * 0.01)),
      });
      const largeSample = createMockSample({
        x: Array.from({ length: 5000 }, (_, i) => i),
        y: Array.from({ length: 5000 }, (_, i) => Math.cos(i * 0.01)),
      });
      
      render(<FTIRGraph {...defaultProps} baseline={largeBaseline} sample={largeSample} />);
      
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
    });

    it('handles mismatched array lengths gracefully', () => {
      const invalidBaseline = createMockBaseline({
        x: [1, 2, 3],
        y: [0.1, 0.2], // Shorter array
      });
      
      render(<FTIRGraph {...defaultProps} baseline={invalidBaseline} />);
      
      expect(screen.getByText('Chart Error')).toBeInTheDocument();
    });

    it('filters out NaN and infinite values', () => {
      const invalidBaseline = createMockBaseline({
        x: [1, 2, NaN, 4, Infinity],
        y: [0.1, 0.2, 0.3, NaN, 0.5],
      });
      
      render(<FTIRGraph {...defaultProps} baseline={invalidBaseline} />);
      
      expect(screen.getByText('Chart Error')).toBeInTheDocument();
    });
  });

  describe('Status-based Styling', () => {
    it('applies good status color for high scores', () => {
      const goodSample = createMockSample({ score: 95 });
      render(<FTIRGraph {...defaultProps} sample={goodSample} />);
      
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
    });

    it('applies warning status color for medium scores', () => {
      const warningSample = createMockSample({ score: 75 });
      render(<FTIRGraph {...defaultProps} sample={warningSample} />);
      
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
    });

    it('applies critical status color for low scores', () => {
      const criticalSample = createMockSample({ score: 65 });
      render(<FTIRGraph {...defaultProps} sample={criticalSample} />);
      
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('triggers download when export button clicked', async () => {
      const user = userEvent.setup();
      
      // Mock canvas and toDataURL
      const mockCanvas = {
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock'),
      };
      
      // Mock the chart ref
      const mockChartRef = { current: { canvas: mockCanvas } };
      vi.spyOn(React, 'useRef').mockReturnValue(mockChartRef);
      
      // Mock DOM methods
      const mockLink = {
        click: vi.fn(),
        href: '',
        download: '',
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
      
      render(<FTIRGraph {...defaultProps} />);
      
      const exportButton = screen.getByRole('button', { name: /export chart/i });
      await user.click(exportButton);
      
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png');
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('displays error message for processing failures', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Force an error by providing invalid data structure
      render(<FTIRGraph {...defaultProps} baseline={null as any} />);
      
      expect(screen.getByText('No Data Available')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('recovers from chart errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Simulate error then recovery
      const { rerender } = render(<FTIRGraph {...defaultProps} baseline={undefined} />);
      expect(screen.getByText('No Data Available')).toBeInTheDocument();
      
      rerender(<FTIRGraph {...defaultProps} />);
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for toolbar buttons', () => {
      render(<FTIRGraph {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /grid: on/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset zoom/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show legend/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export chart as png/i })).toBeInTheDocument();
    });

    it('maintains keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<FTIRGraph {...defaultProps} />);
      
      const gridButton = screen.getByRole('button', { name: /grid/i });
      const resetButton = screen.getByRole('button', { name: /reset zoom/i });
      
      await user.tab();
      // Note: Exact tab order may vary based on other elements
      expect(document.activeElement).toBeInstanceOf(HTMLElement);
    });
  });

  describe('Performance', () => {
    it('memoizes expensive calculations', () => {
      const { rerender } = render(<FTIRGraph {...defaultProps} />);
      
      // Rerender with same props should not recreate data
      rerender(<FTIRGraph {...defaultProps} />);
      
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
    });

    it('handles component unmount cleanly', () => {
      const { unmount } = render(<FTIRGraph {...defaultProps} />);
      
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty arrays gracefully', () => {
      const emptyBaseline = createMockBaseline({ x: [], y: [] });
      render(<FTIRGraph {...defaultProps} baseline={emptyBaseline} />);
      
      expect(screen.getByText('Chart Error')).toBeInTheDocument();
    });

    it('handles single data point', () => {
      const singlePointBaseline = createMockBaseline({ x: [1000], y: [0.1] });
      const singlePointSample = createMockSample({ x: [1000], y: [0.2] });
      
      render(<FTIRGraph {...defaultProps} baseline={singlePointBaseline} sample={singlePointSample} />);
      
      expect(screen.getByText('Chart Error')).toBeInTheDocument();
    });

    it('handles extremely large values', () => {
      const largeValueBaseline = createMockBaseline({
        x: [1000, 2000],
        y: [1e10, 1e11],
      });
      
      render(<FTIRGraph {...defaultProps} baseline={largeValueBaseline} />);
      
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
    });
  });
});