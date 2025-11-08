/**
 * User Profile Menu - Usage Examples
 * 
 * This file demonstrates various ways to use the UserProfileMenu component
 */

import React from 'react';
import UserProfileMenu from './UserProfileMenu';
import { User } from '../types';

// ============================================
// EXAMPLE 1: Basic Usage with Mock Data
// ============================================

export const BasicExample = () => {
  const user: User = {
    name: 'John Doe',
    email: 'john@example.com',
  };

  return (
    <UserProfileMenu
      user={user}
      onChangePasswordClick={() => console.log('Change password')}
      onLogoutClick={() => console.log('Perform logout')}
    />
  );
};

// ============================================
// EXAMPLE 2: With Custom Avatar Image
// ============================================

export const WithAvatarExample = () => {
  const user: User = {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
  };

  return (
    <UserProfileMenu
      user={user}
      onChangePasswordClick={() => console.log('Change password clicked')}
      onLogoutClick={() => console.log('Logout clicked')}
    />
  );
};

// ============================================
// EXAMPLE 3: With Router Navigation
// ============================================

export const WithRouterExample = () => {
  // Assuming you're using React Router
  // import { useNavigate } from 'react-router-dom';
  // const navigate = useNavigate();

  const user: User = {
    name: 'Alex Johnson',
    email: 'alex.j@example.com',
    avatarUrl: undefined,
  };

  const handleChangePasswordClick = () => {
    // navigate('/change-password');
    console.log('Navigate to /change-password');
  };

  const handleLogoutClick = () => {
    // Perform logout logic
    // authService.logout();
    // navigate('/login');
    console.log('Logout and redirect to /login');
  };

  return (
    <UserProfileMenu
      user={user}
      onChangePasswordClick={handleChangePasswordClick}
      onLogoutClick={handleLogoutClick}
    />
  );
};

// ============================================
// EXAMPLE 4: With Authentication Context
// ============================================

export const WithAuthContextExample = () => {
  // Assuming you have an auth context
  // import { useAuth } from '../contexts/AuthContext';
  // const { user, logout } = useAuth();

  // Mock user from auth context
  const user: User = {
    name: 'Sarah Connor',
    email: 'sarah.connor@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
  };

  const handleLogout = async () => {
    try {
      // await logout();
      // toast.success('Logged out successfully');
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <UserProfileMenu
      user={user}
      onChangePasswordClick={() => console.log('Change password')}
      onLogoutClick={handleLogout}
    />
  );
};

// ============================================
// EXAMPLE 5: Complete Navbar Integration
// ============================================

export const CompleteNavbarExample = () => {
  const user: User = {
    name: 'Michael Scott',
    email: 'michael@dundermifflin.com',
  };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      backgroundColor: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
        My Dashboard
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button style={{ padding: '0.5rem 1rem' }}>
          Export
        </button>
        <UserProfileMenu
          user={user}
          onChangePasswordClick={() => console.log('Change Password')}
          onLogoutClick={() => console.log('Logout')}
        />
      </div>
    </nav>
  );
};

// ============================================
// EXAMPLE 6: With TypeScript Strict Types
// ============================================

interface ProfileMenuHandlers {
  onChangePasswordClick: () => void | Promise<void>;
  onLogoutClick: () => void | Promise<void>;
}

export const TypedExample = () => {
  const user: User = {
    name: 'Emma Watson',
    email: 'emma.watson@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?img=10',
  };

  const handlers: ProfileMenuHandlers = {
    onChangePasswordClick: async () => {
      console.log('Opening change password dialog...');
      // await openChangePasswordDialog();
    },
    onLogoutClick: async () => {
      console.log('Logging out...');
      // await performLogout();
    },
  };

  return (
    <UserProfileMenu
      user={user}
      {...handlers}
    />
  );
};

// ============================================
// EXAMPLE 7: Responsive Example with Notes
// ============================================

export const ResponsiveExample = () => {
  const user: User = {
    name: 'Chris Evans',
    email: 'chris.evans@avengers.com',
  };

  return (
    <div>
      <h3>Profile Menu - Responsive Behavior:</h3>
      <ul>
        <li>Mobile (&lt; 768px): Avatar only, clickable</li>
        <li>Tablet (768px+): Avatar visible with menu</li>
        <li>Desktop (1024px+): Full layout with smooth animations</li>
      </ul>

      <UserProfileMenu
        user={user}
        onChangePasswordClick={() => console.log('Change Password')}
        onLogoutClick={() => console.log('Logout')}
      />
    </div>
  );
};

// ============================================
// EXAMPLE 8: Default Behavior (No Props)
// ============================================

export const DefaultExample = () => {
  // Uses default mock data: John Doe, john@example.com
  return <UserProfileMenu />;
};

export default {
  BasicExample,
  WithAvatarExample,
  WithRouterExample,
  WithAuthContextExample,
  CompleteNavbarExample,
  TypedExample,
  ResponsiveExample,
  DefaultExample,
};
