// src/components/WalletConnector.jsx
import React from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { useAuth } from '../contexts/AuthContext';
import '../styles/WalletConnector.css';

const WalletConnector = () => {
  const account = useCurrentAccount();
  const { uid, isLoading, error } = useAuth();

  return (
    <div className="wallet-connector">
      <div className="connect-button-wrapper">
        <ConnectButton />
      </div>
      
      {account && (
        <div className="wallet-info">
          {isLoading ? (
            <div className="uid-loading">Generating UID...</div>
          ) : uid ? (
            <div className="uid-display">
              <span className="uid-label">UID:</span>
              <span className="uid-value">{uid}</span>
            </div>
          ) : error ? (
            <div className="uid-error" title={error}>
              UID Error
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default WalletConnector;