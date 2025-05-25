 
// src/components/nodes/children/TokenNode.jsx
import React, { useState } from 'react';
import { BsCoin } from 'react-icons/bs';
import '../../styles/Nodes.css';

const TokenNode = ({ data }) => {
  const [maxTokens, setMaxTokens] = useState('2000');
  
  return (
    <div className="child-node token-child-node">
      <div className="child-node-header">
        <BsCoin className="node-icon" />
        <div className="node-title">Token Settings</div>
      </div>
      <div className="child-node-content">
        <div className="input-group">
          <label>Max Tokens</label>
          <input
            type="number"
            value={maxTokens}
            onChange={(e) => setMaxTokens(e.target.value)}
            placeholder="Enter max tokens"
          />
        </div>
      </div>
    </div>
  );
};

export default TokenNode;