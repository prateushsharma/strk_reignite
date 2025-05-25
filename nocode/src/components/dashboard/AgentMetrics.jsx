// src/components/dashboard/AgentMetrics.jsx
import React, { useState, useEffect } from 'react';
import { 
  BsBarChart, 
  BsArrowUp, 
  BsArrowDown, 
  BsArrowRight,
  BsClock,
  BsCashCoin,
  BsCreditCard2Front,
  BsGraphUp,
  BsCalendarCheck
} from 'react-icons/bs';
import '../../styles/AgentMetrics.css';

const AgentMetrics = ({ agent }) => {
  const [timeRange, setTimeRange] = useState('24h'); // '24h', '7d', '30d', 'all'
  const [selectedMetric, setSelectedMetric] = useState('performance');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Generate mock performance metrics for demonstration
  const generateMockMetrics = () => {
    // Performance metrics
    const performanceMetrics = {
      sharpeRatio: (Math.random() * 2 + 0.5).toFixed(2),
      drawdown: (Math.random() * 15).toFixed(2),
      profitFactor: (Math.random() * 3 + 1).toFixed(2),
      winRate: (Math.random() * 30 + 50).toFixed(2),
      totalTrades: Math.floor(Math.random() * 100 + 20),
      profitableTrades: Math.floor(Math.random() * 60 + 10),
      averageProfitPerTrade: (Math.random() * 0.05).toFixed(4),
      tradingVolumeUSD: (Math.random() * 10000 + 1000).toFixed(2)
    };
    
    // Financial metrics
    const financialMetrics = {
      totalProfitUSD: (Math.random() * 500 - 100).toFixed(2),
      totalProfitPercentage: (Math.random() * 40 - 10).toFixed(2),
      averageHoldingPeriod: Math.floor(Math.random() * 120 + 30), // minutes
      largestWin: (Math.random() * 50 + 10).toFixed(2),
      largestLoss: (Math.random() * 30 + 5).toFixed(2),
      initialCapital: '100.00',
      currentCapital: (100 + parseFloat(performanceMetrics.totalProfitUSD)).toFixed(2)
    };
    
    // System metrics
    const systemMetrics = {
      uptime: Math.floor(Math.random() * 720 + 24), // hours
      executionLatency: Math.floor(Math.random() * 500 + 50), // ms
      decisionsPerHour: Math.floor(Math.random() * 60 + 10),
      apiCallsMade: Math.floor(Math.random() * 5000 + 1000),
      modelContextSize: Math.floor(Math.random() * 4000 + 2000), // tokens
      lastDeployment: new Date(Date.now() - Math.random() * 604800000).toISOString(), // within last week
      memoryUsage: Math.floor(Math.random() * 300 + 100) // MB
    };
    
    // Generate historical data for charts
    const chartData = {
      performance: generatePerformanceData(),
      trades: generateTradeData(),
      capital: generateCapitalData()
    };
    
    return {
      performance: performanceMetrics,
      financial: financialMetrics,
      system: systemMetrics,
      chartData
    };
  };
  
  // Generate mock historical performance data
  const generatePerformanceData = () => {
    const dataPoints = timeRangeToDataPoints(timeRange);
    let value = 100;
    
    return Array(dataPoints).fill().map((_, i) => {
      // Random change with slightly positive bias
      const change = (Math.random() * 4) - 1.5;
      value += change;
      
      return {
        timestamp: new Date(Date.now() - (dataPoints - i) * 3600000).toISOString(),
        value: parseFloat(value.toFixed(2))
      };
    });
  };
  
  // Generate mock trade data
  const generateTradeData = () => {
    const dataPoints = timeRangeToDataPoints(timeRange) / 4; // Fewer trades than performance data points
    const trades = [];
    
    for (let i = 0; i < dataPoints; i++) {
      const isWin = Math.random() > 0.4; // More wins than losses
      const amount = isWin ? 
        (Math.random() * 4 + 1).toFixed(2) : 
        -(Math.random() * 3 + 0.5).toFixed(2);
      
      trades.push({
        timestamp: new Date(Date.now() - (dataPoints - i) * 14400000).toISOString(),
        amount: parseFloat(amount),
        type: isWin ? 'win' : 'loss',
        pair: 'SUI/USDC'
      });
    }
    
    return trades;
  };
  
  // Generate mock capital data
  const generateCapitalData = () => {
    const dataPoints = timeRangeToDataPoints(timeRange);
    let capital = 100;
    
    return Array(dataPoints).fill().map((_, i) => {
      // Random change with slightly positive bias
      const change = (Math.random() * 2) - 0.7;
      capital += change;
      
      return {
        timestamp: new Date(Date.now() - (dataPoints - i) * 3600000).toISOString(),
        value: parseFloat(capital.toFixed(2))
      };
    });
  };
  
  // Convert time range to number of data points
  const timeRangeToDataPoints = (range) => {
    switch (range) {
      case '24h': return 24;
      case '7d': return 7 * 24;
      case '30d': return 30 * 24;
      case 'all': return 90 * 24;
      default: return 24;
    }
  };
  
  useEffect(() => {
    if (!agent) return;
    
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const mockMetrics = generateMockMetrics();
      setMetrics(mockMetrics);
      setLoading(false);
    }, 1000);
  }, [agent, timeRange]);
  
  const renderMetricValue = (value, type = 'number') => {
    if (type === 'percentage') {
      return <span className={parseFloat(value) >= 0 ? 'positive' : 'negative'}>
        {parseFloat(value) >= 0 ? '+' : ''}{value}%
      </span>;
    } else if (type === 'currency') {
      return <span className={parseFloat(value) >= 0 ? 'positive' : 'negative'}>
        ${Math.abs(parseFloat(value)).toFixed(2)}
        {parseFloat(value) >= 0 ? <BsArrowUp /> : <BsArrowDown />}
      </span>;
    } else if (type === 'time') {
      return <span>{value}min</span>;
    } else {
      return <span>{value}</span>;
    }
  };
  
  const renderChart = () => {
    if (!metrics) return null;
    
    let data;
    switch (selectedMetric) {
      case 'performance':
        data = metrics.chartData.performance;
        break;
      case 'trades':
        data = metrics.chartData.trades;
        break;
      case 'capital':
        data = metrics.chartData.capital;
        break;
      default:
        data = metrics.chartData.performance;
    }
    
    // In a real app, we would use a proper chart library like recharts
    // For now, we'll just render a placeholder
    return (
      <div className="chart-placeholder">
        <h4>{selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Chart</h4>
        <div className="chart-mock">
          <div className="chart-axis y-axis">
            <div className="axis-tick">200</div>
            <div className="axis-tick">150</div>
            <div className="axis-tick">100</div>
            <div className="axis-tick">50</div>
            <div className="axis-tick">0</div>
          </div>
          <div className="chart-content">
            <div className="chart-line" 
              style={{
                backgroundImage: `repeating-linear-gradient(to right, 
                  transparent, transparent 2px, var(--accent-primary) 2px, var(--accent-primary) 4px)`
              }}
            ></div>
            <div className="chart-area" 
              style={{
                clipPath: 'polygon(0% 100%, 5% 80%, 10% 75%, 15% 82%, 20% 70%, 25% 65%, 30% 68%, 35% 62%, 40% 58%, 45% 65%, 50% 55%, 55% 60%, 60% 58%, 65% 50%, 70% 55%, 75% 48%, 80% 52%, 85% 45%, 90% 40%, 95% 45%, 100% 38%, 100% 100%, 0% 100%)'
              }}
            ></div>
          </div>
          <div className="chart-axis x-axis">
            <div className="axis-tick">Start</div>
            <div className="axis-tick">Middle</div>
            <div className="axis-tick">Now</div>
          </div>
        </div>
        <div className="chart-info">
          This is a visualization placeholder. In a real implementation, this would be an interactive chart showing {selectedMetric.toLowerCase()} data over time.
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="agent-metrics loading">
        <div className="spinner"></div>
        <p>Loading metrics...</p>
      </div>
    );
  }
  
  if (!metrics) {
    return (
      <div className="agent-metrics empty">
        <BsBarChart className="empty-icon" />
        <h3>No Metrics Available</h3>
        <p>This agent hasn't generated any metrics yet.</p>
      </div>
    );
  }
  
  return (
    <div className="agent-metrics">
      <div className="metrics-header">
        <div className="time-range-selector">
          <button 
            className={`range-btn ${timeRange === '24h' ? 'active' : ''}`}
            onClick={() => setTimeRange('24h')}
          >
            24h
          </button>
          <button 
            className={`range-btn ${timeRange === '7d' ? 'active' : ''}`}
            onClick={() => setTimeRange('7d')}
          >
            7d
          </button>
          <button 
            className={`range-btn ${timeRange === '30d' ? 'active' : ''}`}
            onClick={() => setTimeRange('30d')}
          >
            30d
          </button>
          <button 
            className={`range-btn ${timeRange === 'all' ? 'active' : ''}`}
            onClick={() => setTimeRange('all')}
          >
            All
          </button>
        </div>
        
        <div className="chart-selector">
          <button 
            className={`chart-btn ${selectedMetric === 'performance' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('performance')}
          >
            <BsGraphUp /> Performance
          </button>
          <button 
            className={`chart-btn ${selectedMetric === 'trades' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('trades')}
          >
            <BsCreditCard2Front /> Trades
          </button>
          <button 
            className={`chart-btn ${selectedMetric === 'capital' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('capital')}
          >
            <BsCashCoin /> Capital
          </button>
        </div>
      </div>
      
      <div className="chart-section">
        {renderChart()}
      </div>
      
      <div className="metrics-grid">
        <div className="metrics-section">
          <h3><BsGraphUp /> Performance Metrics</h3>
          <div className="metrics-table">
            <div className="metric-row">
              <div className="metric-label">Sharpe Ratio</div>
              <div className="metric-value">{metrics.performance.sharpeRatio}</div>
            </div>
            <div className="metric-row">
              <div className="metric-label">Max Drawdown</div>
              <div className="metric-value">{metrics.performance.drawdown}%</div>
            </div>
            <div className="metric-row">
              <div className="metric-label">Profit Factor</div>
              <div className="metric-value">{metrics.performance.profitFactor}</div>
            </div>
            <div className="metric-row">
              <div className="metric-label">Win Rate</div>
              <div className="metric-value">{metrics.performance.winRate}%</div>
            </div>
            <div className="metric-row">
              <div className="metric-label">Total Trades</div>
              <div className="metric-value">{metrics.performance.totalTrades}</div>
            </div>
            <div className="metric-row">
              <div className="metric-label">Profitable Trades</div>
              <div className="metric-value">{metrics.performance.profitableTrades}</div>
            </div>
          </div>
        </div>
        
        <div className="metrics-section">
          <h3><BsCashCoin /> Financial Metrics</h3>
          <div className="metrics-table">
            <div className="metric-row">
              <div className="metric-label">Total Profit/Loss</div>
              <div className="metric-value">
                {renderMetricValue(metrics.financial.totalProfitUSD, 'currency')}
              </div>
            </div>
            <div className="metric-row">
              <div className="metric-label">Profit/Loss %</div>
              <div className="metric-value">
                {renderMetricValue(metrics.financial.totalProfitPercentage, 'percentage')}
              </div>
            </div>
            <div className="metric-row">
              <div className="metric-label">Avg. Holding Period</div>
              <div className="metric-value">
                {renderMetricValue(metrics.financial.averageHoldingPeriod, 'time')}
              </div>
            </div>
            <div className="metric-row">
              <div className="metric-label">Largest Win</div>
              <div className="metric-value">${metrics.financial.largestWin}</div>
            </div>
            <div className="metric-row">
              <div className="metric-label">Largest Loss</div>
              <div className="metric-value">-${metrics.financial.largestLoss}</div>
            </div>
            <div className="metric-row">
              <div className="metric-label">Starting Capital</div>
              <div className="metric-value">${metrics.financial.initialCapital}</div>
            </div>
          </div>
        </div>
        
        <div className="metrics-section">
          <h3><BsClock /> System Metrics</h3>
          <div className="metrics-table">
            <div className="metric-row">
              <div className="metric-label">Uptime</div>
              <div className="metric-value">{metrics.system.uptime} hours</div>
            </div>
            <div className="metric-row">
              <div className="metric-label">Execution Latency</div>
              <div className="metric-value">{metrics.system.executionLatency} ms</div>
            </div>
            <div className="metric-row">
              <div className="metric-label">Decisions/Hour</div>
              <div className="metric-value">{metrics.system.decisionsPerHour}</div>
            </div>
            <div className="metric-row">
              <div className="metric-label">API Calls</div>
              <div className="metric-value">{metrics.system.apiCallsMade}</div>
            </div>
            <div className="metric-row">
              <div className="metric-label">MCP Context Size</div>
              <div className="metric-value">{metrics.system.modelContextSize} tokens</div>
            </div>
            <div className="metric-row">
              <div className="metric-label">Last Deployment</div>
              <div className="metric-value">
                {new Date(metrics.system.lastDeployment).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentMetrics;
 