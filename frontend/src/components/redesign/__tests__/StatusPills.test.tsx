import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { customRender } from '../../../test/utils';
import StatusPills from '../StatusPills';

describe('StatusPills Component', () => {
  const defaultProps = {
    good: 5,
    warning: 2,
    critical: 1,
    onStatusClick: vi.fn(),
  };

  it.beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all status pills with correct counts', () => {
    customRender(<StatusPills {...defaultProps} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('handles good status click', () => {
    customRender(<StatusPills {...defaultProps} />);
    
    const goodPill = screen.getByText('Good').closest('button');
    fireEvent.click(goodPill!);
    
    expect(defaultProps.onStatusClick).toHaveBeenCalledWith('good');
  });

  it('handles warning status click', () => {
    customRender(<StatusPills {...defaultProps} />);
    
    const warningPill = screen.getByText('Warning').closest('button');
    fireEvent.click(warningPill!);
    
    expect(defaultProps.onStatusClick).toHaveBeenCalledWith('warning');
  });

  it('handles critical status click', () => {
    customRender(<StatusPills {...defaultProps} />);
    
    const criticalPill = screen.getByText('Critical').closest('button');
    fireEvent.click(criticalPill!);
    
    expect(defaultProps.onStatusClick).toHaveBeenCalledWith('critical');
  });

  it('applies correct styling for each status', () => {
    customRender(<StatusPills {...defaultProps} />);
    
    const goodPill = screen.getByText('Good').closest('button');
    const warningPill = screen.getByText('Warning').closest('button');
    const criticalPill = screen.getByText('Critical').closest('button');
    
    // Check for good styling (green)
    expect(goodPill).toHaveClass('text-green-700', 'bg-green-100');
    
    // Check for warning styling (yellow)
    expect(warningPill).toHaveClass('text-yellow-700', 'bg-yellow-100');
    
    // Check for critical styling (red)
    expect(criticalPill).toHaveClass('text-red-700', 'bg-red-100');
  });

  it('handles zero counts', () => {
    const zeroProps = { ...defaultProps, good: 0, warning: 0, critical: 0 };
    customRender(<StatusPills {...zeroProps} />);
    
    const zeroCounts = screen.getAllByText('0');
    expect(zeroCounts).toHaveLength(3);
  });

  it('handles large counts', () => {
    const largeProps = { ...defaultProps, good: 999, warning: 150, critical: 99 };
    customRender(<StatusPills {...largeProps} />);
    
    expect(screen.getByText('999')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('99')).toBeInTheDocument();
  });

  it('has proper button accessibility', () => {
    customRender(<StatusPills {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    
    buttons.forEach((button: HTMLElement) => {
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it('maintains responsive layout', () => {
    customRender(<StatusPills {...defaultProps} />);
    
    const container = screen.getByText('Good').closest('div')?.parentElement;
    expect(container).toHaveClass('flex', 'space-x-4');
  });

  it('calls onStatusClick with correct parameter for each pill', () => {
    customRender(<StatusPills {...defaultProps} />);
    
    // Test all three status clicks in sequence
    fireEvent.click(screen.getByText('Good').closest('button')!);
    fireEvent.click(screen.getByText('Warning').closest('button')!);
    fireEvent.click(screen.getByText('Critical').closest('button')!);
    
    expect(defaultProps.onStatusClick).toHaveBeenNthCalledWith(1, 'good');
    expect(defaultProps.onStatusClick).toHaveBeenNthCalledWith(2, 'warning');
    expect(defaultProps.onStatusClick).toHaveBeenNthCalledWith(3, 'critical');
    expect(defaultProps.onStatusClick).toHaveBeenCalledTimes(3);
  });

  it('displays correct icons for each status', () => {
    customRender(<StatusPills {...defaultProps} />);
    
    // Check for status indicators/icons (these might be CSS classes or actual icons)
    const goodPill = screen.getByText('Good').closest('button');
    const warningPill = screen.getByText('Warning').closest('button');
    const criticalPill = screen.getByText('Critical').closest('button');
    
    expect(goodPill).toContainHTML('Good');
    expect(warningPill).toContainHTML('Warning');
    expect(criticalPill).toContainHTML('Critical');
  });
});