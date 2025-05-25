 
// src/components/nodes/StartNode.jsx
import React from 'react';
import { Handle } from 'reactflow'; // Updated import
import { BsLightningCharge } from 'react-icons/bs';
import '../../styles/Nodes.css';

const StartNode = ({ data }) => {
  return (
    <div className="custom-node start-node">
      <div className="node-header">
        <BsLightningCharge className="node-icon" />
        <div className="node-title">Start</div>
      </div>
      <div className="node-content">
        <p>Workflow Entry Point</p>
      </div>
      <Handle
        type="source"
        position="right"
        id="start-out"
        style={{ background: 'var(--accent-primary)' }}
      />
    </div>
  );
};

export default StartNode;