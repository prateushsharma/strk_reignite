// src/components/modals/TradeConfirmationModal.jsx
import React, { useState } from 'react';
import { BsArrowUpRight, BsArrowDownRight, BsCurrencyExchange, BsX } from 'react-icons/bs';
import '../../styles/Modals.css';

const TradeConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  tradeAction, 
  balances, 
  currentPrice 
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState(null);
  
  if (!isOpen) return null;
  
  // Default values for tradeAction, balances, and currentPrice to prevent errors
  const action = tradeAction || 'buy';
  const isBuy = action === 'buy';
  const safeBalances = balances || { usdc: 0, sui: 0 }; // Changed from sol to sui
  const safePrice = currentPrice || { price: 0, buyPrice: 0, sellPrice: 0 };
  
  const availableAmount = isBuy ? safeBalances.usdc : safeBalances.sui; // Changed from sol to sui
  
  // Calculate estimated receive value safely
  const calculateEstimatedReceive = () => {
    if (isBuy) {
      const price = safePrice.buyPrice || safePrice.price || 1;
      if (price === 0) return '0.0000'; // Avoid division by zero
      return (safeBalances.usdc / price).toFixed(4);
    } else {
      const price = safePrice.sellPrice || safePrice.price || 1;
      return (safeBalances.sui * price).toFixed(2); // Changed from sol to sui
    }
  };
  
  const estimatedReceive = calculateEstimatedReceive();
  
  const handleConfirm = async () => {
    setIsConfirming(true);
    setError(null);
    
    try {
      await onConfirm(action);
      onClose();
    } catch (error) {
      console.error('Trade confirmation error:', error);
      setError(error.message || 'Failed to confirm trade. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };
  
  // Get current price based on action
  const getCurrentPrice = () => {
    if (isBuy) {
      return (safePrice.buyPrice || safePrice.price || 0).toFixed(2);
    } else {
      return (safePrice.sellPrice || safePrice.price || 0).toFixed(2);
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="confirmation-modal">
        <div className="modal-header">
          <h3>
            {isBuy ? (
              <><BsArrowUpRight className="buy-icon" /> Buy SUI</>
            ) : (
              <><BsArrowDownRight className="sell-icon" /> Sell SUI</>
            )}
          </h3>
          <button 
            className="close-btn"
            onClick={onClose}
          >
            <BsX />
          </button>
        </div>
        
        <div className="modal-content">
          <div className="price-info">
            <div className="current-price">
              <BsCurrencyExchange />
              <div>
                <span className="price-label">Current Price</span>
                <span className="price-value">
                  ${getCurrentPrice()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="trade-details">
            <div className="detail-row">
              <span className="detail-label">You will {isBuy ? 'spend' : 'sell'}</span>
              <span className="detail-value">
                {availableAmount} {isBuy ? 'USDC' : 'SUI'}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Estimated {isBuy ? 'receive' : 'receive'}</span>
              <span className="detail-value">
                {estimatedReceive} {isBuy ? 'SUI' : 'USDC'}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Price Impact</span>
              <span className="detail-value">~0.02%</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Fee</span>
              <span className="detail-value">0.3%</span>
            </div>
          </div>
          
          <div className="trade-warning">
            <p>
              {isBuy 
                ? 'You will spend all your available USDC to buy SUI at the current market price.' 
                : 'You will sell all your available SUI at the current market price.'}
            </p>
            <p>
              <strong>Note:</strong> This is a simulated trade and does not use actual funds.
            </p>
            
            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="cancel-btn"
            onClick={onClose}
            disabled={isConfirming}
          >
            Cancel
          </button>
          
          <button 
            className={`confirm-btn ${isBuy ? 'buy-btn' : 'sell-btn'}`}
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? 'Confirming...' : `Confirm ${isBuy ? 'Buy' : 'Sell'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeConfirmationModal;