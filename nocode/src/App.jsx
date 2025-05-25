// src/App.jsx
import React, { useState } from 'react';
import FlowCanvas from './components/FlowCanvas';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import { BsRobot, BsDiagram3 } from 'react-icons/bs';
import WalletConnector from './components/WalletConnector';
import { AuthProvider } from './contexts/AuthContext';
import './styles/App.css';

function App() {
  const [view, setView] = useState('flowBuilder'); // 'flowBuilder' or 'dashboard'
  const [showLanding, setShowLanding] = useState(true);
  
  // Function to enter the main app from landing page
  const handleEnterApp = () => {
    setShowLanding(false);
  };
  
  // If showing landing page, return that
  if (showLanding) {
    return <LandingPage onEnterApp={handleEnterApp} />;
  }
  
  return (
    <AuthProvider>
      <div className="app">
        <div className="app-header">
          <div className="app-title">DeFAI Agent Deployer ⚡</div>
          
          {/* Custom wallet connection with UID display */}
          <div className="wallet-connection">
            <WalletConnector />
          </div>
          
          <div className="view-switcher">
            <button 
              className={`view-btn ${view === 'flowBuilder' ? 'active' : ''}`}
              onClick={() => setView('flowBuilder')}
            >
              <BsDiagram3 /> Flow Builder
            </button>
            <button 
              className={`view-btn ${view === 'dashboard' ? 'active' : ''}`}
              onClick={() => setView('dashboard')}
            >
              <BsRobot /> Dashboard
            </button>
          </div>
        </div>
        
        <div className="app-container">
          {view === 'flowBuilder' ? (
            <>
              <Sidebar />
              <FlowCanvas onDeploy={() => setView('dashboard')} />
            </>
          ) : (
            <Dashboard onSwitchToBuilder={() => setView('flowBuilder')} />
          )}
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;