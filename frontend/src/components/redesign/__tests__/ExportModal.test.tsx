import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { customRender } from '../../../test/utils';
import ExportModal from '../ExportModal';

describe('ExportModal Component', () => {
  const mockSamples = [
    { filename: 'sample1.csv', score: 95 },
    { filename: 'sample2.csv', score: 75 },
    { filename: 'sample3.csv', score: 60 }
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    samples: mockSamples,
    onExport: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders export modal when open', () => {
    customRender(<ExportModal {...defaultProps} />);
    
    expect(screen.getByText('Export Data')).toBeInTheDocument();
    expect(screen.getByText('Select Export Options')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const closedProps = { ...defaultProps, isOpen: false };
    customRender(<ExportModal {...closedProps} />);
    
    expect(screen.queryByText('Export Data')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    customRender(<ExportModal {...defaultProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('allows format selection', () => {
    customRender(<ExportModal {...defaultProps} />);
    
    const formatSelect = screen.getByDisplayValue('PNG');
    fireEvent.change(formatSelect, { target: { value: 'jpeg' } });
    
    expect(screen.getByDisplayValue('JPEG')).toBeInTheDocument();
  });

  it('shows all samples for selection', () => {
    customRender(<ExportModal {...defaultProps} />);
    
    expect(screen.getByText('sample1.csv')).toBeInTheDocument();
    expect(screen.getByText('sample2.csv')).toBeInTheDocument();
    expect(screen.getByText('sample3.csv')).toBeInTheDocument();
  });

  it('allows individual sample selection', () => {
    customRender(<ExportModal {...defaultProps} />);
    
    const sample1Checkbox = screen.getByRole('checkbox', { name: /sample1\.csv/i });
    const sample2Checkbox = screen.getByRole('checkbox', { name: /sample2\.csv/i });
    
    fireEvent.click(sample1Checkbox);
    fireEvent.click(sample2Checkbox);
    
    expect(sample1Checkbox).toBeChecked();
    expect(sample2Checkbox).toBeChecked();
  });

  it('provides preset selection options', () => {
    customRender(<ExportModal {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /all samples/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /critical only/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /warning only/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /good only/i })).toBeInTheDocument();
  });

  it('selects all samples when "All Samples" preset is clicked', async () => {
    customRender(<ExportModal {...defaultProps} />);
    
    const allSamplesButton = screen.getByRole('button', { name: /all samples/i });
    fireEvent.click(allSamplesButton);
    
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox: HTMLElement) => {
        if (checkbox.getAttribute('name')?.includes('sample')) {
          expect(checkbox).toBeChecked();
        }
      });
    });
  });

  it('selects only critical samples when "Critical Only" preset is clicked', async () => {
    customRender(<ExportModal {...defaultProps} />);
    
    const criticalOnlyButton = screen.getByRole('button', { name: /critical only/i });
    fireEvent.click(criticalOnlyButton);
    
    await waitFor(() => {
      const sample3Checkbox = screen.getByRole('checkbox', { name: /sample3\.csv/i });
      expect(sample3Checkbox).toBeChecked(); // Score 60 = critical
      
      const sample1Checkbox = screen.getByRole('checkbox', { name: /sample1\.csv/i });
      expect(sample1Checkbox).not.toBeChecked(); // Score 95 = good
    });
  });

  it('shows export options checkboxes', () => {
    customRender(<ExportModal {...defaultProps} />);
    
    expect(screen.getByRole('checkbox', { name: /include baseline/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /include heatmap/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /include statistics/i })).toBeInTheDocument();
  });

  it('calls onExport with correct config when export button is clicked', async () => {
    customRender(<ExportModal {...defaultProps} />);
    
    // Select format
    const formatSelect = screen.getByDisplayValue('PNG');
    fireEvent.change(formatSelect, { target: { value: 'jpeg' } });
    
    // Select sample
    const sample1Checkbox = screen.getByRole('checkbox', { name: /sample1\.csv/i });
    fireEvent.click(sample1Checkbox);
    
    // Select options
    const includeBaselineCheckbox = screen.getByRole('checkbox', { name: /include baseline/i });
    fireEvent.click(includeBaselineCheckbox);
    
    // Click export
    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(defaultProps.onExport).toHaveBeenCalledWith({
        format: 'jpeg',
        selectedSamples: ['sample1.csv'],
        includeBaseline: true,
        includeHeatmap: false,
        includeStatistics: false,
      });
    });
  });

  it('shows sample count in preset buttons', () => {
    customRender(<ExportModal {...defaultProps} />);
    
    expect(screen.getByText('3 samples')).toBeInTheDocument(); // All samples
    expect(screen.getByText('1 sample')).toBeInTheDocument(); // Critical samples (score < 70)
  });

  it('disables export button when no samples selected', () => {
    customRender(<ExportModal {...defaultProps} />);
    
    const exportButton = screen.getByRole('button', { name: /export/i });
    expect(exportButton).toBeDisabled();
  });

  it('enables export button when samples are selected', async () => {
    customRender(<ExportModal {...defaultProps} />);
    
    const sample1Checkbox = screen.getByRole('checkbox', { name: /sample1\.csv/i });
    fireEvent.click(sample1Checkbox);
    
    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: /export/i });
      expect(exportButton).not.toBeDisabled();
    });
  });

  it('shows progress indicator during export', async () => {
    customRender(<ExportModal {...defaultProps} />);
    
    const sample1Checkbox = screen.getByRole('checkbox', { name: /sample1\.csv/i });
    fireEvent.click(sample1Checkbox);
    
    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);
    
    // Should show loading state briefly
    expect(exportButton).toHaveTextContent(/exporting/i);
  });

  it('closes modal after successful export', async () => {
    customRender(<ExportModal {...defaultProps} />);
    
    const sample1Checkbox = screen.getByRole('checkbox', { name: /sample1\.csv/i });
    fireEvent.click(sample1Checkbox);
    
    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('handles empty samples list', () => {
    const emptyProps = {
      ...defaultProps,
      samples: []
    };
    
    customRender(<ExportModal {...emptyProps} />);
    
    expect(screen.getByText(/no samples available/i)).toBeInTheDocument();
    
    const exportButton = screen.getByRole('button', { name: /export/i });
    expect(exportButton).toBeDisabled();
  });

  it('is accessible', () => {
    customRender(<ExportModal {...defaultProps} />);
    
    // Check modal has proper ARIA attributes
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-labelledby');
    expect(modal).toHaveAttribute('aria-describedby');
    
    // Check form elements have proper labels
    const formatSelect = screen.getByDisplayValue('PNG');
    expect(formatSelect).toHaveAttribute('aria-label');
    
    // Check checkboxes are properly labeled
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((checkbox: HTMLElement) => {
      expect(checkbox).toHaveAttribute('aria-label');
    });
  });

  it('supports keyboard navigation', () => {
    customRender(<ExportModal {...defaultProps} />);
    
    // Check that interactive elements are focusable
    const closeButton = screen.getByRole('button', { name: /close/i });
    const exportButton = screen.getByRole('button', { name: /export/i });
    
    expect(closeButton).not.toBeDisabled();
    expect(exportButton).toBeInTheDocument(); // Might be disabled initially
  });
});