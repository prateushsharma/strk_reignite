import React from 'react';
import ReactDOM from 'react-dom/client';
import '@mysten/dapp-kit/dist/index.css';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

const queryClient = new QueryClient();
const networks = {
  devnet: { url: getFullnodeUrl('devnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
};

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networks} defaultNetwork="devnet">
          <WalletProvider>
            <App />
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
} else {
  console.error('Root element not found');
}