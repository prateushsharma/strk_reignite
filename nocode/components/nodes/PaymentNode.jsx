// src/components/nodes/PaymentNode.jsx
import React, { useState } from 'react';
import { Handle } from 'reactflow'; // Updated import
import { BsCreditCard2Front } from 'react-icons/bs';
import '../../styles/Nodes.css';

const PaymentNode = ({ data }) => {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');

  return (
    <div className="custom-node payment-node">
      <Handle
        type="target"
        position="left"
        id="payment-in"
        style={{ background: 'var(--accent-primary)' }}
      />
      <div className="node-header">
        <BsCreditCard2Front className="node-icon" />
        <div className="node-title">Payment</div>
      </div>
      <div className="node-content">
        <div className="input-group">
          <label>Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter Sui address"
          />
        </div>
        <div className="input-group">
          <label>Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>
      </div>
      <Handle
        type="source"
        position="right"
        id="payment-out"
        style={{ background: 'var(--accent-primary)' }}
      />
    </div>
  );
};

export default PaymentNode;