import React from 'react';
import RedesignedDashboard from './RedesignedDashboard';

/**
 * Integration test component for the redesigned FTIR dashboard
 * This demonstrates the complete integration of FTIR analysis with the new UI
 */
const IntegrationTest: React.FC = () => {
  const mockUser = {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@lab.com',
    avatarUrl: 'https://via.placeholder.com/40'
  };

  const handleChangePassword = () => {
    console.log('Change password clicked');
  };

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  return (
    <div className="w-full h-screen">
      <RedesignedDashboard
        user={mockUser}
        onChangePasswordClick={handleChangePassword}
        onLogoutClick={handleLogout}
      />
    </div>
  );
};

export default IntegrationTest;