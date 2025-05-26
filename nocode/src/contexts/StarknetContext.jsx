// src/contexts/StarknetContext.jsx - Correct Starknet wallet integration using window.starknet
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Provider, constants } from 'starknet';

const StarknetContext = createContext();

export const useStarknet = () => {
  const context = useContext(StarknetContext);
  if (!context) {
    throw new Error('useStarknet must be used within a StarknetProvider');
  }
  return context;
};

export const StarknetProvider = ({ children }) => {
  const [wallet, setWallet] = useState(null);
  const [account, setAccount] = useState(null);
  const [address, setAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [network, setNetwork] = useState('');
  const [error, setError] = useState(null);
  const [availableWallets, setAvailableWallets] = useState([]);

  // Initialize provider
  const provider = new Provider({ 
    sequencer: { 
      network: constants.NetworkName.SN_MAIN // or SN_GOERLI for testnet
    } 
  });

  // Check for available wallets on mount
  useEffect(() => {
    checkAvailableWallets();
    checkConnection();
  }, []);

  const checkAvailableWallets = () => {
    const wallets = [];
    
    // Check for Argent
    if (window.starknet_argentX) {
      wallets.push({ id: 'argentX', name: 'Argent X', wallet: window.starknet_argentX });
    }
    
    // Check for Braavos
    if (window.starknet_braavos) {
      wallets.push({ id: 'braavos', name: 'Braavos', wallet: window.starknet_braavos });
    }
    
    // Check for generic starknet
    if (window.starknet) {
      wallets.push({ id: 'starknet', name: 'Starknet Wallet', wallet: window.starknet });
    }
    
    setAvailableWallets(wallets);
  };

  const checkConnection = async () => {
    try {
      // Check if any wallet is already connected
      if (window.starknet?.isConnected) {
        const walletInstance = window.starknet;
        setWallet(walletInstance);
        setAccount(walletInstance.account);
        setAddress(walletInstance.selectedAddress || walletInstance.account?.address);
        setIsConnected(true);
        setNetwork(walletInstance.chainId);
      }
    } catch (err) {
      console.log('No wallet connected on startup');
    }
  };

  const connectWallet = async (walletId = null) => {
    try {
      setIsConnecting(true);
      setError(null);

      let walletInstance = null;

      // Select wallet based on walletId or use the first available
      if (walletId === 'argentX' && window.starknet_argentX) {
        walletInstance = window.starknet_argentX;
      } else if (walletId === 'braavos' && window.starknet_braavos) {
        walletInstance = window.starknet_braavos;
      } else if (window.starknet) {
        walletInstance = window.starknet;
      } else {
        throw new Error('No Starknet wallet found. Please install Argent X or Braavos wallet.');
      }

      // Request connection
      await walletInstance.enable();
      
      if (walletInstance.isConnected) {
        setWallet(walletInstance);
        setAccount(walletInstance.account);
        setAddress(walletInstance.selectedAddress || walletInstance.account?.address);
        setIsConnected(true);
        setNetwork(walletInstance.chainId);
        
        console.log('Connected to wallet:', {
          id: walletInstance.id || walletId,
          name: walletInstance.name || 'Unknown',
          address: walletInstance.selectedAddress || walletInstance.account?.address,
          chainId: walletInstance.chainId
        });
      } else {
        throw new Error('Failed to connect wallet');
      }
    } catch (err) {
      console.error('Wallet connection failed:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (wallet && wallet.disable) {
        await wallet.disable();
      }
      setWallet(null);
      setAccount(null);
      setAddress('');
      setIsConnected(false);
      setNetwork('');
      setError(null);
    } catch (err) {
      console.error('Disconnect failed:', err);
      // Reset state even if disconnect fails
      setWallet(null);
      setAccount(null);
      setAddress('');
      setIsConnected(false);
      setNetwork('');
      setError(null);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getNetworkName = () => {
    if (!network) return 'Unknown';
    
    // Convert hex chainId to readable name
    switch (network) {
      case '0x534e5f4d41494e': // SN_MAIN
      case constants.StarknetChainId.SN_MAIN:
        return 'Mainnet';
      case '0x534e5f474f45524c49': // SN_GOERLI
      case constants.StarknetChainId.SN_GOERLI:
        return 'Goerli';
      case '0x534e5f5345504f4c4941': // SN_SEPOLIA
      case constants.StarknetChainId.SN_SEPOLIA:
        return 'Sepolia';
      default:
        return 'Unknown';
    }
  };

  // Sign a message
  const signMessage = async (message) => {
    if (!wallet || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await wallet.account.signMessage(message);
      return signature;
    } catch (err) {
      console.error('Message signing failed:', err);
      throw err;
    }
  };

  // Execute a transaction
  const executeTransaction = async (calls) => {
    if (!wallet || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      const result = await wallet.account.execute(calls);
      return result;
    } catch (err) {
      console.error('Transaction execution failed:', err);
      throw err;
    }
  };

  // Get wallet balance
  const getBalance = async () => {
    if (!wallet || !address) {
      return '0';
    }

    try {
      // This would typically call a contract to get balance
      // For now, return a placeholder
      return '0.0';
    } catch (err) {
      console.error('Failed to get balance:', err);
      return '0';
    }
  };

  const value = {
    // Wallet state
    wallet,
    account,
    address,
    isConnected,
    isConnecting,
    network,
    error,
    provider,
    availableWallets,
    
    // Wallet actions
    connectWallet,
    disconnectWallet,
    signMessage,
    executeTransaction,
    getBalance,
    
    // Utility functions
    formatAddress,
    getNetworkName,
    
    // Specific wallet connections
    connectArgent: () => connectWallet('argentX'),
    connectBraavos: () => connectWallet('braavos'),
  };

  return (
    <StarknetContext.Provider value={value}>
      {children}
    </StarknetContext.Provider>
  );
};