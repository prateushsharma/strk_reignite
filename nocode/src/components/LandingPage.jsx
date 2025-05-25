// src/components/LandingPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  BsRobot, 
  BsLightning, 
  BsCodeSlash, 
  BsDatabase, 
  BsCpu, 
  BsArrowRight,
  BsWallet2,
  BsDiagram3,
  BsFillPlayFill,
  BsArrowsFullscreen,
  BsGear,
  BsShieldCheck,
  BsBraces
} from 'react-icons/bs';
import '../styles/LandingPage.css';

const LandingPage = ({ onEnterApp }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [touchRipples, setTouchRipples] = useState([]);
  const nextRippleId = useRef(0);
  
  const gridRef = useRef(null);
  const containerRef = useRef(null);
  
  // Handle mouse movement for interactive effects
  const handleMouseMove = (e) => {
    setMousePosition({
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight
    });
  };
  
  // Initialize grid background
  useEffect(() => {
    if (gridRef.current) {
      const canvas = gridRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas to full screen
      const setCanvasDimensions = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      
      setCanvasDimensions();
      window.addEventListener('resize', setCanvasDimensions);
      
      // Draw grid
      const drawGrid = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set colors for grid and glow
        const gridColor = 'rgba(94, 114, 228, 0.15)';
        const gridSpacing = 50;
        
        // Calculate grid offset based on mouse position for subtle movement
        const offsetX = (mousePosition.x - 0.5) * 10;
        const offsetY = (mousePosition.y - 0.5) * 10;
        
        ctx.beginPath();
        
        // Draw vertical lines
        for (let x = offsetX % gridSpacing; x < canvas.width; x += gridSpacing) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
        }
        
        // Draw horizontal lines
        for (let y = offsetY % gridSpacing; y < canvas.height; y += gridSpacing) {
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
        }
        
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        // Draw glowing nodes at intersections
        for (let x = offsetX % gridSpacing; x < canvas.width; x += gridSpacing) {
          for (let y = offsetY % gridSpacing; y < canvas.height; y += gridSpacing) {
            // Only draw some nodes for performance and design
            if (Math.random() > 0.85) {
              const size = Math.random() * 2 + 1;
              
              // Create radial gradient for glow effect
              const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 6);
              glow.addColorStop(0, 'rgba(94, 114, 228, 0.8)');
              glow.addColorStop(1, 'rgba(94, 114, 228, 0)');
              
              ctx.beginPath();
              ctx.arc(x, y, size, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(94, 114, 228, 0.8)';
              ctx.fill();
              
              // Draw glow
              ctx.beginPath();
              ctx.arc(x, y, size * 6, 0, Math.PI * 2);
              ctx.fillStyle = glow;
              ctx.fill();
            }
          }
        }
        
        requestAnimationFrame(drawGrid);
      };
      
      drawGrid();
      
      return () => {
        window.removeEventListener('resize', setCanvasDimensions);
      };
    }
  }, [mousePosition]);
  
  // Handle touch ripple animations
  useEffect(() => {
    // Clean up ripples after animation
    const timer = setTimeout(() => {
      if (touchRipples.length > 0) {
        setTouchRipples(ripples => ripples.filter(r => Date.now() - r.time < 1000));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [touchRipples]);
  
  // Handle touch/click for ripple effect
  const handleTouch = (e) => {
    if (!containerRef.current) return;
    
    // Get position relative to container
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Create a new ripple
    const newRipple = {
      id: nextRippleId.current,
      x,
      y,
      time: Date.now()
    };
    
    // Increment ID for next ripple
    nextRippleId.current += 1;
    
    // Add to ripples state
    setTouchRipples(ripples => [...ripples, newRipple]);
    
    // Also trigger particle effect
    createParticles(x, y);
  };
  
  // Create particle effects
  const createParticles = (x, y) => {
    const particleContainer = document.getElementById('particle-container');
    if (!particleContainer) return;

    // Create particles
    for (let i = 0; i < 10; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      // Random position within 10px of touch point
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;
      
      particle.style.left = `${x + offsetX}px`;
      particle.style.top = `${y + offsetY}px`;
      
      // Random color from blue to cyan gradient
      const hue = Math.floor(Math.random() * 40) + 210; // 210-250 (blue to cyan)
      particle.style.background = `hsl(${hue}, 100%, 70%)`;
      
      // Random size
      const size = Math.random() * 4 + 2;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Random animation duration
      const duration = Math.random() * 2 + 1;
      particle.style.animation = `particle-float ${duration}s ease-out forwards`;
      
      // Add to container
      particleContainer.appendChild(particle);
      
      // Remove after animation
      setTimeout(() => {
        if (particle.parentNode === particleContainer) {
          particleContainer.removeChild(particle);
        }
      }, duration * 1000);
    }
  };
  
  // Calculate the parallax transform based on mouse position
  const getParallaxTransform = (depth = 1) => {
    const moveFactor = 25 * depth;
    const x = (mousePosition.x - 0.5) * moveFactor;
    const y = (mousePosition.y - 0.5) * moveFactor;
    return `translate(${x}px, ${y}px)`;
  };

  // Video Animation Component
  const VideoAnimation = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const animationRef = useRef(null);
    const steps = [
      { name: "Design", description: "Building workflow with drag-and-drop" },
      { name: "Compile", description: "Converting to executable code" },
      { name: "MCP Init", description: "Initializing Model Context Protocol" },
      { name: "Deploy", description: "Deploying to SUI blockchain" },
      { name: "Running", description: "Agent running with MCP integration" }
    ];
    
    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }, 3000);
      
      return () => clearInterval(interval);
    }, [steps.length]);
    
    return (
      <div className="center-video-animation" ref={animationRef}>
        <div className="animation-progress-bar">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`progress-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            >
              <div className="step-indicator">{index + 1}</div>
              <div className="step-label">{step.name}</div>
            </div>
          ))}
        </div>
        
        <div className="animation-screen">
          <div className="animation-content">
            {currentStep === 0 && (
              <div className="animation-scene design-scene">
                <div className="canvas-area">
                  <div className="dragged-node node-start">
                    <div className="node-icon"><BsLightning /></div>
                    <div className="node-label">Start</div>
                  </div>
                  <div className="dragged-node node-agent">
                    <div className="node-icon"><BsRobot /></div>
                    <div className="node-label">Agent</div>
                  </div>
                  <div className="dragging-node node-mcp">
                    <div className="node-icon">MCP</div>
                    <div className="node-label">Context</div>
                  </div>
                  <div className="connection-line"></div>
                  <div className="drag-indicator"></div>
                </div>
                <div className="sidebar-preview">
                  <div className="sidebar-node"><BsLightning /> Start</div>
                  <div className="sidebar-node"><BsRobot /> Agent</div>
                  <div className="sidebar-node active"><div className="mcp-text">MCP</div> Context</div>
                  <div className="sidebar-node"><BsDatabase /> Memory</div>
                </div>
              </div>
            )}
            
            {currentStep === 1 && (
              <div className="animation-scene compile-scene">
                <div className="compile-view">
                  <div className="visual-flow">
                    <div className="flow-node node-1"></div>
                    <div className="flow-edge edge-1"></div>
                    <div className="flow-node node-2"></div>
                    <div className="flow-edge edge-2"></div>
                    <div className="flow-node node-3"></div>
                  </div>
                  <div className="compile-arrow">
                    <BsArrowRight className="arrow-icon" />
                  </div>
                  <div className="code-view">
                    <div className="code-line-wrapper">
                      <div className="code-line code-1"></div>
                      <div className="code-line code-2"></div>
                      <div className="code-line code-3"></div>
                      <div className="code-line code-4"></div>
                      <div className="code-line code-5"></div>
                      <div className="code-line code-6"></div>
                      <div className="code-line code-7"></div>
                      <div className="code-line code-8"></div>
                    </div>
                  </div>
                </div>
                <div className="compile-status">Compiling visual workflow to MCP-compatible code...</div>
              </div>
            )}
            
            {currentStep === 2 && (
              <div className="animation-scene mcp-scene">
                <div className="mcp-initialization">
                  <div className="mcp-logo">MCP</div>
                  <div className="mcp-pulse-ring ring-1"></div>
                  <div className="mcp-pulse-ring ring-2"></div>
                  <div className="mcp-pulse-ring ring-3"></div>
                  <div className="connection-points">
                    <div className="connection-point point-1"></div>
                    <div className="connection-point point-2"></div>
                    <div className="connection-point point-3"></div>
                    <div className="connection-line line-1"></div>
                    <div className="connection-line line-2"></div>
                    <div className="connection-line line-3"></div>
                  </div>
                </div>
                <div className="mcp-status">
                  <div className="status-line">
                    <span className="status-label">MCP Status:</span>
                    <span className="status-value initializing">Initializing</span>
                  </div>
                  <div className="status-line">
                    <span className="status-label">Context Size:</span>
                    <span className="status-value">4,096 tokens</span>
                  </div>
                  <div className="status-line">
                    <span className="status-label">Memory:</span>
                    <span className="status-value">Redis Integration Ready</span>
                  </div>
                  <div className="status-line">
                    <span className="status-label">Model:</span>
                    <span className="status-value">Claude 3.5 Ready</span>
                  </div>
                </div>
              </div>
            )}
            
            {currentStep === 3 && (
              <div className="animation-scene deploy-scene">
                <div className="deploy-visualization">
                  <div className="package-container">
                    <div className="agent-package">
                      <div className="package-icon"><BsRobot /></div>
                      <div className="package-name">DeFAI Agent</div>
                    </div>
                    <div className="package-rocket">🚀</div>
                  </div>
                  <div className="blockchain-representation">
                    <div className="blockchain-header">SUI BLOCKCHAIN</div>
                    <div className="blockchain-blocks">
                      <div className="block block-1"></div>
                      <div className="block block-2"></div>
                      <div className="block block-3"></div>
                      <div className="block block-4"></div>
                      <div className="block block-5"></div>
                      <div className="block block-highlight"></div>
                      <div className="block block-6"></div>
                    </div>
                  </div>
                </div>
                <div className="deploy-logs">
                  <div className="log-line">Creating agent wallet...</div>
                  <div className="log-line">Initializing MCP connection...</div>
                  <div className="log-line">Preparing deployment package...</div>
                  <div className="log-line current">Deploying to SUI blockchain...</div>
                </div>
              </div>
            )}
            
            {currentStep === 4 && (
              <div className="animation-scene running-scene">
                <div className="agent-running">
                  <div className="agent-avatar">
                    <BsRobot className="avatar-icon" />
                    <div className="status-dot"></div>
                  </div>
                  <div className="agent-stats">
                    <div className="stats-header">DeFAI Agent (Active)</div>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <div className="stat-icon"><BsCpu /></div>
                        <div className="stat-details">
                          <div className="stat-label">MCP Latency</div>
                          <div className="stat-value">120ms</div>
                        </div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-icon"><BsDatabase /></div>
                        <div className="stat-details">
                          <div className="stat-label">Memory Usage</div>
                          <div className="stat-value">2.4GB</div>
                        </div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-icon"><BsWallet2 /></div>
                        <div className="stat-details">
                          <div className="stat-label">SUI Balance</div>
                          <div className="stat-value">12.5 SUI</div>
                        </div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-icon"><BsArrowsFullscreen /></div>
                        <div className="stat-details">
                          <div className="stat-label">Transactions</div>
                          <div className="stat-value">24</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="realtime-activity">
                  <div className="activity-header">
                    <div className="activity-title">Realtime Activity</div>
                    <div className="activity-indicator">
                      <div className="pulse-dot"></div>
                      <span>Live</span>
                    </div>
                  </div>
                  <div className="activity-feed">
                    <div className="activity-item">
                      <div className="activity-time">Now</div>
                      <div className="activity-content">MCP context updated</div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-time">30s ago</div>
                      <div className="activity-content">Model inference complete</div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-time">1m ago</div>
                      <div className="activity-content">SUI transaction confirmed</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="animation-caption">
          <div className="caption-step">{steps[currentStep].name}</div>
          <div className="caption-description">{steps[currentStep].description}</div>
        </div>
      </div>
    );
  };
  
  return (
    <div 
      className="landing-page-container"
      onMouseMove={handleMouseMove}
      onClick={handleTouch}
      ref={containerRef}
    >
      {/* Grid background */}
      <canvas 
        ref={gridRef}
        className="grid-background"
      />
      
      {/* Particle container */}
      <div id="particle-container"></div>
      
      {/* Touch ripples */}
      {touchRipples.map(ripple => (
        <div
          key={ripple.id}
          className="touch-ripple"
          style={{
            left: ripple.x,
            top: ripple.y
          }}
        />
      ))}
      
      {/* Gradient overlays */}
      <div className="gradient-overlay top-left"></div>
      <div className="gradient-overlay bottom-right"></div>
      
      {/* 3D Floating elements */}
      <div className="floating-objects">
        <div className="floating-object object-1" style={{ transform: getParallaxTransform(2) }}>
          <div className="object-content">
            <BsRobot />
          </div>
        </div>
        
        <div className="floating-object object-2" style={{ transform: getParallaxTransform(1.5) }}>
          <div className="object-content">
            <BsCodeSlash />
          </div>
        </div>
        
        <div className="floating-object object-3" style={{ transform: getParallaxTransform(2.2) }}>
          <div className="object-content">
            <BsDiagram3 />
          </div>
        </div>
        
        <div className="floating-object object-4" style={{ transform: getParallaxTransform(1.8) }}>
          <div className="object-content">
            <BsLightning />
          </div>
        </div>
        
        <div className="floating-object object-5" style={{ transform: getParallaxTransform(1.3) }}>
          <div className="object-content">
            <BsDatabase />
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="landing-content" style={{ transform: getParallaxTransform(0.3) }}>
        <div className="branded-logo">
          <div className="logo-icon">
            <BsRobot />
          </div>
          <h1>DeZeroFAI</h1>
        </div>
        
        <h2 className="tagline">Build and Deploy AI Agents on SUI Blockchain</h2>
        
        <p className="description">
          Create, deploy, and manage autonomous AI agents with a visual no-code interface that leverages <span className="highlight">Model Context Protocol (MCP)</span> for secure and efficient execution on the SUI blockchain
        </p>
        
        <div className="cta-buttons">
          {/* Simple Let's Go button that takes user to the main app */}
          <button 
            className="lets-go-btn primary-btn"
            onClick={onEnterApp}
          >
            <BsLightning />
            <span>Let's Go</span>
            <BsArrowRight className="arrow-icon" />
          </button>
        </div>
      </div>
      
      {/* Center Video Animation */}
      <div className="center-video-container glassmorphism">
        <VideoAnimation />
      </div>
      
      <div className="feature-cards">
        <div className="feature-card card-3d">
          <div className="feature-icon blue">
            <BsCodeSlash />
          </div>
          <h3>No-Code Builder</h3>
          <p>Build complex AI workflows with an intuitive drag-and-drop interface</p>
        </div>
        
        <div className="feature-card card-3d">
          <div className="feature-icon purple">
            <BsRobot />
          </div>
          <h3>AI Agents</h3>
          <p>Deploy autonomous agents powered by leading language models</p>
        </div>
        
        <div className="feature-card card-3d">
          <div className="feature-icon cyan">
            <BsBraces />
          </div>
          <h3>Model Context Protocol</h3>
          <p>Leverage the power of MCP for efficient, secure, and chainable AI model execution</p>
        </div>
        
        <div className="feature-card card-3d">
          <div className="feature-icon yellow">
            <BsLightning />
          </div>
          <h3>SUI Blockchain</h3>
          <p>Security and transparency with decentralized infrastructure</p>
        </div>
        
        <div className="feature-card card-3d">
          <div className="feature-icon green">
            <BsArrowsFullscreen />
          </div>
          <h3>Scalable</h3>
          <p>Scale from a single agent to a network of coordinated AI systems</p>
        </div>
      </div>
      
      {/* Workflow Preview */}
      <div className="workflow-preview glassmorphism">
        <div className="workflow-header">
          <h3 className="neon-glow">Model Context Protocol (MCP) Workflow</h3>
          <p>Deploy AI agents with integrated MCP for optimal performance</p>
        </div>
        
        <div className="workflow-image">
          <div className="workflow-node node-start neon-box">
            <BsLightning className="node-icon" />
            <span>Start</span>
          </div>
          
          <div className="workflow-edge edge-1"></div>
          
          <div className="workflow-node node-mcp neon-box">
            <div className="mcp-badge">MCP</div>
            <span>Context Protocol</span>
          </div>
          
          <div className="workflow-edge edge-2"></div>
          
          <div className="workflow-node node-agent neon-box">
            <BsRobot className="node-icon" />
            <span>Agent</span>
          </div>
          
          <div className="workflow-edges">
            <div className="workflow-edge edge-3a"></div>
            <div className="workflow-edge edge-3b"></div>
            <div className="workflow-edge edge-3c"></div>
          </div>
          
          <div className="workflow-child-nodes">
            <div className="workflow-node node-model">
              <BsCpu className="node-icon" />
              <span>Model</span>
            </div>
            
            <div className="workflow-node node-memory">
              <BsDatabase className="node-icon" />
              <span>Memory</span>
            </div>
            
            <div className="workflow-node node-tool">
              <BsGear className="node-icon" />
              <span>Tools</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="stats-section">
        <div className="stat-item card-3d">
          <div className="stat-value">12.5K+</div>
          <div className="stat-label">Deployed Agents</div>
        </div>
        
        <div className="stat-item card-3d">
          <div className="stat-value">$2.4M</div>
          <div className="stat-label">Trading Volume</div>
        </div>
        
        <div className="stat-item card-3d">
          <div className="stat-value">99.9%</div>
          <div className="stat-label">Uptime</div>
        </div>
        
        <div className="stat-item card-3d">
          <div className="stat-value">500ms</div>
          <div className="stat-label">MCP Response Time</div>
        </div>
        
        <div className="stat-item card-3d">
          <div className="stat-value">24/7</div>
          <div className="stat-label">Execution</div>
        </div>
      </div>
      
      {/* Security badge */}
      <div className="security-badge">
        <BsShieldCheck />
        <span>SUI & MCP Secure</span>
      </div>
      
      {/* Footer */}
      <div className="landing-footer">
        <div className="copyright">© 2025 DeFAI Agent Deployer</div>
        <div className="footer-links">
          <a href="#" onClick={(e) => e.preventDefault()}>Terms</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Privacy</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Documentation</a>
        </div>
        <div className="powered-by">Powered by SUI Blockchain</div>
      </div>
    </div>
  );
};

export default LandingPage;