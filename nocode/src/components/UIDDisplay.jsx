// src/components/UIDDisplay.jsx
import React from 'react';
import { BsHash, BsShieldCheck } from 'react-icons/bs';
import { useAuth } from '../contexts/AuthContext';
import '../styles/UIDDisplay.css';

const UIDDisplay = () => {
  const { uid, isLoading, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="uid-display-container not-connected">
        <div className="uid-display-icon">
          <BsHash />
        </div>
        <div className="uid-display-content">
          <div className="uid-display-title">No UID Available</div>
          <div className="uid-display-message">Connect wallet to generate UID</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="uid-display-container loading">
        <div className="uid-display-icon pulsing">
          <BsHash />
        </div>
        <div className="uid-display-content">
          <div className="uid-display-title">Generating UID...</div>
          <div className="uid-display-message">Please wait</div>
        </div>
      </div>
    );
  }

  return (
    <div className="uid-display-container active">
      <div className="uid-display-icon">
        <BsShieldCheck />
      </div>
      <div className="uid-display-content">
        <div className="uid-display-title">Agent UID</div>
        <div className="uid-display-value">{uid}</div>
      </div>
    </div>
  );
};

export default UIDDisplay;