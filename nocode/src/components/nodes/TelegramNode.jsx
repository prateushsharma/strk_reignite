// src/components/nodes/TelegramNode.jsx
import React from 'react';
import { Handle } from 'reactflow';
import { FaTelegram } from 'react-icons/fa';
import '../../styles/Nodes.css';

const TelegramNode = ({ data }) => {
  return (
    <div className="telegram-node-circular">
      <Handle
        type="target"
        position="left"
        id="telegram-in"
        style={{ background: '#0088cc' }}
      />
      <div className="telegram-icon-container">
        <FaTelegram className="telegram-icon" />
      </div>
      <Handle
        type="source"
        position="right"
        id="telegram-out"
        style={{ background: '#0088cc' }}
      />
    </div>
  );
};

export default TelegramNode;