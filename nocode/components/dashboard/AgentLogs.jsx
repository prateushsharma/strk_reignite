// src/components/dashboard/AgentLogs.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  BsTerminal, 
  BsExclamationTriangle, 
  BsInfoCircle, 
  BsDownload,
  BsFilter,
  BsSearch,
  BsTrash,
  BsArrowClockwise,
  BsGraphUp,
  BsCircleFill,
  BsCaretUpFill,
  BsCaretDownFill,
  BsDashLg
} from 'react-icons/bs';
import '../../styles/AgentLogs.css';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAgentLogs } from '../../services/agentDeploymentService';

// Improved Decision Chart Component
const DecisionChart = ({ decisions }) => {
  const canvasRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size with proper device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Chart dimensions
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;
    
    // Get recent decisions (last 50)
    const recentDecisions = decisions.slice(-50);
    if (recentDecisions.length === 0) return;
    
    // Map decisions to coordinates
    const points = recentDecisions.map((decision, index) => {
      const x = padding + (chartWidth / Math.max(recentDecisions.length - 1, 1)) * index;
      let y;
      
      switch (decision.action) {
        case 'BUY':
          y = padding;
          break;
        case 'SELL':
          y = rect.height - padding;
          break;
        case 'HOLD':
        default:
          y = rect.height / 2;
          break;
      }
      
      return { x, y, decision };
    });
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Horizontal grid lines
    const levels = [padding, rect.height / 2, rect.height - padding];
    levels.forEach(y => {
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(rect.width - padding, y);
      ctx.stroke();
    });
    
    // Vertical grid lines (time markers)
    const timeInterval = Math.floor(recentDecisions.length / 5);
    for (let i = 0; i <= 5; i++) {
      const x = padding + (chartWidth / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, rect.height - padding);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
    
    // Draw line graph
    ctx.beginPath();
    ctx.strokeStyle = '#5e72e4';
    ctx.lineWidth = Cc2;
    
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        // Smooth curve between points
        const prevPoint = points[index - 1];
        const cp1x = prevPoint.x + (point.x - prevPoint.x) / 2;
        const cp1y = prevPoint.y;
        const cp2x = prevPoint.x + (point.x - prevPoint.x) / 2;
        const cp2y = point.y;
        
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, point.x, point.y);
      }
    });
    ctx.stroke();
    
    // Draw points
    points.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      
      // Color based on action
      switch (point.decision.action) {
        case 'BUY':
          ctx.fillStyle = '#2dce89';
          break;
        case 'SELL':
          ctx.fillStyle = '#f5365c';
          break;
        case 'HOLD':
        default:
          ctx.fillStyle = '#ffc107';
          break;
      }
      
      ctx.fill();
      
      // Highlight last point with pulse effect
      if (index === points.length - 1) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    
    // Draw labels
    ctx.fillStyle = '#f5f5f5';
    ctx.font = '12px Inter';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    // Y-axis labels
    ctx.fillText('BUY', padding - 10, padding);
    ctx.fillText('HOLD', padding - 10, rect.height / 2);
    ctx.fillText('SELL', padding - 10, rect.height - padding);
    
    // Time labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    if (recentDecisions.length > 0) {
      const startTime = new Date(recentDecisions[0].timestamp);
      const endTime = new Date(recentDecisions[recentDecisions.length - 1].timestamp);
      
      ctx.fillText(startTime.toLocaleTimeString(), padding, rect.height - padding + 10);
      ctx.fillText(endTime.toLocaleTimeString(), rect.width - padding, rect.height - padding + 10);
    }
  }, [decisions]);
  
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Find closest point
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const recentDecisions = decisions.slice(-50);
    
    if (recentDecisions.length === 0) return;
    
    const pointSpacing = chartWidth / Math.max(recentDecisions.length - 1, 1);
    const index = Math.round((x - padding) / pointSpacing);
    
    if (index >= 0 && index < recentDecisions.length) {
      setHoveredPoint({
        decision: recentDecisions[index],
        x: padding + pointSpacing * index,
        y: y
      });
    } else {
      setHoveredPoint(null);
    }
  };
  
  return (
    <div className="decision-chart-container">
      <div className="chart-header">
        <h4><BsGraphUp /> Live Trading Decisions</h4>
        <div className="chart-legend">
          <div className="legend-item">
            <BsCaretUpFill className="buy-color" />
            <span>BUY</span>
          </div>
          <div className="legend-item">
            <BsDashLg className="hold-color" />
            <span>HOLD</span>
          </div>
          <div className="legend-item">
            <BsCaretDownFill className="sell-color" />
            <span>SELL</span>
          </div>
        </div>
      </div>
      
      <div className="chart-wrapper">
        <canvas
          ref={canvasRef}
          className="decision-canvas"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
          width={800}
          height={300}
        />
        
        {hoveredPoint && (
          <div 
            className="chart-tooltip"
            style={{
              left: hoveredPoint.x + 'px',
              top: hoveredPoint.y + 'px'
            }}
          >
            <div className={`tooltip-action ${hoveredPoint.decision.action.toLowerCase()}`}>
              {hoveredPoint.decision.action}
            </div>
            <div className="tooltip-time">
              {new Date(hoveredPoint.decision.timestamp).toLocaleTimeString()}
            </div>
            <div className="tooltip-date">
              {new Date(hoveredPoint.decision.timestamp).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
      
      {decisions.length > 0 && (
        <div className="chart-footer">
          <div className="chart-stats">
            <div className="stat-item">
              <span className="stat-label">Latest Decision:</span>
              <span className={`stat-value ${decisions[decisions.length - 1].action.toLowerCase()}`}>
                {decisions[decisions.length - 1].action}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Time:</span>
              <span className="stat-value">
                {new Date(decisions[decisions.length - 1].timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Decisions:</span>
              <span className="stat-value">{decisions.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AgentLogs = ({ agent, savedMonitoringData }) => {
  const [logs, setLogs] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const refreshIntervalRef = useRef(null);
  
  const { uid, walletAddress } = useAuth();
  
  // Parse logs to extract decisions
  const parseLogs = (logData) => {
    // Ensure logData is a string
    const logString = typeof logData === 'string' ? logData : 
                     Array.isArray(logData) ? logData.join('\n') : '';
    
    if (!logString) return { logs: [], decisions: [] };
    
    const lines = logString.split('\n');
    const parsedLogs = [];
    const parsedDecisions = [];
    
    lines.forEach((line) => {
      if (!line.trim()) return;
      
      if (line.includes('[AGENT EVALUATION]')) {
        const result = line.match(/Agent Based Analysis Result: (\w+)/);
        if (result) {
          const decision = result[1];
          const logEntry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `Agent evaluation: ${decision}`,
            type: 'evaluation'
          };
          parsedLogs.push(logEntry);
        }
      } else if (line.includes('[FINAL DECISION]')) {
        const result = line.match(/\[FINAL DECISION\] (\w+) at (.+)/);
        if (result) {
          const action = result[1];
          const timestamp = result[2];
          
          const logEntry = {
            id: Date.now() + Math.random(),
            timestamp: new Date(timestamp).toISOString(),
            level: 'info',
            message: `Final decision: ${action} at ${timestamp}`,
            type: 'decision'
          };
          parsedLogs.push(logEntry);
          
          // Add to decisions for chart
          parsedDecisions.push({
            action,
            timestamp: new Date(timestamp).toISOString()
          });
        }
      }
    });
    
    return { logs: parsedLogs, decisions: parsedDecisions };
  };
  
  const fetchLogs = async () => {
    if (!agent || !uid || !walletAddress) return;
    
    setLoading(true);
    try {
      const result = await fetchAgentLogs(uid, walletAddress);
      
      if (result.status === 'success' && result.logs) {
        const { logs: parsedLogs, decisions: parsedDecisions } = parseLogs(result.logs);
        setLogs(parsedLogs);
        setDecisions(parsedDecisions);
        setError(null);
      } else {
        setError('Failed to fetch logs: ' + (result.message || 'Unknown error'));
      }
    } catch (err) {
      setError('Failed to load agent logs. Please try again.');
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initialize with saved data if available
  useEffect(() => {
    if (savedMonitoringData) {
      setLogs(savedMonitoringData.logs || []);
      setDecisions(savedMonitoringData.decisions || []);
      setLoading(false);
    } else {
      fetchLogs();
    }
  }, [savedMonitoringData, agent, uid, walletAddress]);
  
  useEffect(() => {
    if (isAutoRefresh && !savedMonitoringData) {
      refreshIntervalRef.current = setInterval(() => {
        fetchLogs();
      }, 5000); // Refresh every 5 seconds
    } else if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isAutoRefresh, savedMonitoringData]);
  
  const getFilteredLogs = () => {
    return logs.filter(log => {
      const matchesFilter = filter === 'all' || 
        (filter === 'decisions' && log.type === 'decision') ||
        (filter === 'evaluations' && log.type === 'evaluation');
      
      const matchesSearch = !searchQuery || 
        log.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesFilter && matchesSearch;
    });
  };
  
  const handleExportLogs = () => {
    const logText = getFilteredLogs()
      .map(log => `[${new Date(log.timestamp).toLocaleString()}] ${log.message}`)
      .join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-${agent?.id || 'unknown'}-logs-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
      setLogs([]);
      setDecisions([]);
    }
  };
  
  const filteredLogs = getFilteredLogs();
  
  return (
    <div className="agent-logs">
      <div className="logs-header">
        <div className="logs-title">
          <BsTerminal />
          <h3>Agent Logs</h3>
        </div>
        
        <div className="logs-controls">
          <div className="log-filter">
            <BsFilter />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Logs</option>
              <option value="decisions">Decisions Only</option>
              <option value="evaluations">Evaluations Only</option>
            </select>
          </div>
          
          <div className="log-search">
            <BsSearch />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="search-input"
            />
          </div>
          
          <div className="logs-actions">
            <button 
              className={`refresh-toggle ${isAutoRefresh ? 'active' : ''}`}
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              title={isAutoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
              disabled={savedMonitoringData}
            >
              <BsArrowClockwise /> {isAutoRefresh ? 'Auto' : 'Manual'}
            </button>
            
            <button 
              className="export-btn"
              onClick={handleExportLogs}
              title="Export logs"
              disabled={filteredLogs.length === 0}
            >
              <BsDownload />
            </button>
            
            <button 
              className="clear-btn"
              onClick={handleClearLogs}
              title="Clear logs"
              disabled={logs.length === 0}
            >
              <BsTrash />
            </button>
          </div>
        </div>
      </div>
      
      {/* Decision Chart */}
      {decisions.length > 0 && (
        <DecisionChart decisions={decisions} />
      )}
      
      <div className="logs-container">
        {loading ? (
          <div className="logs-loading">
            <div className="spinner"></div>
            <p>Loading logs...</p>
          </div>
        ) : error ? (
          <div className="logs-error">
            <BsExclamationTriangle />
            <p>{error}</p>
            <button onClick={fetchLogs}>Try Again</button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="logs-empty">
            <BsInfoCircle />
            <p>No logs found {searchQuery ? 'matching your search' : ''}</p>
          </div>
        ) : (
          <div className="logs-list">
            {filteredLogs.map(log => (
              <div key={log.id} className={`log-entry ${log.level} ${log.type}`}>
                <div className="log-timestamp">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                <div className="log-level">{log.type.toUpperCase()}</div>
                <div className="log-message">{log.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="logs-footer">
        <div className="logs-stats">
          <span>Showing {filteredLogs.length} of {logs.length} logs</span>
          {searchQuery && <span> | Filtered by: "{searchQuery}"</span>}
          {savedMonitoringData && <span> | Saved monitoring data</span>}
        </div>
        
        <button 
          className="refresh-btn"
          onClick={fetchLogs}
          disabled={loading || savedMonitoringData}
        >
          <BsArrowClockwise /> {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};

export default AgentLogs;