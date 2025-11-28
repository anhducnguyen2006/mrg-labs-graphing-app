// ScoreCard comprehensive test suite
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScoreCard from '../ScoreCard';

describe('ScoreCard', () => {
  const defaultProps = {
    sampleName: 'test-sample.csv',
    score: 85,
    uploadDate: 'Nov 28, 2025 10:45 AM',
    dataPoints: 1500,
    scoringMethod: 'hybrid' as const,
    onMethodChange: vi.fn(),
    onConfigure: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('displays sample information correctly', () => {
      render(<ScoreCard {...defaultProps} />);
      
      expect(screen.getByText('Sample: test-sample')).toBeInTheDocument();
      expect(screen.getByText(/Uploaded: Nov 28, 2025 10:45 AM • 1,500 data points/)).toBeInTheDocument();
    });

    it('removes .csv extension from sample name', () => {
      render(<ScoreCard {...defaultProps} sampleName="test.csv" />);
      expect(screen.getByText('Sample: test')).toBeInTheDocument();
    });

    it('formats large numbers with commas', () => {
      render(<ScoreCard {...defaultProps} dataPoints={1234567} />);
      expect(screen.getByText(/1,234,567 data points/)).toBeInTheDocument();
    });
  });

  describe('Score Display and Status', () => {
    it('displays good status for score >= 90', () => {
      render(<ScoreCard {...defaultProps} score={95} />);
      
      expect(screen.getByText('🟢 SAFE')).toBeInTheDocument();
      expect(screen.getByText('Score: 95 / 100')).toBeInTheDocument();
      
      const statusContainer = screen.getByText('🟢 SAFE').closest('div');
      expect(statusContainer).toHaveClass('bg-green-100');
    });

    it('displays warning status for score 70-89', () => {
      render(<ScoreCard {...defaultProps} score={75} />);
      
      expect(screen.getByText('🟡 WARNING')).toBeInTheDocument();
      expect(screen.getByText('Score: 75 / 100')).toBeInTheDocument();
      
      const statusContainer = screen.getByText('🟡 WARNING').closest('div');
      expect(statusContainer).toHaveClass('bg-yellow-100');
    });

    it('displays critical status for score < 70', () => {
      render(<ScoreCard {...defaultProps} score={65} />);
      
      expect(screen.getByText('🔴 CRITICAL')).toBeInTheDocument();
      expect(screen.getByText('Score: 65 / 100')).toBeInTheDocument();
      
      const statusContainer = screen.getByText('🔴 CRITICAL').closest('div');
      expect(statusContainer).toHaveClass('bg-red-100');
    });
  });

  describe('Progress Bar', () => {
    it('sets correct width based on score', () => {
      render(<ScoreCard {...defaultProps} score={75} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle('width: 75%');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    });

    it('handles minimum score of 0', () => {
      render(<ScoreCard {...defaultProps} score={0} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle('width: 0%');
    });

    it('handles maximum score of 100', () => {
      render(<ScoreCard {...defaultProps} score={100} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle('width: 100%');
    });

    it('clamps negative scores to 0%', () => {
      render(<ScoreCard {...defaultProps} score={-10} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle('width: 0%');
    });

    it('clamps scores above 100 to 100%', () => {
      render(<ScoreCard {...defaultProps} score={150} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle('width: 100%');
    });
  });

  describe('Scoring Method Selection', () => {
    it('displays current scoring method', () => {
      render(<ScoreCard {...defaultProps} scoringMethod="rmse" />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('rmse');
    });

    it('shows all scoring method options', () => {
      render(<ScoreCard {...defaultProps} />);
      
      const select = screen.getByRole('combobox');
      const options = Array.from(select.querySelectorAll('option'));
      
      expect(options).toHaveLength(4);
      expect(options[0]).toHaveTextContent('Hybrid (RMSE + Shape) ✓');
      expect(options[1]).toHaveTextContent('RMSE Deviation Only');
      expect(options[2]).toHaveTextContent('Pearson Correlation Only');
      expect(options[3]).toHaveTextContent('Area Difference');
    });

    it('marks hybrid method as recommended', () => {
      render(<ScoreCard {...defaultProps} scoringMethod="hybrid" />);
      
      const hybridOption = screen.getByRole('option', { name: /hybrid.*✓/i });
      expect(hybridOption).toBeInTheDocument();
    });

    it('calls onMethodChange when selection changes', async () => {
      const user = userEvent.setup();
      render(<ScoreCard {...defaultProps} />);
      
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'rmse');
      
      expect(defaultProps.onMethodChange).toHaveBeenCalledWith('rmse');
    });
  });

  describe('Configure Button', () => {
    it('renders configure button', () => {
      render(<ScoreCard {...defaultProps} />);
      
      const configureButton = screen.getByRole('button', { name: /configure/i });
      expect(configureButton).toBeInTheDocument();
      expect(configureButton).toHaveTextContent('⚙️ Configure');
    });

    it('calls onConfigure when clicked', async () => {
      const user = userEvent.setup();
      render(<ScoreCard {...defaultProps} />);
      
      const configureButton = screen.getByRole('button', { name: /configure/i });
      await user.click(configureButton);
      
      expect(defaultProps.onConfigure).toHaveBeenCalled();
    });
  });

  describe('Recommendation Text', () => {
    it('shows recommendation for hybrid method', () => {
      render(<ScoreCard {...defaultProps} scoringMethod="hybrid" />);
      
      expect(screen.getByText('💡 Recommended for grease oxidation analysis')).toBeInTheDocument();
    });

    it('hides recommendation for non-hybrid methods', () => {
      render(<ScoreCard {...defaultProps} scoringMethod="rmse" />);
      
      expect(screen.queryByText('💡 Recommended for grease oxidation analysis')).not.toBeInTheDocument();
    });
  });

  describe('Threshold Labels', () => {
    it('displays correct threshold labels', () => {
      render(<ScoreCard {...defaultProps} />);
      
      expect(screen.getByText('Critical: <70')).toBeInTheDocument();
      expect(screen.getByText('Monitor: 70-89')).toBeInTheDocument();
      expect(screen.getByText('Safe: 90+')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles fractional scores', () => {
      render(<ScoreCard {...defaultProps} score={85.7} />);
      
      expect(screen.getByText('Score: 85.7 / 100')).toBeInTheDocument();
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle('width: 85.7%');
    });

    it('handles zero data points', () => {
      render(<ScoreCard {...defaultProps} dataPoints={0} />);
      
      expect(screen.getByText(/0 data points/)).toBeInTheDocument();
    });

    it('handles very long sample names', () => {
      const longName = 'very-long-sample-name-that-might-overflow-the-container.csv';
      render(<ScoreCard {...defaultProps} sampleName={longName} />);
      
      expect(screen.getByText(/Sample: very-long-sample-name/)).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('applies transition classes to progress bar', () => {
      render(<ScoreCard {...defaultProps} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('transition-all', 'duration-800', 'ease-out');
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA attributes for progress bar', () => {
      render(<ScoreCard {...defaultProps} score={75} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('provides proper labels for form controls', () => {
      render(<ScoreCard {...defaultProps} />);
      
      const label = screen.getByText('Scoring Method:');
      const select = screen.getByRole('combobox');
      
      expect(label).toBeInTheDocument();
      expect(select).toBeInTheDocument();
    });

    it('maintains keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ScoreCard {...defaultProps} />);
      
      await user.tab();
      expect(screen.getByRole('combobox')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /configure/i })).toHaveFocus();
    });
  });

  describe('Memoization', () => {
    it('does not re-render when props are unchanged', () => {
      const { rerender } = render(<ScoreCard {...defaultProps} />);
      const initialElement = screen.getByText('Score: 85 / 100');
      
      rerender(<ScoreCard {...defaultProps} />);
      const rerenderElement = screen.getByText('Score: 85 / 100');
      
      expect(initialElement).toBe(rerenderElement);
    });

    it('re-renders when score changes', () => {
      const { rerender } = render(<ScoreCard {...defaultProps} score={85} />);
      expect(screen.getByText('Score: 85 / 100')).toBeInTheDocument();
      
      rerender(<ScoreCard {...defaultProps} score={90} />);
      expect(screen.getByText('Score: 90 / 100')).toBeInTheDocument();
      expect(screen.queryByText('Score: 85 / 100')).not.toBeInTheDocument();
    });
  });
});