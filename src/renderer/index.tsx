import { ChakraProvider } from '@chakra-ui/react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
  // <React.StrictMode>
  // offにしないと、useEffectが2回呼ばれる
  <ChakraProvider>
    <App />
  </ChakraProvider>
  // </React.StrictMode>
);
