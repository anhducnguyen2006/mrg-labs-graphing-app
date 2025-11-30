import React from 'react';
import { IconButton, useColorMode, Tooltip } from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';

interface ColorModeToggleProps {
  size?: string;
  variant?: string;
}

const ColorModeToggle: React.FC<ColorModeToggleProps> = ({ size = 'md', variant = 'ghost' }) => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Tooltip label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`} placement="bottom">
      <IconButton
        aria-label="Toggle color mode"
        icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
        onClick={toggleColorMode}
        size={size}
        variant={variant}
        colorScheme={colorMode === 'light' ? 'purple' : 'yellow'}
      />
    </Tooltip>
  );
};

export default ColorModeToggle;
