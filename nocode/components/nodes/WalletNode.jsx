// src/components/nodes/WalletNode.jsx
import React, { useState } from 'react';
import { Handle } from 'reactflow';
import { BsWallet2, BsArrowClockwise, BsCashCoin } from 'react-icons/bs';
import '../../styles/Nodes.css';

const WalletNode = ({ data, id }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState('0');
  const [fundAmount, setFundAmount] = useState('');
  const [txLimit, setTxLimit] = useState('1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Generate new wallet for the agent
  const generateNewWallet = async () => {
    setIsGenerating(true);
    
    try {
      // In production, this would call your backend API
      const response = await fetch('/api/wallet/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nodeId: id })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setWalletAddress(data.walletAddress);
        setBalance('0');
        
        // Update the node data so it can be serialized with the flow
        if (data.nodeData) {
          data.onChange({
            ...data,
            walletAddress: data.walletAddress,
            balance: '0',
            txLimit: txLimit
          });
        }
      } else {
        console.error('Failed to create wallet:', data.error);
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Fund the wallet
  const handleFundWallet = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0 || !walletAddress) return;
    
    setIsLoading(true);
    
    try {
      // This would call your backend API to transfer funds
      const response = await fetch('/api/wallet/fund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          amount: fundAmount,
          nodeId: id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBalance(data.newBalance);
        setFundAmount('');
        
        // Update the node data
        if (data.onChange) {
          data.onChange({
            ...data,
            balance: data.newBalance
          });
        }
      } else {
        console.error('Failed to fund wallet:', data.error);
      }
    } catch (error) {
      console.error('Error funding wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update transaction limit
  const handleTxLimitChange = (e) => {
    const value = e.target.value;
    setTxLimit(value);
    
    // Update the node data
    if (data.onChange) {
      data.onChange({
        ...data,
        txLimit: value
      });
    }
  };
  
  // Load saved data when component mounts
  React.useEffect(() => {
    if (data.walletAddress) {
      setWalletAddress(data.walletAddress);
    }
    
    if (data.balance) {
      setBalance(data.balance);
    }
    
    if (data.txLimit) {
      setTxLimit(data.txLimit);
    }
  }, [data]);
  
  return (
    <div className="custom-node wallet-node">
      <Handle
        type="target"
        position="left"
        id="wallet-in"
        style={{ background: 'var(--payment-color)' }}
      />
      
      <div className="node-header">
        <BsWallet2 className="node-icon" />
        <div className="node-title">Agent Wallet</div>
      </div>
      
      <div className="node-content">
        <div className="wallet-status">
          <div className="wallet-label">Wallet Address</div>
          <div className="wallet-address">
            {isGenerating ? 'Generating...' : (
              walletAddress ? (
                <div className="address-container">
                  <span className="address-text">
                    {walletAddress.substring(0, 8)}...
                    {walletAddress.substring(walletAddress.length - 8)}
                  </span>
                  <button 
                    className="regenerate-button" 
                    onClick={generateNewWallet}
                    title="Generate new wallet"
                    disabled={isGenerating}
                  >
                    <BsArrowClockwise />
                  </button>
                </div>
              ) : (
                <button 
                  className="generate-wallet-btn"
                  onClick={generateNewWallet}
                  disabled={isGenerating}
                >
                  Generate Wallet
                </button>
              )
            )}
          </div>
        </div>
        
        <div className="wallet-balance">
          <div className="balance-label">Balance</div>
          <div className="balance-value">
            <BsCashCoin className="balance-icon" />
            <span>{balance} SUI</span>
          </div>
        </div>
        
        {walletAddress && (
          <>
            <div className="input-group">
              <label>Fund Amount (SUI)</label>
              <div className="fund-input-container">
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={isLoading}
                />
                <button 
                  className="fund-button"
                  onClick={handleFundWallet}
                  disabled={isLoading || !fundAmount || parseFloat(fundAmount) <= 0}
                >
                  {isLoading ? 'Funding...' : 'Fund'}
                </button>
              </div>
            </div>
            
            <div className="input-group">
              <label>Transaction Limit (SUI)</label>
              <input
                type="number"
                value={txLimit}
                onChange={handleTxLimitChange}
                placeholder="1.00"
                step="0.01"
                min="0"
              />
              <div className="limit-description">
                Maximum amount per transaction
              </div>
            </div>
          </>
        )}
      </div>
      
      <Handle
        type="source"
        position="right"
        id="wallet-out"
        style={{ background: 'var(--payment-color)' }}
      />
    </div>
  );
};

export default WalletNode;