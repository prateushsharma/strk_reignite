// src/components/WalletHelper.jsx
import React from 'react';
import { useWalletKit } from '@mysten/dapp-kit';
import { formatAddress } from '@mysten/sui/utils';

/**
 * WalletHelper - A utility component for common SUI wallet operations
 * This component provides hooks and utilities for working with SUI wallets
 * throughout your app.
 */
export const useWalletHelper = () => {
  const { isConnected, currentAccount, signAndExecuteTransaction } = useWalletKit();

  // Format wallet address for display
  const formatWalletAddress = (address) => {
    if (!address) return '';
    return formatAddress(address, { shortLength: 4 }); // e.g. 0x123...abc
  };

  // Get formatted current address
  const getFormattedAddress = () => {
    if (!currentAccount?.address) return '';
    return formatWalletAddress(currentAccount.address);
  };

  // Get full address
  const getFullAddress = () => {
    return currentAccount?.address || '';
  };

  // Perform a simple transaction
  const sendTransaction = async (recipient, amount) => {
    if (!isConnected || !currentAccount) {
      throw new Error('Wallet not connected');
    }

    try {
      // This is a simplified example - in reality, you would create a more complex transaction
      const tx = {
        kind: 'moveCall',
        data: {
          packageObjectId: '0x2', // SUI system package
          module: 'sui_coin',
          function: 'transfer',
          typeArguments: ['0x2::sui::SUI'],
          arguments: [recipient, amount.toString()],
          gasBudget: 10000, // Adjust as needed
        },
      };

      const result = await signAndExecuteTransaction(tx);
      return result;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  };

  // Check wallet balance
  const getBalance = async () => {
    if (!isConnected || !currentAccount) {
      return '0';
    }

    try {
      // This would typically use suiClient.getBalance() 
      // For now, we'll simulate a response
      return '1.23'; // Would be the actual balance in a real implementation
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  };

  return {
    isConnected,
    currentAccount,
    formatWalletAddress,
    getFormattedAddress,
    getFullAddress,
    sendTransaction,
    getBalance,
  };
};

// Display component for wallet info
export const WalletInfo = () => {
  const { isConnected, getFormattedAddress, getBalance } = useWalletHelper();
  const [balance, setBalance] = React.useState('0');

  React.useEffect(() => {
    const fetchBalance = async () => {
      if (isConnected) {
        const bal = await getBalance();
        setBalance(bal);
      }
    };
    
    fetchBalance();
  }, [isConnected, getBalance]);

  if (!isConnected) {
    return <div className="wallet-info">Wallet not connected</div>;
  }

  return (
    <div className="wallet-info">
      <div className="wallet-address-display">
        Address: {getFormattedAddress()}
      </div>
      <div className="wallet-balance-display">
        Balance: {balance} SUI
      </div>
    </div>
  );
};

export default useWalletHelper;