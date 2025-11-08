import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import './index.css';
import Dashboard from './pages/Dashboard';

const App: React.FC = () => {
  return (
    <ChakraProvider>
      <Dashboard />
    </ChakraProvider>
  );
};

export default App;

import ReactDOM from 'react-dom/client';
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
