// StatusPills comprehensive test suite
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatusPills from '../../../components/ftir/StatusPills';

describe('StatusPills', () => {
  const defaultProps = {
    good: 5,
    warning: 3,
    critical: 2,
    onStatusClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all status pills with correct counts', () => {
      render(<StatusPills {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /5 good samples/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /3 warning samples/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /2 critical samples/i })).toBeInTheDocument();
    });

    it('displays zero counts correctly', () => {
      render(<StatusPills {...defaultProps} good={0} warning={0} critical={0} />);
      
      expect(screen.getByText('🟢 0 Good')).toBeInTheDocument();
      expect(screen.getByText('🟡 0 Warning')).toBeInTheDocument();
      expect(screen.getByText('🔴 0 Critical')).toBeInTheDocument();
    });

    it('applies pulse animation when critical count > 0', () => {
      render(<StatusPills {...defaultProps} critical={1} />);
      
      const criticalPill = screen.getByRole('button', { name: /1 critical/i });
      expect(criticalPill).toHaveClass('animate-pulse');
    });

    it('does not apply pulse animation when critical count is 0', () => {
      render(<StatusPills {...defaultProps} critical={0} />);
      
      const criticalPill = screen.getByRole('button', { name: /0 critical/i });
      expect(criticalPill).not.toHaveClass('animate-pulse');
    });
  });

  describe('Interactions', () => {
    it('calls onStatusClick with correct status when good pill clicked', () => {
      render(<StatusPills {...defaultProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /good/i }));
      expect(defaultProps.onStatusClick).toHaveBeenCalledWith('good');
    });

    it('calls onStatusClick with correct status when warning pill clicked', () => {
      render(<StatusPills {...defaultProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /warning/i }));
      expect(defaultProps.onStatusClick).toHaveBeenCalledWith('warning');
    });

    it('calls onStatusClick with correct status when critical pill clicked', () => {
      render(<StatusPills {...defaultProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /critical/i }));
      expect(defaultProps.onStatusClick).toHaveBeenCalledWith('critical');
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for screen readers', () => {
      render(<StatusPills {...defaultProps} />);
      
      expect(screen.getByLabelText('5 good samples, click to filter')).toBeInTheDocument();
      expect(screen.getByLabelText('3 warning samples, click to filter')).toBeInTheDocument();
      expect(screen.getByLabelText('2 critical samples, click to filter')).toBeInTheDocument();
    });

    it('maintains keyboard accessibility', () => {
      render(<StatusPills {...defaultProps} />);
      
      const goodPill = screen.getByRole('button', { name: /good/i });
      goodPill.focus();
      expect(goodPill).toHaveFocus();
      
      fireEvent.keyDown(goodPill, { key: 'Enter' });
      expect(defaultProps.onStatusClick).toHaveBeenCalledWith('good');
    });
  });

  describe('Edge Cases', () => {
    it('handles very large numbers', () => {
      render(<StatusPills {...defaultProps} good={999999} warning={1000000} critical={5000000} />);
      
      expect(screen.getByText('🟢 999999 Good')).toBeInTheDocument();
      expect(screen.getByText('🟡 1000000 Warning')).toBeInTheDocument();
      expect(screen.getByText('🔴 5000000 Critical')).toBeInTheDocument();
    });

    it('handles negative numbers gracefully', () => {
      render(<StatusPills {...defaultProps} good={-1} warning={-5} critical={-10} />);
      
      expect(screen.getByText('🟢 -1 Good')).toBeInTheDocument();
      expect(screen.getByText('🟡 -5 Warning')).toBeInTheDocument();
      expect(screen.getByText('🔴 -10 Critical')).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('does not re-render when props are the same', () => {
      const { rerender } = render(<StatusPills {...defaultProps} />);
      const initialGoodButton = screen.getByRole('button', { name: /good/i });
      
      rerender(<StatusPills {...defaultProps} />);
      const rerenderGoodButton = screen.getByRole('button', { name: /good/i });
      
      expect(initialGoodButton).toBe(rerenderGoodButton);
    });
  });
});