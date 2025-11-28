import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { customRender } from '../../../test/utils';
import SampleSidebar from '../SampleSidebar';

describe('SampleSidebar Component', () => {
  const mockSamples = [
    {
      filename: 'sample1.csv',
      score: 95,
      isFavorite: false,
      x: [4000, 3999, 3998],
      y: [0.1, 0.12, 0.11]
    },
    {
      filename: 'sample2.csv',
      score: 75,
      isFavorite: true,
      x: [4000, 3999, 3998],
      y: [0.15, 0.17, 0.14]
    },
    {
      filename: 'sample3.csv',
      score: 60,
      isFavorite: false,
      x: [4000, 3999, 3998],
      y: [0.2, 0.22, 0.21]
    }
  ];

  const defaultProps = {
    samples: mockSamples,
    selectedSampleName: 'sample1.csv',
    onSelectSample: vi.fn(),
    onRemoveSample: vi.fn(),
    onToggleFavorite: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all samples in the sidebar', () => {
    customRender(<SampleSidebar {...defaultProps} />);
    
    expect(screen.getByText('sample1.csv')).toBeInTheDocument();
    expect(screen.getByText('sample2.csv')).toBeInTheDocument();
    expect(screen.getByText('sample3.csv')).toBeInTheDocument();
  });

  it('highlights the selected sample', () => {
    customRender(<SampleSidebar {...defaultProps} />);
    
    const selectedSample = screen.getByText('sample1.csv').closest('div');
    expect(selectedSample).toHaveClass('bg-blue-50', 'border-blue-200');
  });

  it('calls onSelectSample when a sample is clicked', () => {
    customRender(<SampleSidebar {...defaultProps} />);
    
    const sample2 = screen.getByText('sample2.csv');
    fireEvent.click(sample2);
    
    expect(defaultProps.onSelectSample).toHaveBeenCalledWith('sample2.csv');
  });

  it('calls onRemoveSample when delete button is clicked', () => {
    customRender(<SampleSidebar {...defaultProps} />);
    
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    
    expect(defaultProps.onRemoveSample).toHaveBeenCalledWith('sample1.csv');
  });

  it('calls onToggleFavorite when favorite button is clicked', () => {
    customRender(<SampleSidebar {...defaultProps} />);
    
    const favoriteButtons = screen.getAllByRole('button', { name: /favorite/i });
    fireEvent.click(favoriteButtons[0]);
    
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('sample1.csv');
  });

  it('displays correct status badges for different scores', () => {
    customRender(<SampleSidebar {...defaultProps} />);
    
    expect(screen.getByText('Good')).toBeInTheDocument(); // 95% score
    expect(screen.getByText('Warning')).toBeInTheDocument(); // 75% score
    expect(screen.getByText('Critical')).toBeInTheDocument(); // 60% score
  });

  it('filters samples by search term', () => {
    customRender(<SampleSidebar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/search samples/i);
    fireEvent.change(searchInput, { target: { value: 'sample1' } });
    
    expect(screen.getByText('sample1.csv')).toBeInTheDocument();
    expect(screen.queryByText('sample2.csv')).not.toBeInTheDocument();
    expect(screen.queryByText('sample3.csv')).not.toBeInTheDocument();
  });

  it('sorts samples by name', () => {
    customRender(<SampleSidebar {...defaultProps} />);
    
    const sortSelect = screen.getByDisplayValue('Recent');
    fireEvent.change(sortSelect, { target: { value: 'name' } });
    
    // Should sort alphabetically
    const sampleElements = screen.getAllByText(/sample\d\.csv/);
    expect(sampleElements[0]).toHaveTextContent('sample1.csv');
    expect(sampleElements[1]).toHaveTextContent('sample2.csv');
    expect(sampleElements[2]).toHaveTextContent('sample3.csv');
  });

  it('sorts samples by score', () => {
    customRender(<SampleSidebar {...defaultProps} />);
    
    const sortSelect = screen.getByDisplayValue('Recent');
    fireEvent.change(sortSelect, { target: { value: 'score' } });
    
    // Should sort by score (highest first)
    const scoreElements = screen.getAllByText(/\d+%/);
    expect(scoreElements[0]).toHaveTextContent('95%');
    expect(scoreElements[1]).toHaveTextContent('75%');
    expect(scoreElements[2]).toHaveTextContent('60%');
  });

  it('filters to show only favorite samples', () => {
    customRender(<SampleSidebar {...defaultProps} />);
    
    const favoritesToggle = screen.getByRole('checkbox', { name: /favorites only/i });
    fireEvent.click(favoritesToggle);
    
    expect(screen.getByText('sample2.csv')).toBeInTheDocument(); // Is favorite
    expect(screen.queryByText('sample1.csv')).not.toBeInTheDocument();
    expect(screen.queryByText('sample3.csv')).not.toBeInTheDocument();
  });

  it('shows favorite icons correctly', () => {
    customRender(<SampleSidebar {...defaultProps} />);
    
    // sample2 is favorite, should show filled heart
    // sample1 and sample3 are not favorites, should show outline heart
    const favoriteButtons = screen.getAllByRole('button', { name: /favorite/i });
    
    // Check that favorite buttons exist (detailed icon testing depends on implementation)
    expect(favoriteButtons).toHaveLength(3);
  });

  it('filters by status when statusFilter prop is provided', () => {
    const propsWithFilter = {
      ...defaultProps,
      statusFilter: 'good' as const
    };
    
    customRender(<SampleSidebar {...propsWithFilter} />);
    
    expect(screen.getByText('sample1.csv')).toBeInTheDocument(); // Good status (95%)
    expect(screen.queryByText('sample2.csv')).not.toBeInTheDocument(); // Warning status
    expect(screen.queryByText('sample3.csv')).not.toBeInTheDocument(); // Critical status
  });

  it('handles empty samples list', () => {
    const emptyProps = {
      ...defaultProps,
      samples: []
    };
    
    customRender(<SampleSidebar {...emptyProps} />);
    
    expect(screen.getByText(/no samples/i)).toBeInTheDocument();
  });

  it('shows sample count', () => {
    customRender(<SampleSidebar {...defaultProps} />);
    
    expect(screen.getByText('3 samples')).toBeInTheDocument();
  });

  it('handles samples without scores', () => {
    const samplesWithoutScores = [
      {
        filename: 'no-score.csv',
        isFavorite: false,
        x: [4000, 3999],
        y: [0.1, 0.12]
      }
    ];
    
    const propsWithoutScores = {
      ...defaultProps,
      samples: samplesWithoutScores
    };
    
    customRender(<SampleSidebar {...propsWithoutScores} />);
    
    expect(screen.getByText('no-score.csv')).toBeInTheDocument();
    expect(screen.getByText('--')).toBeInTheDocument(); // No score placeholder
  });

  it('is accessible', () => {
    customRender(<SampleSidebar {...defaultProps} />);
    
    // Check that all interactive elements are accessible
    const searchInput = screen.getByPlaceholderText(/search samples/i);
    expect(searchInput).toHaveAttribute('aria-label');
    
    const sortSelect = screen.getByDisplayValue('Recent');
    expect(sortSelect).toHaveAttribute('aria-label');
    
    // Check that sample items have proper roles and labels
    const sampleItems = screen.getAllByRole('button').filter((btn: HTMLElement) => 
      btn.textContent?.includes('.csv')
    );
    sampleItems.forEach((item: HTMLElement) => {
      expect(item).toHaveAttribute('aria-label');
    });
  });

  it('updates selection when selectedSampleName prop changes', () => {
    const { rerender } = customRender(<SampleSidebar {...defaultProps} />);
    
    // Initially sample1 is selected
    expect(screen.getByText('sample1.csv').closest('div')).toHaveClass('bg-blue-50');
    
    // Change selection to sample2
    const newProps = {
      ...defaultProps,
      selectedSampleName: 'sample2.csv'
    };
    
    rerender(<SampleSidebar {...newProps} />);
    expect(screen.getByText('sample2.csv').closest('div')).toHaveClass('bg-blue-50');
  });
});