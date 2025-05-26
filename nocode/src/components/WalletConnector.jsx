// src/components/WalletConnector.jsx - Simplified Starknet wallet integration
import React, { useState } from 'react';
import { BsWallet2, BsChevronDown, BsCheck, BsX } from 'react-icons/bs';
import { useStarknet } from '../contexts/StarknetContext';
import { useAuth } from '../contexts/AuthContext';
import '../styles/WalletConnector.css';

const WalletConnector = () => {
  const { 
    address, 
    isConnected, 
    isConnecting, 
    error: walletError,
    connectWallet,
    connectArgent,
    connectBraavos,
    disconnectWallet,
    formatAddress,
    getNetworkName,
    wallet,
    availableWallets
  } = useStarknet();
  
  const { uid, isLoading, error: authError } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleConnect = async (walletType = null) => {
    setShowDropdown(false);
    try {
      if (walletType === 'argentX') {
        await connectArgent();
      } else if (walletType === 'braavos') {
        await connectBraavos();
      } else {
        await connectWallet();
      }
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = async () => {
    setShowDropdown(false);
    await disconnectWallet();
  };

  if (isConnected && address) {
    return (
      <div className="wallet-connector connected">
        <div className="wallet-info">
          <div className="wallet-main-info">
            <div className="wallet-icon">
              <BsWallet2 />
            </div>
            <div className="wallet-details">
              <div className="wallet-address">{formatAddress(address)}</div>
              <div className="wallet-network">{getNetworkName()}</div>
            </div>
            <button 
              className="dropdown-toggle"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <BsChevronDown />
            </button>
          </div>
          
          {uid && (
            <div className="uid-display">
              <span className="uid-label">UID:</span>
              <span className="uid-value">{uid}</span>
            </div>
          )}
          
          {isLoading && (
            <div className="uid-loading">Generating UID...</div>
          )}
          
          {authError && (
            <div className="uid-error" title={authError}>
              UID Error
            </div>
          )}
        </div>

        {showDropdown && (
          <div className="wallet-dropdown">
            <div className="dropdown-header">
              <div className="wallet-name">{wallet?.name || 'Starknet Wallet'}</div>
              <div className="connection-status">
                <BsCheck className="status-icon connected" />
                Connected
              </div>
            </div>
            <div className="dropdown-divider" />
            <div className="dropdown-item">
              <strong>Address:</strong>
              <span className="monospace">{formatAddress(address)}</span>
            </div>
            <div className="dropdown-item">
              <strong>Network:</strong>
              <span>{getNetworkName()}</span>
            </div>
            {uid && (
              <div className="dropdown-item">
                <strong>Agent UID:</strong>
                <span className="monospace">{uid}</span>
              </div>
            )}
            <div className="dropdown-divider" />
            <button 
              className="disconnect-btn"
              onClick={handleDisconnect}
            >
              <BsX />
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="wallet-connector">
      <div className="connect-button-container">
        <button 
          className="connect-button"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={isConnecting}
        >
          <BsWallet2 />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          <BsChevronDown />
        </button>

        {showDropdown && (
          <div className="wallet-dropdown connect-dropdown">
            <div className="dropdown-header">
              <div className="dropdown-title">Choose Wallet</div>
            </div>
            <div className="wallet-options">
              <button 
                className="wallet-option"
                onClick={() => handleConnect('argentX')}
                disabled={isConnecting}
              >
                <div className="wallet-option-icon argent">A</div>
                <div className="wallet-option-info">
                  <div className="wallet-option-name">Argent X</div>
                  <div className="wallet-option-desc">Smart Contract Wallet</div>
                </div>
              </button>
              
              <button 
                className="wallet-option"
                onClick={() => handleConnect('braavos')}
                disabled={isConnecting}
              >
                <div className="wallet-option-icon braavos">B</div>
                <div className="wallet-option-info">
                  <div className="wallet-option-name">Braavos</div>
                  <div className="wallet-option-desc">Advanced Starknet Wallet</div>
                </div>
              </button>
              
              <button 
                className="wallet-option"
                onClick={() => handleConnect()}
                disabled={isConnecting}
              >
                <div className="wallet-option-icon generic">
                  <BsWallet2 />
                </div>
                <div className="wallet-option-info">
                  <div className="wallet-option-name">Any Starknet Wallet</div>
                  <div className="wallet-option-desc">Detect available wallets</div>
                </div>
              </button>
            </div>
            
            {availableWallets.length === 0 && (
              <div className="no-wallet-message">
                <p>No Starknet wallets detected.</p>
                <p>Please install <a href="https://www.argent.xyz/argent-x/" target="_blank" rel="noopener noreferrer">Argent X</a> or <a href="https://braavos.app/" target="_blank" rel="noopener noreferrer">Braavos</a> wallet.</p>
              </div>
            )}
            
            {walletError && (
              <div className="wallet-error">
                <BsX />
                {walletError}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletConnector;