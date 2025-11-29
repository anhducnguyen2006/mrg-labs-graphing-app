import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { customRender, mockUser } from '../../../test/utils';
import TopBar from '../../../components/samples/TopBar';

describe('TopBar Component', () => {
  const defaultProps = {
    good: 5,
    warning: 2,
    critical: 1,
    onStatusClick: vi.fn(),
    onExport: vi.fn(),
    user: mockUser,
    onChangePasswordClick: vi.fn(),
    onLogoutClick: vi.fn(),
  };

  it.beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with all elements', () => {
    customRender(<TopBar {...defaultProps} />);
    
    expect(screen.getByText('FTIR Analysis Dashboard')).toBeInTheDocument();
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('displays correct status counts', () => {
    customRender(<TopBar {...defaultProps} />);
    
    expect(screen.getByText('5')).toBeInTheDocument(); // good count
    expect(screen.getByText('2')).toBeInTheDocument(); // warning count  
    expect(screen.getByText('1')).toBeInTheDocument(); // critical count
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('handles status pill clicks', () => {
    customRender(<TopBar {...defaultProps} />);
    
    const goodPill = screen.getByText('Good').closest('button');
    const warningPill = screen.getByText('Warning').closest('button');
    const criticalPill = screen.getByText('Critical').closest('button');
    
    fireEvent.click(goodPill!);
    expect(defaultProps.onStatusClick).toHaveBeenCalledWith('good');
    
    fireEvent.click(warningPill!);
    expect(defaultProps.onStatusClick).toHaveBeenCalledWith('warning');
    
    fireEvent.click(criticalPill!);
    expect(defaultProps.onStatusClick).toHaveBeenCalledWith('critical');
  });

  it('handles export button click', () => {
    customRender(<TopBar {...defaultProps} />);
    
    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);
    
    expect(defaultProps.onExport).toHaveBeenCalledTimes(1);
  });

  it('handles user menu interactions', () => {
    customRender(<TopBar {...defaultProps} />);
    
    // Click on user profile to open menu
    const userButton = screen.getByText(mockUser.name).closest('button');
    fireEvent.click(userButton!);
    
    // Check if menu items appear
    expect(screen.getByText('Change Password')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    
    // Test change password click
    fireEvent.click(screen.getByText('Change Password'));
    expect(defaultProps.onChangePasswordClick).toHaveBeenCalledTimes(1);
    
    // Reopen menu and test logout
    fireEvent.click(userButton!);
    fireEvent.click(screen.getByText('Logout'));
    expect(defaultProps.onLogoutClick).toHaveBeenCalledTimes(1);
  });

  it('shows user avatar when provided', () => {
    customRender(<TopBar {...defaultProps} />);
    
    const avatar = screen.getByAltText(mockUser.name);
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', mockUser.avatarUrl);
  });

  it('handles user without avatar', () => {
    const userWithoutAvatar = { ...mockUser, avatarUrl: undefined };
    customRender(<TopBar {...defaultProps} user={userWithoutAvatar} />);
    
    // Should show initials instead of avatar
    expect(screen.getByText('DJ')).toBeInTheDocument(); // Dr. Sarah Johnson -> DJ
  });

  it('renders without user', () => {
    const propsWithoutUser = { ...defaultProps, user: undefined };
    customRender(<TopBar {...propsWithoutUser} />);
    
    expect(screen.getByText('FTIR Analysis Dashboard')).toBeInTheDocument();
    // Should not crash and should not show user menu
    expect(screen.queryByText('Change Password')).not.toBeInTheDocument();
  });

  it('applies correct styling for status pills', () => {
    customRender(<TopBar {...defaultProps} />);
    
    const goodPill = screen.getByText('Good').closest('button');
    const warningPill = screen.getByText('Warning').closest('button');
    const criticalPill = screen.getByText('Critical').closest('button');
    
    expect(goodPill).toHaveClass('text-green-700', 'bg-green-100');
    expect(warningPill).toHaveClass('text-yellow-700', 'bg-yellow-100');
    expect(criticalPill).toHaveClass('text-red-700', 'bg-red-100');
  });

  it('handles zero counts gracefully', () => {
    const zeroProps = { ...defaultProps, good: 0, warning: 0, critical: 0 };
    customRender(<TopBar {...zeroProps} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(3);
  });

  it('handles large counts', () => {
    const largeProps = { ...defaultProps, good: 999, warning: 150, critical: 99 };
    customRender(<TopBar {...largeProps} />);
    
    expect(screen.getByText('999')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('99')).toBeInTheDocument();
  });

  it('is accessible', () => {
    customRender(<TopBar {...defaultProps} />);
    
    // Check for proper ARIA attributes
    const exportButton = screen.getByRole('button', { name: /export/i });
    expect(exportButton).toBeInTheDocument();
    
    const statusPills = screen.getAllByRole('button');
    statusPills.forEach(pill => {
      expect(pill).toBeInTheDocument();
    });
  });
});