// src/components/WalletHelper.jsx - Updated for Starknet wallet operations
import React from 'react';
import { useStarknet } from '../contexts/StarknetContext';
import { Contract, CallData, uint256 } from 'starknet';

/**
 * WalletHelper - A utility component for common Starknet wallet operations
 * This component provides hooks and utilities for working with Starknet wallets
 * throughout your app.
 */
export const useWalletHelper = () => {
  const { 
    isConnected, 
    account, 
    address, 
    executeTransaction, 
    provider,
    formatAddress 
  } = useStarknet();

  // Get formatted current address
  const getFormattedAddress = () => {
    if (!address) return '';
    return formatAddress(address);
  };

  // Get full address
  const getFullAddress = () => {
    return address || '';
  };

  // Transfer STRK tokens
  const transferSTRK = async (recipient, amount) => {
    if (!isConnected || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      // STRK token contract address on Starknet mainnet
      const STRK_CONTRACT_ADDRESS = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
      
      // Convert amount to uint256 format (STRK has 18 decimals)
      const transferAmount = uint256.bnToUint256(amount * 10**18);
      
      const transferCall = {
        contractAddress: STRK_CONTRACT_ADDRESS,
        entrypoint: 'transfer',
        calldata: CallData.compile([recipient, transferAmount])
      };

      const result = await executeTransaction([transferCall]);
      return result;
    } catch (error) {
      console.error('STRK transfer failed:', error);
      throw error;
    }
  };

  // Get STRK token balance
  const getSTRKBalance = async () => {
    if (!isConnected || !address) {
      return '0';
    }

    try {
      // STRK token contract address
      const STRK_CONTRACT_ADDRESS = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
      
      const contract = new Contract(
        [
          {
            name: 'balanceOf',
            type: 'function',
            inputs: [{ name: 'account', type: 'felt' }],
            outputs: [{ name: 'balance', type: 'Uint256' }],
            stateMutability: 'view'
          }
        ],
        STRK_CONTRACT_ADDRESS,
        provider
      );

      const balance = await contract.balanceOf(address);
      // Convert from wei to STRK (18 decimals)
      const balanceInSTRK = Number(balance.low) / 10**18;
      return balanceInSTRK.toFixed(4);
    } catch (error) {
      console.error('Failed to get STRK balance:', error);
      return '0';
    }
  };

  // Get ETH balance
  const getETHBalance = async () => {
    if (!isConnected || !address) {
      return '0';
    }

    try {
      // ETH contract address on Starknet
      const ETH_CONTRACT_ADDRESS = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      
      const contract = new Contract(
        [
          {
            name: 'balanceOf',
            type: 'function',
            inputs: [{ name: 'account', type: 'felt' }],
            outputs: [{ name: 'balance', type: 'Uint256' }],
            stateMutability: 'view'
          }
        ],
        ETH_CONTRACT_ADDRESS,
        provider
      );

      const balance = await contract.balanceOf(address);
      // Convert from wei to ETH (18 decimals)
      const balanceInETH = Number(balance.low) / 10**18;
      return balanceInETH.toFixed(4);
    } catch (error) {
      console.error('Failed to get ETH balance:', error);
      return '0';
    }
  };

  // Execute a custom contract call
  const executeContractCall = async (contractAddress, entrypoint, calldata = []) => {
    if (!isConnected || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      const call = {
        contractAddress,
        entrypoint,
        calldata: CallData.compile(calldata)
      };

      const result = await executeTransaction([call]);
      return result;
    } catch (error) {
      console.error('Contract call failed:', error);
      throw error;
    }
  };

  // Read from a contract (view function)
  const readFromContract = async (contractAddress, abi, functionName, calldata = []) => {
    try {
      const contract = new Contract(abi, contractAddress, provider);
      const result = await contract[functionName](...calldata);
      return result;
    } catch (error) {
      console.error('Contract read failed:', error);
      throw error;
    }
  };

  return {
    isConnected,
    account,
    address,
    formatAddress,
    getFormattedAddress,
    getFullAddress,
    transferSTRK,
    getSTRKBalance,
    getETHBalance,
    executeContractCall,
    readFromContract,
  };
};

// Display component for wallet info
export const WalletInfo = () => {
  const { isConnected, getFormattedAddress, getSTRKBalance, getETHBalance } = useWalletHelper();
  const [strkBalance, setStrkBalance] = React.useState('0');
  const [ethBalance, setEthBalance] = React.useState('0');

  React.useEffect(() => {
    const fetchBalances = async () => {
      if (isConnected) {
        try {
          const [strk, eth] = await Promise.all([
            getSTRKBalance(),
            getETHBalance()
          ]);
          setStrkBalance(strk);
          setEthBalance(eth);
        } catch (error) {
          console.error('Failed to fetch balances:', error);
        }
      }
    };
    
    fetchBalances();
    
    // Refresh balances every 30 seconds
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [isConnected, getSTRKBalance, getETHBalance]);

  if (!isConnected) {
    return <div className="wallet-info">Wallet not connected</div>;
  }

  return (
    <div className="wallet-info">
      <div className="wallet-address-display">
        Address: {getFormattedAddress()}
      </div>
      <div className="wallet-balance-display">
        <div>STRK Balance: {strkBalance} STRK</div>
        <div>ETH Balance: {ethBalance} ETH</div>
      </div>
    </div>
  );
};

export default useWalletHelper;