// src/components/FlowCanvas.jsx
import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, { 
  Background, 
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from './nodes/nodeTypes';
import { 
  BsPlay, 
  BsSave, 
  BsTrash, 
  BsZoomIn, 
  BsZoomOut,
  BsArrowsFullscreen,
  BsCodeSlash,
  BsDownload,
  BsXLg,
  BsExclamationTriangle
} from 'react-icons/bs';
import '../styles/FlowCanvas.css';
import { useAgentStore } from '../store/agentStore';
import { useAuth } from '../contexts/AuthContext';
import { updateAgentConfiguration } from '../services/agentDeploymentService';

const FlowCanvas = ({ onDeploy }) => {
  // Initial flow state
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [flowName, setFlowName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportedJson, setExportedJson] = useState('');
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const { createAgent } = useAgentStore();
  const { uid, isAuthenticated, walletAddress } = useAuth();
  
  // Initialize React Flow
  const onInit = (instance) => {
    setReactFlowInstance(instance);
  };
  
  // Handle nodes changes (add, remove, position)
  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  // Handle edges changes (add, remove)
  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  // Handle new connections between nodes
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    }, eds));
  }, []);

  // Function to add a child node to an agent node - updated with correct handle IDs
  const onAddChildNode = useCallback((parentId, childType) => {
    // Find parent node
    const parentNode = nodes.find(node => node.id === parentId);
    if (!parentNode) return;
    
    // Get parent position
    const parentX = parentNode.position.x;
    const parentY = parentNode.position.y;
    const parentWidth = 500; // Width of agent node
    
    // Determine offset for child node based on type
    let offsetX = 0;
    if (childType === 'modelNode') offsetX = -parentWidth/3;
    else if (childType === 'memoryNode') offsetX = 0;
    else if (childType === 'toolNode') offsetX = parentWidth/3;
    
    // Calculate position for child node (directly below parent)
    const childX = parentX + offsetX;
    const childY = parentY + 250; // Position below the parent node
    
    // Create new child node
    const newChildNode = {
      id: `${childType}-${Date.now()}`,
      type: childType,
      position: { x: childX, y: childY },
      data: { 
        label: childType.replace('Node', ''),
        parentId: parentId
      },
    };
    
    // Create edge connecting parent to child with dashed line using correct handle IDs
    const newEdge = {
      id: `e-${parentId}-${newChildNode.id}`,
      source: parentId,
      sourceHandle: childType.replace('Node', '-out'), // Consistently use '-out' suffix
      target: newChildNode.id,
      targetHandle: childType.replace('Node', '-in'), 
      type: 'smoothstep',
      style: { 
        strokeWidth: 2, 
        stroke: '#5e72e4',
        strokeDasharray: '5,5' // Creates dashed line
      }
    };
    
    // Update nodes and edges
    setNodes((nds) => [...nds, newChildNode]);
    setEdges((eds) => [...eds, newEdge]);
  }, [nodes]);

  // Handle dropping new nodes onto the canvas
  const onDrop = useCallback((event) => {
    event.preventDefault();
    
    if (!reactFlowInstance) return;
    
    const nodeType = event.dataTransfer.getData('application/reactflow');
    
    if (!nodeType) return;

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    // Create a new node based on the dropped type
    const newNode = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position,
      data: { 
        label: nodeType.replace('Node', ''),
        onAddChildNode: nodeType === 'agentNode' ? onAddChildNode : undefined,
      },
    };

    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance, onAddChildNode]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Helper function to generate the export JSON
  const generateExportJson = () => {
    // Format nodes and extract their data
    const formattedNodes = nodes.map(node => {
      // Create a clean copy of the node data
      let nodeData = {};
      
      // Extract data based on node type with improved handling
      if (node.type === 'agentNode') {
        // For agent nodes, check for name and description
        if (node.data.name) nodeData.name = node.data.name;
        if (node.data.description) nodeData.description = node.data.description;
      } else if (node.type === 'strategyNode') {
        // For strategy nodes, get strategy text
        if (node.data.strategyText) nodeData.strategyText = node.data.strategyText;
      } else if (node.type === 'modelNode') {
        // For model nodes, get selected model and parent ID
        if (node.data.selectedModel) nodeData.model = node.data.selectedModel;
        if (node.data.parentId) nodeData.parentId = node.data.parentId;
      } else if (node.type === 'memoryNode') {
        // For memory nodes, get memory type and parent ID
        if (node.data.selectedType) nodeData.memoryType = node.data.selectedType;
        if (node.data.parentId) nodeData.parentId = node.data.parentId;
      } else if (node.type === 'toolNode') {
        // For tool nodes, get tool type, params, and parent ID
        if (node.data.selectedTool) nodeData.toolType = node.data.selectedTool;
        if (node.data.toolParams) nodeData.params = node.data.toolParams;
        if (node.data.parentId) nodeData.parentId = node.data.parentId;
      } else if (node.type === 'notificationNode') {
        // For notification nodes, get message
        if (node.data.message) nodeData.message = node.data.message;
      } else if (node.type === 'paymentNode') {
        // For payment nodes, get address and amount
        if (node.data.address) nodeData.address = node.data.address;
        if (node.data.amount) nodeData.amount = node.data.amount;
      } else {
        // For any other node type, include all data
        Object.keys(node.data).forEach(key => {
          // Skip internal properties like onAddChildNode
          if (key !== 'onAddChildNode' && key !== 'label') {
            nodeData[key] = node.data[key];
          }
        });
      }
      
      return {
        id: node.id,
        type: node.type,
        position: { x: node.position.x, y: node.position.y },
        data: nodeData
      };
    });
    
    // Format the edges with fixed handles
    const formattedEdges = edges.map(edge => {
      const edgeData = {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type
      };
      
      // Fix handle names if needed and add to edge data
      if (edge.sourceHandle) {
        // Make sure we're using consistent handles
        let sourceHandle = edge.sourceHandle;
        
        // Convert 'connect' to 'out' if needed
        if (sourceHandle === 'model-connect') sourceHandle = 'model-out';
        if (sourceHandle === 'memory-connect') sourceHandle = 'memory-out';
        if (sourceHandle === 'tool-connect') sourceHandle = 'tool-out';
        
        edgeData.sourceHandle = sourceHandle;
      }
      
      if (edge.targetHandle) {
        edgeData.targetHandle = edge.targetHandle;
      }
      
      // Add style if it exists
      if (edge.style) {
        edgeData.style = {};
        if (edge.style.strokeWidth) edgeData.style.strokeWidth = edge.style.strokeWidth;
        if (edge.style.stroke) edgeData.style.stroke = edge.style.stroke;
        if (edge.style.strokeDasharray) edgeData.style.strokeDasharray = edge.style.strokeDasharray;
      }
      
      return edgeData;
    });
    
    // Format the flow object
    const flowJson = {
      workflowId: "workflow-" + Date.now(),
      name: flowName || "SUI Trading Agent Workflow",
      description: "Automated trading workflow for SUI tokens",
      nodes: formattedNodes,
      edges: formattedEdges
    };
    
    return flowJson;
  };

  // Function to handle Phase 1 deployment (update/prepare agent configuration)
  const handleDeploy = async () => {
    // First, check if wallet is connected and UID is generated
    if (!isAuthenticated || !uid) {
      setShowAuthWarning(true);
      return;
    }
    
    // Check if there are nodes in the flow
    if (nodes.length === 0) {
      alert('Cannot deploy an empty flow. Please add some nodes first.');
      return;
    }
    
    // Check if there's an agent node
    const hasAgentNode = nodes.some(node => node.type === 'agentNode');
    if (!hasAgentNode) {
      alert('Your flow must include at least one Agent node to deploy.');
      return;
    }

    // Prompt for a name if not already set
    if (!flowName) {
      setShowNamePrompt(true);
      return;
    }
    
    // Start deployment process
    setIsDeploying(true);
    
    try {
      // Generate the flow JSON automatically
      const flowJson = generateExportJson();
      
      console.log('Starting Phase 1: Agent Update/Preparation');
      console.log('Flow data:', {
        flowName,
        uid,
        walletAddress,
        flowJson
      });
      
      // Call Phase 1: Update API
      const updateResult = await updateAgentConfiguration(uid, walletAddress, flowJson);
      
      console.log('Phase 1 Update result:', updateResult);
      
      if (updateResult.status === 'success') {
        // Create a new agent in the store with the update info
        await createAgent({
          name: flowName,
          flowData: flowJson,
          uid: uid,
          walletAddress: walletAddress,
          updateStatus: updateResult.update,
          phase1Complete: true,
          phase2Complete: false
        });
        
        // Show success and navigate to dashboard
        alert('Phase 1 Complete: Agent configuration updated. Navigate to dashboard to complete Phase 2 deployment.');
        
        setTimeout(() => {
          setIsDeploying(false);
          // Navigate to dashboard
          onDeploy();
        }, 1000);
      } else {
        // Handle update error
        const errorMessage = updateResult.message || 'Update failed';
        console.error('Phase 1 Update failed:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error in Phase 1 deployment:', error);
      alert(`Failed to update agent configuration: ${error.message}`);
      setIsDeploying(false);
    }
  };

  // Handle saving the flow
  const handleSave = () => {
    if (nodes.length === 0) {
      alert('There is nothing to save. Please add some nodes first.');
      return;
    }
    
    // If no name is set, prompt for one
    if (!flowName) {
      setShowNamePrompt(true);
      return;
    }
    
    // Save flow to localStorage
    const flow = { nodes, edges, name: flowName };
    const savedFlows = JSON.parse(localStorage.getItem('savedFlows') || '[]');
    
    // Check if a flow with this name already exists
    const existingIndex = savedFlows.findIndex(f => f.name === flowName);
    
    if (existingIndex >= 0) {
      // Update existing flow
      savedFlows[existingIndex] = flow;
    } else {
      // Add new flow
      savedFlows.push(flow);
    }
    
    localStorage.setItem('savedFlows', JSON.stringify(savedFlows));
    alert('Flow saved successfully!');
  };

  // Handle clearing the canvas
  const handleClear = () => {
    if (nodes.length === 0) return;
    
    if (window.confirm('Are you sure you want to clear the canvas? All unsaved work will be lost.')) {
      setNodes([]);
      setEdges([]);
      setFlowName('');
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
    }
  };

  const handleFitView = () => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView();
    }
  };

  // Export flow as JSON - Updated to use helper function
  const handleExportFlow = () => {
    if (!nodes.length) {
      alert('No flow to export. Please add some nodes first.');
      return;
    }

    // Use the helper function to generate JSON
    const flowJson = generateExportJson();
    
    // Generate the JSON string with pretty formatting
    const jsonString = JSON.stringify(flowJson, null, 2);
    setExportedJson(jsonString);
    setShowExportModal(true);
  };

  // Download the JSON file
  const handleDownloadJson = () => {
    const blob = new Blob([exportedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Use flow name if available, otherwise use a default name
    const fileName = flowName 
      ? `${flowName.replace(/\s+/g, '-').toLowerCase()}.json` 
      : 'trading-workflow.json';
      
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flow-canvas" ref={reactFlowWrapper}>
      {showNamePrompt && (
        <div className="name-prompt-overlay">
          <div className="name-prompt">
            <h3>Name Your Flow</h3>
            <input
              type="text"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              placeholder="Enter a name for your flow"
            />
            <div className="name-prompt-buttons">
              <button 
                onClick={() => setShowNamePrompt(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (flowName.trim() === '') {
                    alert('Please enter a valid name.');
                    return;
                  }
                  setShowNamePrompt(false);
                }}
                className="save-btn"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flow-toolbar">
        <div className="flow-name">
          {flowName ? (
            <span>{flowName}</span>
          ) : (
            <button onClick={() => setShowNamePrompt(true)}>Name Flow</button>
          )}
        </div>
        <div className="tool-buttons">
          <button onClick={handleSave} title="Save Flow">
            <BsSave /> Save
          </button>
          <button onClick={handleClear} title="Clear Canvas">
            <BsTrash /> Clear
          </button>
          <button onClick={handleZoomIn} title="Zoom In">
            <BsZoomIn />
          </button>
          <button onClick={handleZoomOut} title="Zoom Out">
            <BsZoomOut />
          </button>
          <button onClick={handleFitView} title="Fit View">
            <BsArrowsFullscreen />
          </button>
          <button 
            onClick={handleExportFlow}
            title="Export to JSON"
            className="export-btn"
          >
            <BsCodeSlash /> Export JSON
          </button>
          <button 
            className="deploy-btn"
            onClick={handleDeploy}
            disabled={isDeploying}
            title="Deploy Flow"
          >
            {isDeploying ? (
              <span className="deploying">Deploying...</span>
            ) : (
              <>
                <BsPlay /> Deploy
              </>
            )}
          </button>
        </div>
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        onDrop={onDrop}
        onDragOver={onDragOver}
        deleteKeyCode="Delete"
        snapToGrid={true}
        snapGrid={[15, 15]}
        fitView
      >
        <Background color="#444" gap={16} variant="dots" />
        <Controls />
        <MiniMap
          nodeStrokeColor="#555"
          nodeColor="#333"
          nodeBorderRadius={2}
        />
      </ReactFlow>

      {/* Authentication Warning Modal */}
      {showAuthWarning && (
        <div className="export-modal-overlay">
          <div className="export-modal auth-warning-modal">
            <div className="export-modal-header">
              <h3>Authentication Required</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setShowAuthWarning(false)}
              >
                <BsXLg />
              </button>
            </div>
            <div className="export-modal-content">
              <div className="auth-warning-content">
                <BsExclamationTriangle className="warning-icon" />
                <div className="warning-message">
                  <h4>Wallet Connection Required</h4>
                  <p>You need to connect your wallet and generate a UID to deploy your agent.</p>
                  <p>Please connect your wallet using the button in the top-right corner.</p>
                </div>
              </div>
            </div>
            <div className="export-modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowAuthWarning(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export JSON Modal */}
      {showExportModal && (
        <div className="export-modal-overlay">
          <div className="export-modal">
            <div className="export-modal-header">
              <h3>Workflow JSON</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setShowExportModal(false)}
              >
                <BsXLg />
              </button>
            </div>
            <div className="export-modal-content">
              <div className="json-container">
                <pre>{exportedJson}</pre>
              </div>
            </div>
            <div className="export-modal-footer">
              <button 
                className="download-json-btn"
                onClick={handleDownloadJson}
              >
                <BsDownload /> Download JSON
              </button>
              <button 
                className="copy-json-btn"
                onClick={() => {
                  navigator.clipboard.writeText(exportedJson);
                  alert('JSON copied to clipboard!');
                }}
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowCanvas;