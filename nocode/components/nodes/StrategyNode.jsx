 
// src/components/nodes/StrategyNode.jsx
import React, { useState, useEffect } from 'react';
import { Handle } from 'reactflow';
import { BsLightbulb } from 'react-icons/bs';
import '../../styles/Nodes.css';

const StrategyNode = ({ data, id }) => {
  const [strategyText, setStrategyText] = useState(data.strategyText || '');
  
  // Update the node data when input values change
  useEffect(() => {
    data.strategyText = strategyText;
    
    // Log to ensure data is being updated
    console.log('Strategy data updated:', data);
  }, [strategyText, data]);
  
  return (
    <div className="custom-node strategy-node">
      <Handle
        type="target"
        position="left"
        id="strategy-in"
        style={{ background: 'var(--accent-primary)' }}
      />
      <div className="node-header">
        <BsLightbulb className="node-icon" />
        <div className="node-title">Strategy</div>
      </div>
      <div className="node-content">
        <div className="input-group">
          <label>Trading Strategy</label>
          <textarea
            value={strategyText}
            onChange={(e) => setStrategyText(e.target.value)}
            placeholder="Enter trading strategy instructions..."
            rows={4}
          />
        </div>
      </div>
      <Handle
        type="source"
        position="right"
        id="strategy-out"
        style={{ background: 'var(--accent-primary)' }}
      />
    </div>
  );
};

export default StrategyNode;