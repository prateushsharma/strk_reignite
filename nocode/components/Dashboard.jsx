// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  BsRobot, 
  BsArrowLeft,
  BsSpeedometer2,
  BsCloudCheck,
  BsLightning,
  BsArrowsExpand,
  BsInfoCircle,
  BsTerminal,
  BsBarChart,
  BsGear
} from 'react-icons/bs';
import '../styles/Dashboard.css';

import { useAuth } from '../contexts/AuthContext';
import AgentDetail from './dashboard/AgentDetail';
import AgentLogs from './dashboard/AgentLogs';
import AgentMetrics from './dashboard/AgentMetrics';
import AgentSettings from './dashboard/AgentSettings';
import { fetchPairStatus, fetchAgentLogs } from '../services/agentDeploymentService';
import AgentPerformanceModal from './modals/AgentPerformanceModal';

const Dashboard = ({ onSwitchToBuilder }) => {
  const [selectedView, setSelectedView] = useState('detail'); // 'detail', 'logs', 'metrics', 'settings'
  const [agent, setAgent] = useState({
    id: 'agent-1',
    name: 'SUI Trading Agent',
    status: 'stopped',
    walletAddress: '',
    walletStatus: 'active'
  });
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [pairInfo, setPairInfo] = useState({ sui: 0, usdc: 0, currentPrice: 0 });
  const [agentLogs, setAgentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { uid, walletAddress } = useAuth();

  // Fetch pair status periodically
  useEffect(() => {
    const fetchPairInfo = async () => {
      try {
        setLoading(true);
        const result = await fetchPairStatus();
        if (result.status === 'success') {
          setPairInfo({
            sui: result.data.sui || 0, // Changed from sol to sui
            usdc: result.data.usdc || 0,
            currentPrice: result.data.currentPrice || 0
          });
        }
      } catch (error) {
        console.error('Error fetching pair info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPairInfo();
    const interval = setInterval(fetchPairInfo, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch agent logs periodically when agent is running
  useEffect(() => {
    if (agent.status !== 'running' || !uid || !walletAddress) return;

    const getLogs = async () => {
      try {
        const result = await fetchAgentLogs(uid, walletAddress);
        if (result.status === 'success' && result.logs) {
          // Convert logs string to array if it's not already
          const logsArray = typeof result.logs === 'string' 
            ? result.logs.split('\n').filter(log => log.trim() !== '')
            : result.logs;
            
          setAgentLogs(logsArray);
        }
      } catch (error) {
        console.error('Error fetching agent logs:', error);
      }
    };

    getLogs();
    const interval = setInterval(getLogs, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [agent.status, uid, walletAddress]);

  // Update agent with wallet address when available
  useEffect(() => {
    if (walletAddress) {
      setAgent(prev => ({ 
        ...prev, 
        walletAddress: walletAddress
      }));
    }
  }, [walletAddress]);

  const handleAgentStart = () => {
    setAgent(prev => ({ ...prev, status: 'running' }));
    // Show performance modal when agent starts
    setShowPerformanceModal(true);
  };

  const handleAgentStop = () => {
    setAgent(prev => ({ ...prev, status: 'stopped' }));
    setShowPerformanceModal(false);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <button className="back-btn" onClick={onSwitchToBuilder}>
          <BsArrowLeft /> Back to Flow Builder
        </button>
        <h1>DeFAI Agent Deployer</h1>
        <div className="status-indicators">
          <div className="status-item">
            <span className="status-label">SUI/USDC:</span>
            <span className="status-value">${pairInfo.currentPrice.toFixed(3)}</span>
          </div>
          <div className="status-item">
            <span className="status-label">SUI Balance:</span>
            <span className="status-value">{pairInfo.sui} SUI</span>
          </div>
          <div className="status-item">
            <span className="status-label">USDC Balance:</span>
            <span className="status-value">{pairInfo.usdc} USDC</span>
          </div>
          <div className="status-item">
            <span className="status-label">Agent:</span>
            <span className="status-value online">
              {agent.status === 'running' ? (
                <><span className="status-dot"></span> Running</>
              ) : (
                'Stopped'
              )}
            </span>
          </div>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="agent-detail-container">
          <div className="agent-detail-header">
            <div className="agent-header-info">
              <h2>{agent.name}</h2>
              <div className={`agent-header-status ${agent.status}`}>
                {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
              </div>
            </div>
            <div className="agent-detail-tabs">
              <button 
                className={`tab-btn ${selectedView === 'detail' ? 'active' : ''}`}
                onClick={() => setSelectedView('detail')}
              >
                <BsInfoCircle /> Overview
              </button>
              <button 
                className={`tab-btn ${selectedView === 'logs' ? 'active' : ''}`}
                onClick={() => setSelectedView('logs')}
              >
                <BsTerminal /> Logs
              </button>
              <button 
                className={`tab-btn ${selectedView === 'metrics' ? 'active' : ''}`}
                onClick={() => setSelectedView('metrics')}
              >
                <BsBarChart /> Metrics
              </button>
              <button 
                className={`tab-btn ${selectedView === 'settings' ? 'active' : ''}`}
                onClick={() => setSelectedView('settings')}
              >
                <BsGear /> Settings
              </button>
            </div>
          </div>
          
          <div className="agent-detail-content">
            {selectedView === 'detail' && (
              <AgentDetail 
                agent={agent} 
                onAgentStart={handleAgentStart}
                onAgentStop={handleAgentStop}
              />
            )}
            
            {selectedView === 'logs' && (
              <AgentLogs 
                agent={agent}
                logs={agentLogs}
              />
            )}
            
            {selectedView === 'metrics' && (
              <AgentMetrics agent={agent} />
            )}
            
            {selectedView === 'settings' && (
              <AgentSettings agent={agent} />
            )}
          </div>
        </div>
      </div>

      {/* Performance Modal - shown when agent is running */}
      {showPerformanceModal && (
        <AgentPerformanceModal
          isOpen={showPerformanceModal}
          onClose={() => setShowPerformanceModal(false)}
          agentLogs={agentLogs}
          tradingData={pairInfo}
        />
      )}
    </div>
  );
};

export default Dashboard;