// src/main.jsx - Updated for Starknet wallet integration
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StarknetProvider } from './contexts/StarknetContext';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <StarknetProvider>
          <App />
        </StarknetProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
} else {
  console.error('Root element not found');
}