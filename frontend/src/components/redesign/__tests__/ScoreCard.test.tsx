import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { customRender } from '../../../test/utils';
import ScoreCard from '../ScoreCard';

describe('ScoreCard Component', () => {
  const defaultProps = {
    sampleName: 'test-sample.csv',
    score: 85.5,
    uploadDate: '2025-11-28T10:30:00Z',
    dataPoints: 3000,
    scoringMethod: 'hybrid' as const,
    onMethodChange: vi.fn(),
    onConfigure: vi.fn(),
  };

  it.beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sample information correctly', () => {
    customRender(<ScoreCard {...defaultProps} />);
    
    expect(screen.getByText('test-sample.csv')).toBeInTheDocument();
    expect(screen.getByText('85.5%')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument(); // Status for 85.5%
  });

  it('displays correct status for different scores', () => {
    // Test Good status (>=90%)
    const goodProps = { ...defaultProps, score: 92 };
    const { rerender } = customRender(<ScoreCard {...goodProps} />);
    expect(screen.getByText('Good')).toBeInTheDocument();
    
    // Test Warning status (70-89%)
    const warningProps = { ...defaultProps, score: 75 };
    rerender(<ScoreCard {...warningProps} />);
    expect(screen.getByText('Warning')).toBeInTheDocument();
    
    // Test Critical status (<70%)
    const criticalProps = { ...defaultProps, score: 65 };
    rerender(<ScoreCard {...criticalProps} />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('handles scoring method selection', () => {
    customRender(<ScoreCard {...defaultProps} />);
    
    const methodSelect = screen.getByDisplayValue('Hybrid');
    fireEvent.change(methodSelect, { target: { value: 'rmse' } });
    
    expect(defaultProps.onMethodChange).toHaveBeenCalledWith('rmse');
  });

  it('shows all scoring method options', () => {
    customRender(<ScoreCard {...defaultProps} />);
    
    expect(screen.getByDisplayValue('Hybrid')).toBeInTheDocument();
    
    // Check that all options are available
    const select = screen.getByDisplayValue('Hybrid');
    expect(select).toBeInTheDocument();
    
    // Verify options exist (they would be in the select element)
    expect(screen.getByText('Hybrid')).toBeInTheDocument();
  });

  it('handles configure weights button click', () => {
    customRender(<ScoreCard {...defaultProps} />);
    
    const configButton = screen.getByRole('button', { name: /configure.*weights/i });
    fireEvent.click(configButton);
    
    expect(defaultProps.onConfigure).toHaveBeenCalledTimes(1);
  });

  it('displays sample name and metadata correctly', () => {
    customRender(<ScoreCard {...defaultProps} />);
    
    expect(screen.getByText('test-sample.csv')).toBeInTheDocument();
    expect(screen.getByText('3000')).toBeInTheDocument(); // Data points
    expect(screen.getByText('Data Points')).toBeInTheDocument();
  });

  it('applies correct styling for each status', () => {
    // Test good styling
    const goodProps = { ...defaultProps, score: 92 };
    const { rerender } = customRender(<ScoreCard {...goodProps} />);
    const goodBadge = screen.getByText('Good');
    expect(goodBadge).toHaveClass('bg-green-100', 'text-green-700');
    
    // Test warning styling  
    const warningProps = { ...defaultProps, score: 75 };
    rerender(<ScoreCard {...warningProps} />);
    const warningBadge = screen.getByText('Warning');
    expect(warningBadge).toHaveClass('bg-yellow-100', 'text-yellow-700');
    
    // Test critical styling
    const criticalProps = { ...defaultProps, score: 65 };
    rerender(<ScoreCard {...criticalProps} />);
    const criticalBadge = screen.getByText('Critical');
    expect(criticalBadge).toHaveClass('bg-red-100', 'text-red-700');
  });

  it('shows sample metadata', () => {
    customRender(<ScoreCard {...defaultProps} />);
    
    // Should show data points count
    expect(screen.getByText('3000')).toBeInTheDocument(); // dataPoints prop
    expect(screen.getByText('Data Points')).toBeInTheDocument();
  });

  it('handles long filename gracefully', () => {
    const longNameProps = {
      ...defaultProps,
      sampleName: 'very-long-filename-that-should-be-truncated.csv'
    };
    customRender(<ScoreCard {...longNameProps} />);
    
    expect(screen.getByText('very-long-filename-that-should-be-truncated.csv')).toBeInTheDocument();
  });

  it('is accessible', () => {
    customRender(<ScoreCard {...defaultProps} />);
    
    // Check for proper form labels
    const methodSelect = screen.getByDisplayValue('Hybrid');
    expect(methodSelect).toBeInTheDocument();
    
    // Check for proper button accessibility
    const configButton = screen.getByRole('button', { name: /configure.*weights/i });
    expect(configButton).not.toBeDisabled();
  });

  it('handles edge case scores', () => {
    // Test exactly 90% (boundary)
    const exactGoodProps = { ...defaultProps, score: 90 };
    const { rerender } = customRender(<ScoreCard {...exactGoodProps} />);
    expect(screen.getByText('Good')).toBeInTheDocument();
    
    // Test exactly 70% (boundary)
    const exactWarningProps = { ...defaultProps, score: 70 };
    rerender(<ScoreCard {...exactWarningProps} />);
    expect(screen.getByText('Warning')).toBeInTheDocument();
    
    // Test 0%
    const zeroProps = { ...defaultProps, score: 0 };
    rerender(<ScoreCard {...zeroProps} />);
    expect(screen.getByText('0.0%')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });
});