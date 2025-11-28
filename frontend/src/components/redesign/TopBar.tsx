import React, { memo } from 'react';
import StatusPills from './StatusPills';
import UserProfileMenu from '../UserProfileMenu';

interface User {
  name: string;
  email: string;
  avatarUrl?: string;
}

interface TopBarProps {
  good: number;
  warning: number;
  critical: number;
  onStatusClick: (status: 'good' | 'warning' | 'critical') => void;
  onExport: () => void;
  user?: User;
  onChangePasswordClick?: () => void;
  onLogoutClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = memo(({
  good,
  warning,
  critical,
  onStatusClick,
  onExport,
  user,
  onChangePasswordClick,
  onLogoutClick,
}) => {
  return (
    <header className="h-[60px] bg-white border-b-2 border-gray-200 flex items-center justify-between px-6">
      {/* Logo */}
      <div className="w-[180px]">
        <h1 className="text-xl font-bold text-gray-800 flex items-center">
          <span className="mr-2">🧪</span>
          MRG Labs FTIR Analysis
        </h1>
      </div>

      {/* Status Pills - Center */}
      <div className="flex-1 flex justify-center">
        <StatusPills
          good={good}
          warning={warning}
          critical={critical}
          onStatusClick={onStatusClick}
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onExport}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          Export Graphs
        </button>

        {user && (
          <UserProfileMenu
            user={user}
            onChangePasswordClick={onChangePasswordClick}
            onLogoutClick={onLogoutClick}
          />
        )}
      </div>
    </header>
  );
});

TopBar.displayName = 'TopBar';

export default TopBar;