 
// src/components/nodes/NotificationNode.jsx
import React, { useState } from 'react';
import { Handle } from 'reactflow';
import { BsBell } from 'react-icons/bs';
import '../../styles/Nodes.css';

const NotificationNode = ({ data }) => {
  const [message, setMessage] = useState('');

  return (
    <div className="custom-node notification-node">
      <Handle
        type="target"
        position="left"
        id="notification-in"
        style={{ background: 'var(--accent-primary)' }}
      />
      <div className="node-header">
        <BsBell className="node-icon" />
        <div className="node-title">Notification</div>
      </div>
      <div className="node-content">
        <div className="input-group">
          <label>Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter notification message"
            rows={3}
          />
        </div>
      </div>
      <Handle
        type="source"
        position="right"
        id="notification-out"
        style={{ background: 'var(--accent-primary)' }}
      />
    </div>
  );
};

export default NotificationNode;