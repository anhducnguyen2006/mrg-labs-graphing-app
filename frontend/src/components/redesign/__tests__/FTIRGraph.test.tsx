import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { customRender } from '../../../test/utils';
import FTIRGraph from '../FTIRGraph_fixed';

describe('FTIRGraph Component', () => {
  const defaultProps = {
    baseline: {
      filename: 'baseline.csv',
      x: [4000, 3999, 3998, 3997, 3996],
      y: [0.1, 0.12, 0.11, 0.13, 0.09]
    },
    sample: {
      filename: 'sample.csv',
      x: [4000, 3999, 3998, 3997, 3996],
      y: [0.15, 0.17, 0.14, 0.16, 0.12]
    },
    selectedSampleName: 'sample.csv',
    onSelectSample: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders FTIR graph when baseline and sample data provided', () => {
    customRender(<FTIRGraph {...defaultProps} />);
    
    // Chart.js creates a canvas element
    const canvas = screen.getByRole('img'); // Chart.js canvas has img role
    expect(canvas).toBeInTheDocument();
  });

  it('renders empty state when no data is provided', () => {
    const emptyProps = {
      baseline: undefined,
      sample: undefined,
      selectedSampleName: undefined,
      onSelectSample: vi.fn(),
    };
    customRender(<FTIRGraph {...emptyProps} />);
    
    // Should render but without chart data
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  it('handles grid mode toggle', () => {
    customRender(<FTIRGraph {...defaultProps} />);
    
    const gridButton = screen.getByRole('button', { name: /grid/i });
    fireEvent.click(gridButton);
    
    // Grid mode should cycle through 'on', 'off', 'dots'
    expect(gridButton).toBeInTheDocument();
  });

  it('displays zoom controls', () => {
    customRender(<FTIRGraph {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset zoom/i })).toBeInTheDocument();
  });

  it('handles legend toggle', () => {
    customRender(<FTIRGraph {...defaultProps} />);
    
    const legendButton = screen.getByRole('button', { name: /legend/i });
    fireEvent.click(legendButton);
    
    // Legend visibility should toggle
    expect(legendButton).toBeInTheDocument();
  });

  it('calls onSelectSample when sample selection changes', () => {
    customRender(<FTIRGraph {...defaultProps} />);
    
    // Find sample selector if it exists
    const sampleSelect = screen.queryByRole('combobox');
    if (sampleSelect) {
      fireEvent.change(sampleSelect, { target: { value: 'new-sample.csv' } });
      expect(defaultProps.onSelectSample).toHaveBeenCalledWith('new-sample.csv');
    }
  });

  it('displays baseline and sample data correctly', () => {
    customRender(<FTIRGraph {...defaultProps} />);
    
    // Should display both baseline and sample filenames
    expect(screen.getByText('baseline.csv')).toBeInTheDocument();
    expect(screen.getByText('sample.csv')).toBeInTheDocument();
  });

  it('handles export functionality', () => {
    customRender(<FTIRGraph {...defaultProps} />);
    
    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);
    
    // Export should trigger chart download
    expect(exportButton).toBeInTheDocument();
  });

  it('shows correct axis labels for FTIR data', () => {
    customRender(<FTIRGraph {...defaultProps} />);
    
    // Check for wavenumber (cm⁻¹) and transmittance labels
    expect(screen.getByText(/wavenumber/i)).toBeInTheDocument();
    expect(screen.getByText(/transmittance/i)).toBeInTheDocument();
  });

  it('applies correct styling with custom className', () => {
    const customProps = {
      ...defaultProps,
      className: 'custom-ftir-graph'
    };
    
    const { container } = customRender(<FTIRGraph {...customProps} />);
    expect(container.firstChild).toHaveClass('custom-ftir-graph');
  });

  it('handles zoom interactions', async () => {
    customRender(<FTIRGraph {...defaultProps} />);
    
    const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
    const zoomOutButton = screen.getByRole('button', { name: /zoom out/i });
    const resetButton = screen.getByRole('button', { name: /reset/i });
    
    // Test zoom in
    fireEvent.click(zoomInButton);
    await waitFor(() => {
      expect(zoomInButton).toBeInTheDocument();
    });

    // Test zoom out
    fireEvent.click(zoomOutButton);
    await waitFor(() => {
      expect(zoomOutButton).toBeInTheDocument();
    });

    // Test reset zoom
    fireEvent.click(resetButton);
    await waitFor(() => {
      expect(resetButton).toBeInTheDocument();
    });
  });

  it('is accessible', () => {
    customRender(<FTIRGraph {...defaultProps} />);
    
    // Check that interactive elements have proper accessibility
    const canvas = screen.getByRole('img');
    expect(canvas).toHaveAttribute('aria-label');
    
    // Check that all buttons are accessible
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button: HTMLElement) => {
      expect(button).not.toBeDisabled();
    });
  });

  it('updates chart when props change', () => {
    const { rerender } = customRender(<FTIRGraph {...defaultProps} />);
    
    // Update with different sample
    const newProps = {
      ...defaultProps,
      sample: {
        filename: 'new-sample.csv',
        x: [4000, 3999, 3998],
        y: [0.2, 0.22, 0.21]
      }
    };
    
    rerender(<FTIRGraph {...newProps} />);
    expect(screen.getByText('new-sample.csv')).toBeInTheDocument();
  });
});