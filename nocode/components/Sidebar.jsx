// src/components/Sidebar.jsx
import React from 'react';
import '../styles/Sidebar.css';
import { 
  BsLightningCharge, 
  BsCreditCard2Front, 
  BsBell, 
  BsRobot,
  BsCpu,
  BsDatabase,
  BsTools,
  BsLightbulb
} from 'react-icons/bs';
import { FaTelegram } from 'react-icons/fa'; // Add Telegram icon

const Sidebar = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Sui Flow Nodes</h3>
      </div>
      <div className="sidebar-nodes">
        <div 
          className="node node-start" 
          onDragStart={(event) => onDragStart(event, 'startNode')}
          draggable
        >
          <BsLightningCharge className="node-icon" />
          <div className="node-label">Start</div>
        </div>
        <div 
          className="node node-agent" 
          onDragStart={(event) => onDragStart(event, 'agentNode')}
          draggable
        >
          <BsRobot className="node-icon" />
          <div className="node-label">Agent</div>
        </div>
        <div 
          className="node node-model" 
          onDragStart={(event) => onDragStart(event, 'modelNode')}
          draggable
        >
          <BsCpu className="node-icon" />
          <div className="node-label">Chat Model</div>
        </div>
        <div 
          className="node node-memory" 
          onDragStart={(event) => onDragStart(event, 'memoryNode')}
          draggable
        >
          <BsDatabase className="node-icon" />
          <div className="node-label">Memory</div>
        </div>
        <div 
          className="node node-tool" 
          onDragStart={(event) => onDragStart(event, 'toolNode')}
          draggable
        >
          <BsTools className="node-icon" />
          <div className="node-label">Tool</div>
        </div>
        <div 
          className="node node-payment" 
          onDragStart={(event) => onDragStart(event, 'paymentNode')}
          draggable
        >
          <BsCreditCard2Front className="node-icon" />
          <div className="node-label">Payment</div>
        </div>
        <div 
          className="node node-notification" 
          onDragStart={(event) => onDragStart(event, 'notificationNode')}
          draggable
        >
          <BsBell className="node-icon" />
          <div className="node-label">Notification</div>
        </div>
        <div 
          className="node node-telegram" 
          onDragStart={(event) => onDragStart(event, 'telegramNode')}
          draggable
        >
          <FaTelegram className="node-icon" />
          <div className="node-label">Telegram</div>
        </div>
        <div 
          className="node node-strategy" 
          onDragStart={(event) => onDragStart(event, 'strategyNode')}
          draggable
        >
          <BsLightbulb className="node-icon" />
          <div className="node-label">Strategy</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;