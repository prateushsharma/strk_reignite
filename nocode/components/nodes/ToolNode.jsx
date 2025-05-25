// src/components/nodes/ToolNode.jsx
import React, { useState } from 'react';
import { Handle } from 'reactflow';
import { BsTools } from 'react-icons/bs';
import '../../styles/Nodes.css';

const ToolNode = ({ data }) => {
  const tools = [
    { id: 'microsoft', name: 'Microsoft Entra ID' },
    { id: 'jira', name: 'Jira Software' },
    { id: 'slack', name: 'Slack' },
    { id: 'github', name: 'GitHub' }
  ];
  
  const [selectedTool, setSelectedTool] = useState('');
  const [toolParams, setToolParams] = useState('');
  
  return (
    <div className="custom-node tool-node">
      <Handle
        type="target"
        position="left"
        id="tool-in"
        style={{ background: 'var(--accent-primary)' }}
      />
      <div className="node-header">
        <BsTools className="node-icon" />
        <div className="node-title">Tool</div>
      </div>
      <div className="node-content">
        <div className="input-group">
          <label>Tool Type</label>
          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            className="select-input"
          >
            <option value="">Select a tool</option>
            {tools.map(tool => (
              <option key={tool.id} value={tool.id}>
                {tool.name}
              </option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label>Parameters</label>
          <input
            type="text"
            value={toolParams}
            onChange={(e) => setToolParams(e.target.value)}
            placeholder="Tool parameters"
          />
        </div>
      </div>
      <Handle
        type="source"
        position="right"
        id="tool-out"
        style={{ background: 'var(--accent-primary)' }}
      />
    </div>
  );
};

export default ToolNode;