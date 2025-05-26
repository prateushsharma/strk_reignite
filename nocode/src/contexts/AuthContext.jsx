// src/contexts/AuthContext.jsx - Updated for Starknet wallet integration
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useStarknet } from './StarknetContext';
import { generateUid, storeUid, getStoredUid, clearUid } from '../services/authService';

// Create the context
const AuthContext = createContext(null);

// Provider component
export const AuthProvider = ({ children }) => {
  const { address, isConnected } = useStarknet();
  const [uid, setUid] = useState(getStoredUid());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUid = async () => {
      // If wallet disconnects, clear the UID
      if (!isConnected || !address) {
        clearUid();
        setUid(null);
        return;
      }
      
      // Only fetch UID if wallet is connected and we don't have a UID yet
      if (isConnected && address && !uid) {
        setIsLoading(true);
        setError(null);
        
        try {
          const result = await generateUid(address);
          
          if (result.status === 'success' && result.uid) {
            setUid(result.uid);
            storeUid(result.uid);
          } else {
            setError(result.message || 'Failed to generate UID');
          }
        } catch (err) {
          setError('Failed to connect to authentication service');
          console.error('Error fetching UID:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUid();
  }, [isConnected, address, uid]);
  
  const value = {
    uid,
    walletAddress: address,
    isAuthenticated: !!uid && !!isConnected,
    isLoading,
    error,
    // Manually refresh UID if needed
    refreshUid: async () => {
      if (address) {
        clearUid();
        setUid(null);
        // The useEffect will trigger and fetch a new UID
      }
    }
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};