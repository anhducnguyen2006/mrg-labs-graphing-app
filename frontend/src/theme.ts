import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Configure color mode
const config: ThemeConfig = {
  initialColorMode: 'system', // Start with system preference, then localStorage takes over
  useSystemColorMode: false, // Don't continuously sync with system - respect user choice
};

// Define custom colors and semantics
const theme = extendTheme({
  config,
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
        color: props.colorMode === 'dark' ? 'gray.100' : 'gray.800',
      },
    }),
  },
  colors: {
    // You can customize brand colors here if needed
    brand: {
      50: '#e3f2fd',
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#42a5f5',
      500: '#2196f3',
      600: '#1e88e5',
      700: '#1976d2',
      800: '#1565c0',
      900: '#0d47a1',
    },
  },
  components: {
    Button: {
      variants: {
        solid: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'blue.600' : 'blue.500',
          color: 'white',
          _hover: {
            bg: props.colorMode === 'dark' ? 'blue.700' : 'blue.600',
          },
        }),
        ghost: (props: any) => ({
          _hover: {
            bg: props.colorMode === 'dark' ? 'whiteAlpha.200' : 'blackAlpha.100',
          },
        }),
        outline: (props: any) => ({
          borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.300',
          _hover: {
            bg: props.colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50',
          },
        }),
      },
    },
    Input: {
      variants: {
        outline: (props: any) => ({
          field: {
            borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.300',
            bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
            _hover: {
              borderColor: props.colorMode === 'dark' ? 'gray.500' : 'gray.400',
            },
            _focus: {
              borderColor: props.colorMode === 'dark' ? 'blue.400' : 'blue.500',
              boxShadow: props.colorMode === 'dark' 
                ? '0 0 0 1px var(--chakra-colors-blue-400)' 
                : '0 0 0 1px var(--chakra-colors-blue-500)',
            },
          },
        }),
      },
    },
    Modal: {
      baseStyle: (props: any) => ({
        dialog: {
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
        },
      }),
    },
    Menu: {
      baseStyle: (props: any) => ({
        list: {
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
          borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
        },
        item: {
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
          _hover: {
            bg: props.colorMode === 'dark' ? 'gray.700' : 'gray.50',
          },
          _focus: {
            bg: props.colorMode === 'dark' ? 'gray.700' : 'gray.50',
          },
        },
      }),
    },
  },
  semanticTokens: {
    colors: {
      // Semantic color tokens that automatically adapt to color mode
      'bg.canvas': {
        default: 'gray.50',
        _dark: 'gray.900',
      },
      'bg.surface': {
        default: 'white',
        _dark: 'gray.800',
      },
      'bg.subtle': {
        default: 'gray.100',
        _dark: 'gray.700',
      },
      'bg.muted': {
        default: 'gray.200',
        _dark: 'gray.600',
      },
      'border.default': {
        default: 'gray.200',
        _dark: 'gray.700',
      },
      'border.emphasized': {
        default: 'gray.300',
        _dark: 'gray.600',
      },
      'text.default': {
        default: 'gray.800',
        _dark: 'gray.100',
      },
      'text.muted': {
        default: 'gray.600',
        _dark: 'gray.400',
      },
      'text.subtle': {
        default: 'gray.500',
        _dark: 'gray.500',
      },
    },
  },
});

export default theme;
