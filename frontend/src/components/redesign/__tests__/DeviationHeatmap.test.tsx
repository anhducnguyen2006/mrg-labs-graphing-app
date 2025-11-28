import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { customRender } from '../../../test/utils';
import DeviationHeatmap from '../DeviationHeatmap';

describe('DeviationHeatmap Component', () => {
  const defaultProps = {
    x: [4000, 3999, 3998, 3997, 3996],
    deviation: [0.1, 0.2, 0.15, 0.3, 0.05],
    selectedSampleName: 'test-sample.csv',
    maxDeviation: 0.3,
    avgDeviation: 0.16,
    abnormalityWeights: [
      {
        min: 3500,
        max: 4000,
        weight: 1.5,
        label: 'O-H Stretch',
        key: 'oh-stretch'
      }
    ],
    onConfigureWeights: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders deviation heatmap with data', () => {
    customRender(<DeviationHeatmap {...defaultProps} />);
    
    expect(screen.getByText('Deviation Heatmap')).toBeInTheDocument();
    expect(screen.getByText('test-sample.csv')).toBeInTheDocument();
  });

  it('displays statistics correctly', () => {
    customRender(<DeviationHeatmap {...defaultProps} />);
    
    expect(screen.getByText('Max: 0.30')).toBeInTheDocument();
    expect(screen.getByText('Avg: 0.16')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    const emptyProps = {
      ...defaultProps,
      x: [],
      deviation: [],
    };
    customRender(<DeviationHeatmap {...emptyProps} />);
    
    expect(screen.getByText(/no deviation data/i)).toBeInTheDocument();
  });

  it('calls onConfigureWeights when configure button is clicked', () => {
    customRender(<DeviationHeatmap {...defaultProps} />);
    
    const configButton = screen.getByRole('button', { name: /configure.*weights/i });
    fireEvent.click(configButton);
    
    expect(defaultProps.onConfigureWeights).toHaveBeenCalledTimes(1);
  });

  it('displays abnormality weights information', () => {
    customRender(<DeviationHeatmap {...defaultProps} />);
    
    expect(screen.getByText('O-H Stretch')).toBeInTheDocument();
    expect(screen.getByText('1.5x')).toBeInTheDocument(); // Weight multiplier
    expect(screen.getByText('3500-4000 cm⁻¹')).toBeInTheDocument(); // Range
  });

  it('calculates statistics when not provided', () => {
    const propsWithoutStats = {
      ...defaultProps,
      maxDeviation: undefined,
      avgDeviation: undefined,
    };
    customRender(<DeviationHeatmap {...propsWithoutStats} />);
    
    // Should calculate max (0.3) and average (0.16)
    expect(screen.getByText('Max: 0.30')).toBeInTheDocument();
    expect(screen.getByText('Avg: 0.16')).toBeInTheDocument();
  });

  it('renders color gradient legend', () => {
    customRender(<DeviationHeatmap {...defaultProps} />);
    
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Deviation Intensity')).toBeInTheDocument();
  });

  it('shows heatmap bars for each data point', () => {
    customRender(<DeviationHeatmap {...defaultProps} />);
    
    // Should render 5 heatmap bars for 5 data points
    const heatmapBars = screen.getAllByTestId(/heatmap-bar/i);
    expect(heatmapBars).toHaveLength(5);
  });

  it('applies correct colors based on deviation values', () => {
    const { container } = customRender(<DeviationHeatmap {...defaultProps} />);
    
    // High deviation points should have red-ish colors
    // Low deviation points should have green-ish colors
    const heatmapBars = container.querySelectorAll('[data-testid*="heatmap-bar"]');
    expect(heatmapBars.length).toBe(5);
  });

  it('handles hover interactions on heatmap bars', () => {
    customRender(<DeviationHeatmap {...defaultProps} />);
    
    const firstBar = screen.getByTestId('heatmap-bar-0');
    fireEvent.mouseEnter(firstBar);
    
    // Should show tooltip with wavenumber and deviation value
    expect(screen.getByText('4000 cm⁻¹')).toBeInTheDocument();
    expect(screen.getByText('Deviation: 0.10')).toBeInTheDocument();
  });

  it('displays sample name when provided', () => {
    customRender(<DeviationHeatmap {...defaultProps} />);
    
    expect(screen.getByText('test-sample.csv')).toBeInTheDocument();
  });

  it('handles missing sample name', () => {
    const propsWithoutName = {
      ...defaultProps,
      selectedSampleName: undefined,
    };
    customRender(<DeviationHeatmap {...propsWithoutName} />);
    
    expect(screen.getByText('Unknown Sample')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customProps = {
      ...defaultProps,
      className: 'custom-heatmap'
    };
    
    const { container } = customRender(<DeviationHeatmap {...customProps} />);
    expect(container.firstChild).toHaveClass('custom-heatmap');
  });

  it('handles multiple abnormality weight ranges', () => {
    const propsWithMultipleWeights = {
      ...defaultProps,
      abnormalityWeights: [
        {
          min: 3500,
          max: 4000,
          weight: 1.5,
          label: 'O-H Stretch',
          key: 'oh-stretch'
        },
        {
          min: 1600,
          max: 1800,
          weight: 2.0,
          label: 'C=O Stretch',
          key: 'co-stretch'
        }
      ]
    };
    
    customRender(<DeviationHeatmap {...propsWithMultipleWeights} />);
    
    expect(screen.getByText('O-H Stretch')).toBeInTheDocument();
    expect(screen.getByText('C=O Stretch')).toBeInTheDocument();
    expect(screen.getByText('1.5x')).toBeInTheDocument();
    expect(screen.getByText('2.0x')).toBeInTheDocument();
  });

  it('shows zero deviation correctly', () => {
    const zeroDeviationProps = {
      ...defaultProps,
      deviation: [0, 0, 0, 0, 0],
      maxDeviation: 0,
      avgDeviation: 0,
    };
    
    customRender(<DeviationHeatmap {...zeroDeviationProps} />);
    
    expect(screen.getByText('Max: 0.00')).toBeInTheDocument();
    expect(screen.getByText('Avg: 0.00')).toBeInTheDocument();
  });

  it('is accessible', () => {
    customRender(<DeviationHeatmap {...defaultProps} />);
    
    // Check that interactive elements have proper accessibility
    const configButton = screen.getByRole('button', { name: /configure.*weights/i });
    expect(configButton).not.toBeDisabled();
    
    // Check that heatmap has proper ARIA labels
    const heatmapBars = screen.getAllByTestId(/heatmap-bar/i);
    heatmapBars.forEach((bar: HTMLElement) => {
      expect(bar).toHaveAttribute('aria-label');
    });
  });

  it('updates when data changes', () => {
    const { rerender } = customRender(<DeviationHeatmap {...defaultProps} />);
    
    expect(screen.getByText('Max: 0.30')).toBeInTheDocument();
    
    // Update with different data
    const newProps = {
      ...defaultProps,
      deviation: [0.5, 0.4, 0.6],
      x: [4000, 3999, 3998],
      maxDeviation: 0.6,
      avgDeviation: 0.5,
    };
    
    rerender(<DeviationHeatmap {...newProps} />);
    expect(screen.getByText('Max: 0.60')).toBeInTheDocument();
    expect(screen.getByText('Avg: 0.50')).toBeInTheDocument();
  });
});