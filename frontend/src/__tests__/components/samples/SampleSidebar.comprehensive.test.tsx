// SampleSidebar comprehensive test suite
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SampleSidebar from '../../../components/samples/SampleSidebar';
import { createMockSample } from '../../../test/vitest-setup';

describe('SampleSidebar', () => {
  const mockSamples = [
    createMockSample({ 
      filename: 'critical-sample.csv', 
      score: 65, 
      starred: false 
    }),
    createMockSample({ 
      filename: 'warning-sample.csv', 
      score: 75, 
      starred: true 
    }),
    createMockSample({ 
      filename: 'good-sample.csv', 
      score: 95, 
      starred: false 
    }),
  ];

  const defaultProps = {
    samples: mockSamples,
    selectedSampleName: 'warning-sample.csv',
    onSelectSample: vi.fn(),
    onRemoveSample: vi.fn(),
    onToggleFavorite: vi.fn(),
    statusFilter: 'all' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('displays sample count in header', () => {
      render(<SampleSidebar {...defaultProps} />);
      expect(screen.getByText('Samples (3)')).toBeInTheDocument();
    });

    it('renders all sample cards', () => {
      render(<SampleSidebar {...defaultProps} />);
      
      expect(screen.getByText(/critical-sample/)).toBeInTheDocument();
      expect(screen.getByText(/warning-sample/)).toBeInTheDocument();
      expect(screen.getByText(/good-sample/)).toBeInTheDocument();
    });

    it('highlights selected sample with ring', () => {
      render(<SampleSidebar {...defaultProps} />);
      
      const warningSample = screen.getByText(/warning-sample/).closest('div');
      expect(warningSample).toHaveClass('ring-2', 'ring-blue-500');
    });

    it('displays correct status colors', () => {
      render(<SampleSidebar {...defaultProps} />);
      
      const criticalSample = screen.getByText(/critical-sample/).closest('div');
      const warningSample = screen.getByText(/warning-sample/).closest('div');
      const goodSample = screen.getByText(/good-sample/).closest('div');
      
      expect(criticalSample).toHaveClass('bg-red-50', 'border-red-200');
      expect(warningSample).toHaveClass('bg-yellow-50', 'border-yellow-200');
      expect(goodSample).toHaveClass('bg-white', 'border-gray-200');
    });

    it('shows star icon for starred samples', () => {
      render(<SampleSidebar {...defaultProps} />);
      
      const warningSample = screen.getByText(/warning-sample/).closest('div');
      expect(within(warningSample!).getByRole('button')).toBeInTheDocument();
    });

    it('displays status summary correctly', () => {
      render(<SampleSidebar {...defaultProps} />);
      
      expect(screen.getByText('Critical: 1')).toBeInTheDocument();
      expect(screen.getByText('Warning: 1')).toBeInTheDocument();
      expect(screen.getByText('Good: 1')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('filters by search term', async () => {
      const user = userEvent.setup();
      render(<SampleSidebar {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search samples...');
      await user.type(searchInput, 'critical');
      
      expect(screen.getByText(/critical-sample/)).toBeInTheDocument();
      expect(screen.queryByText(/warning-sample/)).not.toBeInTheDocument();
      expect(screen.queryByText(/good-sample/)).not.toBeInTheDocument();
    });

    it('filters by starred only', async () => {
      const user = userEvent.setup();
      render(<SampleSidebar {...defaultProps} />);
      
      const starredButton = screen.getByRole('button', { name: /starred/i });
      await user.click(starredButton);
      
      expect(screen.queryByText(/critical-sample/)).not.toBeInTheDocument();
      expect(screen.getByText(/warning-sample/)).toBeInTheDocument();
      expect(screen.queryByText(/good-sample/)).not.toBeInTheDocument();
    });

    it('sorts by name', async () => {
      const user = userEvent.setup();
      render(<SampleSidebar {...defaultProps} />);
      
      const sortSelect = screen.getByDisplayValue('Recent');
      await user.selectOptions(sortSelect, 'Name');
      
      const sampleCards = screen.getAllByText(/sample/);
      expect(sampleCards[0]).toHaveTextContent('critical-sample');
      expect(sampleCards[1]).toHaveTextContent('good-sample');
      expect(sampleCards[2]).toHaveTextContent('warning-sample');
    });

    it('sorts by score', async () => {
      const user = userEvent.setup();
      render(<SampleSidebar {...defaultProps} />);
      
      const sortSelect = screen.getByDisplayValue('Recent');
      await user.selectOptions(sortSelect, 'Score');
      
      const sampleCards = screen.getAllByText(/sample/);
      expect(sampleCards[0]).toHaveTextContent('good-sample'); // Highest score first
      expect(sampleCards[1]).toHaveTextContent('warning-sample');
      expect(sampleCards[2]).toHaveTextContent('critical-sample');
    });
  });

  describe('Interactions', () => {
    it('calls onSelectSample when sample clicked', async () => {
      const user = userEvent.setup();
      render(<SampleSidebar {...defaultProps} />);
      
      const criticalSample = screen.getByText(/critical-sample/).closest('div');
      await user.click(criticalSample!);
      
      expect(defaultProps.onSelectSample).toHaveBeenCalledWith('critical-sample.csv');
    });

    it('calls onToggleFavorite when star clicked', async () => {
      const user = userEvent.setup();
      render(<SampleSidebar {...defaultProps} />);
      
      const starButton = screen.getAllByRole('button').find(btn => 
        btn.className.includes('text-red-500') || btn.className.includes('text-gray-400')
      );
      
      await user.click(starButton!);
      expect(defaultProps.onToggleFavorite).toHaveBeenCalled();
    });
  });

  describe('Status Filtering', () => {
    it('filters samples by status filter prop', () => {
      render(<SampleSidebar {...defaultProps} statusFilter="critical" />);
      
      expect(screen.getByText(/critical-sample/)).toBeInTheDocument();
      expect(screen.queryByText(/warning-sample/)).not.toBeInTheDocument();
      expect(screen.queryByText(/good-sample/)).not.toBeInTheDocument();
    });

    it('shows all samples when filter is "all"', () => {
      render(<SampleSidebar {...defaultProps} statusFilter="all" />);
      
      expect(screen.getByText(/critical-sample/)).toBeInTheDocument();
      expect(screen.getByText(/warning-sample/)).toBeInTheDocument();
      expect(screen.getByText(/good-sample/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty sample list', () => {
      render(<SampleSidebar {...defaultProps} samples={[]} />);
      
      expect(screen.getByText('Samples (0)')).toBeInTheDocument();
      expect(screen.getByText('No samples found')).toBeInTheDocument();
    });

    it('handles samples with missing scores', () => {
      const samplesWithoutScores = [
        createMockSample({ filename: 'no-score.csv', score: undefined }),
      ];
      
      render(<SampleSidebar {...defaultProps} samples={samplesWithoutScores} />);
      
      expect(screen.getByText(/no-score/)).toBeInTheDocument();
    });

    it('handles samples with invalid data', () => {
      const invalidSamples = [
        createMockSample({ 
          filename: 'invalid.csv', 
          x: [], 
          y: [] 
        }),
      ];
      
      render(<SampleSidebar {...defaultProps} samples={invalidSamples} />);
      
      expect(screen.getByText(/invalid/)).toBeInTheDocument();
      expect(screen.getByText('0 data points')).toBeInTheDocument();
    });

    it('handles very long sample names', () => {
      const longNameSamples = [
        createMockSample({ 
          filename: 'very-very-very-long-sample-name-that-should-be-truncated.csv' 
        }),
      ];
      
      render(<SampleSidebar {...defaultProps} samples={longNameSamples} />);
      
      const sampleCard = screen.getByText(/very-very-very-long/).closest('div');
      expect(sampleCard).toHaveClass('truncate');
    });
  });

  describe('Performance', () => {
    it('handles large number of samples', () => {
      const manySamples = Array.from({ length: 1000 }, (_, i) =>
        createMockSample({ 
          filename: `sample-${i}.csv`,
          score: Math.random() * 100 
        })
      );
      
      const { container } = render(<SampleSidebar {...defaultProps} samples={manySamples} />);
      
      expect(screen.getByText('Samples (1000)')).toBeInTheDocument();
      expect(container.querySelectorAll('[data-testid*="sample"]').length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels', () => {
      render(<SampleSidebar {...defaultProps} />);
      
      const searchInput = screen.getByRole('textbox', { name: /search samples/i });
      expect(searchInput).toBeInTheDocument();
      
      const starredButton = screen.getByRole('button', { name: /starred/i });
      expect(starredButton).toBeInTheDocument();
    });

    it('maintains keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<SampleSidebar {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search samples...');
      
      await user.tab();
      expect(searchInput).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /starred/i })).toHaveFocus();
    });
  });
});