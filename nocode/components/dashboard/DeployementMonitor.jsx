// src/components/dashboard/DeploymentMonitor.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  BsTerminal,
  BsGraphUp,
  BsStop,
  BsCircleFill,
  BsX,
  BsClockHistory,
  BsLightningFill,
  BsShieldFillCheck,
  BsArrowUp,
  BsArrowDown,
  BsDashLg,
  BsInfoCircle
} from 'react-icons/bs';
import '../../styles/DeploymentMonitor.css';
import { useAuth } from '../../contexts/AuthContext';

const DeploymentMonitor = ({ agent, onClose, onStop }) => {
  const [logs, setLogs] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [currentDecision, setCurrentDecision] = useState(null);
  const [lastLogCount, setLastLogCount] = useState(0);
  const refreshIntervalRef = useRef(null);
  const logsEndRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  
  const { uid, walletAddress } = useAuth();
  
  // Canvas dimensions
  const chartConfig = {
    width: 1200,
    height: 400,
    paddingLeft: 100,
    paddingRight: 60,
    paddingTop: 60,
    paddingBottom: 80,
    timeWindow: 300000, // 5 minutes
    gridLines: 10,
    colors: {
      buy: '#00ff41',
      sell: '#ff0080',
      hold: '#ffd700',
      grid: 'rgba(255, 255, 255, 0.1)',
      text: '#ffffff',
      bg: '#0a0f1e'
    }
  };
  
  // Parse logs to extract decisions
  const parseLogs = (logData) => {
    const lines = logData.split('\n');
    const parsedLogs = [];
    const parsedDecisions = [];
    
    lines.forEach((line, index) => {
      if (!line.trim()) return;
      
      const timestamp = new Date().toISOString();
      
      if (line.includes('[AGENT EVALUATION]')) {
        const result = line.match(/Agent Based Analysis Result: (\w+)/);
        if (result) {
          const decision = result[1];
          const logEntry = {
            id: `log-${Date.now()}-${index}`,
            timestamp,
            level: 'evaluation',
            message: `AI Analysis: ${decision}`,
            type: 'evaluation'
          };
          parsedLogs.push(logEntry);
        }
      } else if (line.includes('[FINAL DECISION]')) {
        const result = line.match(/\[FINAL DECISION\] (\w+) at (.+)/);
        if (result) {
          const action = result[1];
          const decisionTime = result[2];
          
          const logEntry = {
            id: `log-${Date.now()}-${index}`,
            timestamp: new Date(decisionTime).toISOString(),
            level: 'decision',
            message: `DECISION: ${action}`,
            type: 'decision',
            action
          };
          parsedLogs.push(logEntry);
          
          parsedDecisions.push({
            id: `decision-${Date.now()}-${index}`,
            action,
            timestamp: new Date(decisionTime).toISOString(),
            confidence: Math.random() * 30 + 70, // Mock 70-100%
            price: 0.942 + (Math.random() - 0.5) * 0.05 // Mock price around $0.942
          });
        }
      } else if (line.includes('ERROR')) {
        parsedLogs.push({
          id: `log-${Date.now()}-${index}`,
          timestamp,
          level: 'error',
          message: line.trim(),
          type: 'error'
        });
      } else if (line.includes('WARNING')) {
        parsedLogs.push({
          id: `log-${Date.now()}-${index}`,
          timestamp,
          level: 'warning',
          message: line.trim(),
          type: 'warning'
        });
      } else {
        parsedLogs.push({
          id: `log-${Date.now()}-${index}`,
          timestamp,
          level: 'info',
          message: line.trim(),
          type: 'general'
        });
      }
    });
    
    return { logs: parsedLogs, decisions: parsedDecisions };
  };
  
  const fetchLogs = async () => {
    if (!agent || !uid || !walletAddress || !isMonitoring) return;
    
    try {
      const response = await fetch('http://127.0.0.1:8000/fetch_logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: uid,
          password: walletAddress
        }),
      });
      
      const result = await response.json();
      
      if (result.status === 'success' && result.log) {
        const { logs: parsedLogs, decisions: parsedDecisions } = parseLogs(result.log);
        
        // Only update if we have new logs
        if (parsedLogs.length > lastLogCount) {
          const newLogs = parsedLogs.slice(lastLogCount);
          setLogs(prevLogs => [...prevLogs, ...newLogs].slice(-50)); // Keep last 50
          setLastLogCount(parsedLogs.length);
          
          // Update decisions if any new ones
          const newDecisions = parsedDecisions.filter(d => 
            !decisions.find(existing => existing.timestamp === d.timestamp)
          );
          
          if (newDecisions.length > 0) {
            setDecisions(prevDecisions => [...prevDecisions, ...newDecisions].slice(-30));
            setCurrentDecision(newDecisions[newDecisions.length - 1]);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };
  
  // Add initial mock data for testing
  useEffect(() => {
    // Add some initial decisions for testing
    const mockDecisions = [
      {
        id: 'mock-1',
        action: 'HOLD',
        timestamp: new Date(Date.now() - 240000).toISOString(),
        confidence: 85,
        price: 0.941
      },
      {
        id: 'mock-2',
        action: 'BUY',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        confidence: 92,
        price: 0.938
      },
      {
        id: 'mock-3',
        action: 'HOLD',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        confidence: 78,
        price: 0.944
      },
      {
        id: 'mock-4',
        action: 'SELL',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        confidence: 88,
        price: 0.946
      },
      {
        id: 'mock-5',
        action: 'BUY',
        timestamp: new Date(Date.now() - 30000).toISOString(),
        confidence: 95,
        price: 0.940
      }
    ];
    
    setDecisions(mockDecisions);
    setCurrentDecision(mockDecisions[mockDecisions.length - 1]);
  }, []);
  
  // Draw the time-based graph
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { width, height, paddingLeft, paddingRight, paddingTop, paddingBottom, timeWindow, colors } = chartConfig;
    
    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);
    
    // Chart dimensions
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    
    // Time range
    const now = Date.now();
    const startTime = now - timeWindow;
    
    // Draw grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([5, 5]);
    
    // Vertical grid lines (time)
    for (let i = 0; i <= chartConfig.gridLines; i++) {
      const x = paddingLeft + (chartWidth / chartConfig.gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, height - paddingBottom);
      ctx.stroke();
    }
    
    // Horizontal grid lines (actions)
    const actionLevels = [
      { y: 0.2, label: 'BUY', color: colors.buy },
      { y: 0.5, label: 'HOLD', color: colors.hold },
      { y: 0.8, label: 'SELL', color: colors.sell }
    ];
    
    ctx.setLineDash([]);
    actionLevels.forEach(level => {
      const y = paddingTop + chartHeight * level.y;
      
      // Action line
      ctx.strokeStyle = level.color + '40';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();
      
      // Action label
      ctx.fillStyle = level.color;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(level.label, paddingLeft - 10, y);
    });
    
    // Draw time labels
    ctx.fillStyle = colors.text;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    for (let i = 0; i <= chartConfig.gridLines; i += 2) {
      const x = paddingLeft + (chartWidth / chartConfig.gridLines) * i;
      const time = new Date(startTime + (timeWindow / chartConfig.gridLines) * i);
      ctx.fillText(time.toLocaleTimeString(), x, height - paddingBottom + 20);
    }
    
    // Draw decisions
    const visibleDecisions = decisions.filter(d => {
      const decisionTime = new Date(d.timestamp).getTime();
      return decisionTime >= startTime && decisionTime <= now;
    });
    
    if (visibleDecisions.length > 0) {
      // Draw connecting lines
      ctx.beginPath();
      ctx.strokeStyle = colors.text;
      ctx.lineWidth = 3;
      
      visibleDecisions.forEach((decision, index) => {
        const x = paddingLeft + ((new Date(decision.timestamp).getTime() - startTime) / timeWindow) * chartWidth;
        let y;
        
        switch (decision.action) {
          case 'BUY':
            y = paddingTop + chartHeight * 0.2;
            break;
          case 'SELL':
            y = paddingTop + chartHeight * 0.8;
            break;
          case 'HOLD':
          default:
            y = paddingTop + chartHeight * 0.5;
            break;
        }
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Draw decision points
      visibleDecisions.forEach((decision, index) => {
        const x = paddingLeft + ((new Date(decision.timestamp).getTime() - startTime) / timeWindow) * chartWidth;
        let y, color;
        
        switch (decision.action) {
          case 'BUY':
            y = paddingTop + chartHeight * 0.2;
            color = colors.buy;
            break;
          case 'SELL':
            y = paddingTop + chartHeight * 0.8;
            color = colors.sell;
            break;
          case 'HOLD':
          default:
            y = paddingTop + chartHeight * 0.5;
            color = colors.hold;
            break;
        }
        
        // Pulsing effect for latest decision
        const isLatest = index === visibleDecisions.length - 1;
        const pulse = isLatest ? 1 + Math.sin(Date.now() * 0.003) * 0.3 : 1;
        
        // Outer glow
        ctx.beginPath();
        ctx.fillStyle = color + '30';
        ctx.arc(x, y, 20 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Main point
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner highlight
        ctx.beginPath();
        ctx.fillStyle = colors.text;
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Label for latest decision
        if (isLatest) {
          ctx.save();
          ctx.fillStyle = color;
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(decision.action, x, y - 25);
          ctx.font = '12px Arial';
          ctx.fillText(`${decision.confidence.toFixed(0)}%`, x, y - 10);
          ctx.restore();
        }
      });
    }
    
    // Draw title
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('AI Trading Decisions (Time vs Action)', width / 2, 30);
    
    // Draw current time indicator
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(width - paddingRight, paddingTop);
    ctx.lineTo(width - paddingRight, height - paddingBottom);
    ctx.stroke();
    
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.setLineDash([]);
    ctx.fillText('NOW', width - paddingRight, paddingTop - 10);
    
    // Request next frame if monitoring
    if (isMonitoring) {
      animationRef.current = requestAnimationFrame(drawChart);
    }
  };
  
  // Start monitoring
  useEffect(() => {
    fetchLogs(); // Initial fetch
    
    refreshIntervalRef.current = setInterval(() => {
      fetchLogs();
    }, 3000); // Check for new logs every 3 seconds
    
    drawChart(); // Start drawing
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [agent, uid, walletAddress, isMonitoring, decisions]);
  
  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);
  
  const handleStop = async () => {
    setIsMonitoring(false);
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    try {
      const response = await fetch('http://127.0.0.1:8000/stop_execution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: uid,
          password: walletAddress
        }),
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        const logEntry = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Agent stopped: ${result.message}`,
          type: 'general'
        };
        setLogs(prevLogs => [...prevLogs, logEntry]);
      }
    } catch (err) {
      console.error('Error stopping agent:', err);
    }
    
    onStop({ logs, decisions, stoppedAt: new Date().toISOString() });
  };
  
  return (
    <div className="deployment-monitor-overlay">
      <div className="deployment-monitor">
        <div className="monitor-header">
          <h2>
            <BsLightningFill className="header-icon" />
            Live Agent Monitoring
          </h2>
          <div className="header-actions">
            <div className="status-indicator">
              <div className={`pulse-dot ${isMonitoring ? 'active' : 'stopped'}`}></div>
              <span>{isMonitoring ? 'Running' : 'Stopped'}</span>
            </div>
            <button 
              className="stop-monitoring-btn"
              onClick={handleStop}
              disabled={!isMonitoring}
            >
              <BsStop /> Stop Agent
            </button>
            <button 
              className="close-btn"
              onClick={onClose}
              title="Close monitor"
            >
              <BsX />
            </button>
          </div>
        </div>
        
        <div className="monitor-content">
          {/* Chart Container - MAIN GRAPH */}
          <div className="chart-container">
            <canvas
              ref={canvasRef}
              className="trading-chart"
            />
            
            <div className="chart-legend">
              <div className="legend-item">
                <BsCircleFill style={{ color: chartConfig.colors.buy }} />
                <span>BUY</span>
              </div>
              <div className="legend-item">
                <BsCircleFill style={{ color: chartConfig.colors.hold }} />
                <span>HOLD</span>
              </div>
              <div className="legend-item">
                <BsCircleFill style={{ color: chartConfig.colors.sell }} />
                <span>SELL</span>
              </div>
              {currentDecision && (
                <div className="legend-item current">
                  <span>Latest: </span>
                  <strong className={currentDecision.action.toLowerCase()}>
                    {currentDecision.action}
                  </strong>
                  <span> @ {new Date(currentDecision.timestamp).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Logs Container */}
          <div className="logs-container-wrapper">
            <div className="logs-header">
              <div>
                <BsTerminal /> System Logs
                <span className="log-count">({logs.length} entries)</span>
              </div>
            </div>
            
            <div className="logs-scroll-container">
              {logs.length === 0 ? (
                <div className="logs-empty">
                  <p>Waiting for logs...</p>
                </div>
              ) : (
                <div className="logs-list">
                  {logs.map((log) => (
                    <div key={log.id} className={`log-entry ${log.level}`}>
                      <span className="log-time">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`log-level ${log.level}`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="log-message">{log.message}</span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentMonitor;