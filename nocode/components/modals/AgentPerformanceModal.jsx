// src/components/modals/AgentPerformanceModal.jsx
import React, { useState, useEffect } from 'react';
import { BsXLg, BsArrowUp, BsArrowDown, BsDashLg } from 'react-icons/bs';
import '../../styles/Modals.css';
import { fetchPairStatus } from '../../services/agentDeploymentService';

const AgentPerformanceModal = ({ isOpen, onClose, agentLogs = [], tradingData = {} }) => {
  const [balances, setBalances] = useState({ sui: 0, usdc: 0 });
  const [decisions, setDecisions] = useState([]);
  
  // Extract decisions from logs when logs change
  useEffect(() => {
    if (agentLogs && agentLogs.length > 0) {
      const extractedDecisions = extractDecisionsFromLogs(agentLogs);
      setDecisions(extractedDecisions);
    }
  }, [agentLogs]);
  
  // Parse log entries to extract trading decisions
  const extractDecisionsFromLogs = (logs) => {
    const decisionEntries = [];
    
    logs.forEach((log, index) => {
      // Check for final decision logs
      // Common patterns: "[FINAL DECISION] BUY" or "Final decision: SELL" etc.
      const decisionMatch = log.match(/\[(FINAL DECISION|DECISION)\]\s+(\w+)|Final decision:\s+(\w+)/i);
      
      if (decisionMatch) {
        // Get the action (BUY, SELL, HOLD)
        const action = (decisionMatch[2] || decisionMatch[3] || '').toLowerCase();
        
        // Only process valid actions
        if (action === 'buy' || action === 'sell' || action === 'hold') {
          decisionEntries.push({
            action,
            timestamp: new Date().toISOString(), // Use current time as a fallback
            index
          });
        }
      }
    });
    
    return decisionEntries;
  };

  // Fetch latest balances
  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const result = await fetchPairStatus();
        if (result.status === 'success') {
          setBalances({
            sui: result.data.sui || result.data.sol || 0, // Handle both sui and legacy sol property
            usdc: result.data.usdc || 0
          });
        }
      } catch (error) {
        console.error('Error fetching latest data:', error);
      }
    };

    if (isOpen) {
      fetchLatestData();
      const interval = setInterval(fetchLatestData, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Calculate performance stats based on decisions
  const calculateStats = () => {
    // Default stats if not enough data
    const defaultStats = { change: 0, percentage: 0 };
    
    if (!decisions || decisions.length < 2) return defaultStats;
    
    // For a simple simulation, let's assume:
    // - Each BUY action increases value by 2%
    // - Each SELL action decreases value by 1%
    // - HOLD has no effect
    let value = 100; // Starting value
    
    decisions.forEach(decision => {
      if (decision.action === 'buy') {
        value *= 1.02; // 2% increase
      } else if (decision.action === 'sell') {
        value *= 0.99; // 1% decrease
      }
      // No change for HOLD
    });
    
    const change = value - 100;
    const percentage = (change / 100) * 100;
    
    return { change, percentage };
  };

  const stats = calculateStats();
  const isPositive = stats.change >= 0;

  if (!isOpen) return null;

  // Calculate portfolio value safely
  const calculatePortfolioValue = () => {
    // Ensure we have all the data needed
    if (!balances || !tradingData || typeof tradingData.currentPrice === 'undefined') {
      return '0.00';
    }
    
    // Get values with defaults if undefined
    const suiBalance = balances.sui || 0;
    const usdcBalance = balances.usdc || 0;
    const currentPrice = tradingData.currentPrice || 0;
    
    // Calculate and format the value
    const value = (suiBalance * currentPrice) + usdcBalance;
    return value.toFixed(2);
  };

  // Render the enhanced time-vs-action chart using actual log data
  const renderActionChart = () => {
    if (!decisions || decisions.length === 0) {
      return <div className="chart-loading">No trading decisions yet...</div>;
    }

    // Calculate time ranges for X-axis labels (fallback to current time if needed)
    const startTime = decisions.length > 0 ? new Date() : new Date();
    const endTime = new Date();
    
    return (
      <div className="action-chart">
        {/* Y-axis labels */}
        <div className="chart-y-axis">
          <div className="y-label buy-label">Buy</div>
          <div className="y-label hold-label">Hold</div>
          <div className="y-label sell-label">Sell</div>
        </div>
        
        {/* Chart plot area */}
        <div className="chart-plot-area">
          {/* Grid lines */}
          <div className="grid-line buy-line"></div>
          <div className="grid-line hold-line"></div>
          <div className="grid-line sell-line"></div>
          
          {/* Render data points */}
          {decisions.map((decision, index) => {
            const xPos = (index / Math.max(decisions.length - 1, 1)) * 100;
            let yPos;
            
            // Position based on action
            if (decision.action === 'buy') yPos = 16.7; // Top third
            else if (decision.action === 'hold') yPos = 50; // Middle
            else yPos = 83.3; // Bottom third (sell)
            
            // Determine color based on action
            const colorClass = decision.action;
            
            return (
              <div 
                key={index} 
                className={`chart-point ${colorClass}`} 
                style={{ 
                  left: `${xPos}%`, 
                  top: `${yPos}%`,
                  animationDelay: `${0.1 + (index * 0.03)}s`
                }}
              ></div>
            );
          })}
        </div>
        
        {/* X-axis time labels */}
        <div className="chart-x-axis">
          <div className="x-label">{formatTime(startTime)}</div>
          <div className="x-label">{formatTime(new Date(startTime.getTime() + (endTime.getTime() - startTime.getTime()) / 2))}</div>
          <div className="x-label">{formatTime(endTime)}</div>
        </div>
      </div>
    );
  };

  // Format time for x-axis labels
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Return formatted logs for display
  const getFormattedLogs = () => {
    if (!agentLogs || agentLogs.length === 0) {
      return [];
    }
    
    // Format logs for display
    return agentLogs.map((log, index) => {
      return {
        id: index,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        content: log
      };
    });
  };

  return (
    <div className="performance-modal-overlay">
      <div className="performance-modal-container">
        <header className="performance-modal-header">
          <h2>Agent Performance</h2>
          <button className="performance-close-btn" onClick={onClose}>
            <BsXLg />
          </button>
        </header>
        
        <div className="performance-stats-bar">
          <div className="performance-stat-box">
            <div className="stat-label">Portfolio Value</div>
            <div className="stat-value">${calculatePortfolioValue()}</div>
          </div>
          
          <div className="performance-stat-box">
            <div className="stat-label">Performance</div>
            <div className={`stat-value ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? <BsArrowUp /> : <BsArrowDown />} {Math.abs(stats.percentage).toFixed(2)}%
            </div>
          </div>
          
          <div className="performance-stat-box">
            <div className="stat-label">SUI Balance</div>
            <div className="stat-value">{balances.sui} SUI</div>
          </div>
          
          <div className="performance-stat-box">
            <div className="stat-label">USDC Balance</div>
            <div className="stat-value">{balances.usdc} USDC</div>
          </div>
        </div>
        
        <div className="performance-content">
          <div className="chart-panel">
            <div className="panel-heading">Trading Decisions (Time vs Action)</div>
            <div className="chart-container">
              {renderActionChart()}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-dot buy"></div>
                <span>Buy</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot hold"></div>
                <span>Hold</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot sell"></div>
                <span>Sell</span>
              </div>
            </div>
          </div>
          
          <div className="logs-panel">
            <div className="panel-heading">Agent Logs</div>
            <div className="logs-container">
              {getFormattedLogs().length > 0 ? (
                getFormattedLogs().map(log => (
                  <div key={log.id} className="log-entry">
                    <span className="log-time">{log.timestamp}</span>
                    <span className="log-content">{log.content}</span>
                  </div>
                ))
              ) : (
                <div className="empty-logs">Waiting for agent activity...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPerformanceModal;