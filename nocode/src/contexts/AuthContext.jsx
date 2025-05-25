// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { generateUid, storeUid, getStoredUid, clearUid } from '../services/authService';

// Create the context
const AuthContext = createContext(null);

// Provider component
export const AuthProvider = ({ children }) => {
  const account = useCurrentAccount();
  const [uid, setUid] = useState(getStoredUid());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUid = async () => {
      // If wallet disconnects, clear the UID
      if (!account) {
        clearUid();
        setUid(null);
        return;
      }
      
      // Only fetch UID if wallet is connected and we don't have a UID yet
      if (account && !uid) {
        setIsLoading(true);
        setError(null);
        
        try {
          const result = await generateUid(account.address);
          
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
  }, [account, uid]);
  
  const value = {
    uid,
    walletAddress: account?.address,
    isAuthenticated: !!uid && !!account,
    isLoading,
    error,
    // Manually refresh UID if needed
    refreshUid: async () => {
      if (account) {
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