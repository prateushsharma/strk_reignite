// src/components/modals/TradingModal.jsx
import React, { useState } from 'react';
import { BsXLg, BsPlay, BsPercent, BsShieldCheck, BsCashCoin, BsExclamationTriangle } from 'react-icons/bs';
import '../../styles/Modals.css';

const TradingModal = ({ isOpen, onClose, onSubmit, initialParams = {} }) => {
  const [params, setParams] = useState({
    startingAmount: initialParams.startingAmount || 100,
    profit: initialParams.profit || 0.1,
    loss: initialParams.loss || 0.05,
    risk: initialParams.risk || 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate parameters
      if (params.startingAmount <= 0) {
        throw new Error('Starting amount must be greater than 0');
      }
      
      if (params.profit <= 0 || params.profit > 1) {
        throw new Error('Profit target must be between 0.01 and 1.00');
      }
      
      if (params.loss <= 0 || params.loss > 1) {
        throw new Error('Stop loss must be between 0.01 and 1.00');
      }
      
      // Submit the trading parameters
      await onSubmit(params);
    } catch (error) {
      console.error('Trading parameter submission error:', error);
      setError(error.message || 'Failed to start trading agent');
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convert numeric values from strings to floats
    const processedValue = name === 'risk' 
      ? value 
      : parseFloat(value);
      
    setParams(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="trading-modal">
        <div className="modal-header">
          <h3><BsPlay /> Start Trading Agent</h3>
          <button className="close-btn" onClick={onClose} disabled={isSubmitting}>
            <BsXLg />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="form-group">
              <label>
                <BsCashCoin /> Starting USDC Amount
              </label>
              <input
                type="number"
                name="startingAmount"
                value={params.startingAmount}
                onChange={handleChange}
                min="1"
                step="1"
                required
                disabled={isSubmitting}
              />
              <div className="help-text">Amount of USDC to start trading with</div>
            </div>
            
            <div className="form-group">
              <label>
                <BsPercent /> Profit Target (%)
              </label>
              <input
                type="number"
                name="profit"
                value={params.profit}
                onChange={handleChange}
                min="0.01"
                max="1"
                step="0.01"
                required
                disabled={isSubmitting}
              />
              <div className="help-text">Target profit percentage (0.1 = 10%)</div>
            </div>
            
            <div className="form-group">
              <label>
                <BsPercent /> Stop Loss (%)
              </label>
              <input
                type="number"
                name="loss"
                value={params.loss}
                onChange={handleChange}
                min="0.01"
                max="1"
                step="0.01"
                required
                disabled={isSubmitting}
              />
              <div className="help-text">Maximum loss percentage (0.05 = 5%)</div>
            </div>
            
            <div className="form-group">
              <label>
                <BsShieldCheck /> Risk Level
              </label>
              <select
                name="risk"
                value={params.risk}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <div className="help-text">Strategy risk profile</div>
            </div>
            
            <div className="trading-info">
              <p>
                The agent will trade SOL/USDC using your specified parameters. 
                Higher risk settings lead to more frequent trades.
              </p>
            </div>
            
            {error && (
              <div className="error-message">
                <BsExclamationTriangle /> {error}
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="start-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner-small"></div> Starting...
                </>
              ) : (
                <>
                  <BsPlay /> Start Trading
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradingModal;