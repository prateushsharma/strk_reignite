 
// src/components/nodes/ModelNode.jsx
import React, { useState } from 'react';
import { Handle } from 'reactflow';
import { BsCpu } from 'react-icons/bs';
import '../../styles/Nodes.css';

const ModelNode = ({ data, id }) => {
  const models = [
    { id: 'claude', name: 'Anthropic Claude' },
    { id: 'gpt4', name: 'OpenAI GPT-4' },
    { id: 'llama', name: 'Meta Llama 3' },
    { id: 'gemini', name: 'Google Gemini' },
    { id: 'Groq', name: 'Groq'}
  ];
  
  const [selectedModel, setSelectedModel] = useState(data.selectedModel || '');
  
  // Direct update to ensure data is captured
  const handleModelChange = (e) => {
    const model = e.target.value;
    setSelectedModel(model);
    data.selectedModel = model; // Update data directly
    
    // Log to confirm data is updated
    console.log('Updated model data:', data);
  };
  
  return (
    <div className="custom-node model-node" data-id={id}>
      <Handle
        type="target"
        position="left"
        id="model-in"
        style={{ background: 'var(--accent-primary)' }}
      />
      <div className="node-header">
        <BsCpu className="node-icon" />
        <div className="node-title">Chat Model</div>
      </div>
      <div className="node-content">
        <div className="input-group">
          <label>AI Model</label>
          <select
            value={selectedModel}
            onChange={handleModelChange}
            className="select-input"
          >
            <option value="">Select a model</option>
            {models.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Handle
        type="source"
        position="right"
        id="model-out"
        style={{ background: 'var(--accent-primary)' }}
      />
    </div>
  );
};

export default ModelNode;