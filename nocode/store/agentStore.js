// src/store/agentStore.js
import { create } from 'zustand';

export const useAgentStore = create((set, get) => ({
  agents: [],
  isLoading: false,
  error: null,
  
  // Fetch all agents
  fetchAgents: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // In a real app, this would be an API call
      // Example: const response = await fetch('/api/agents');
      
      // For now, we'll use mock data
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'Customer Support Agent',
          status: 'running',
          walletStatus: 'active',
          walletAddress: '0x7Fa9385be102ac3EAc297483Dd6233D62b3e1496',
          balance: '2.45',
          created: '2023-05-09T14:23:07Z',
          lastActive: '2023-05-10T08:15:22Z'
        },
        {
          id: 'agent-2',
          name: 'Data Analyst Agent',
          status: 'stopped',
          walletStatus: 'pending',
          walletAddress: '',
          balance: '0',
          created: '2023-05-08T10:11:32Z',
          lastActive: '2023-05-09T16:33:45Z'
        },
        {
          id: 'agent-3',
          name: 'Marketing Assistant',
          status: 'stopped',
          walletStatus: 'active',
          walletAddress: '0x3Af2F5B56E592FA8254f3aA52B80F8d4D6022Ad3',
          balance: '1.20',
          created: '2023-05-07T09:45:12Z',
          lastActive: '2023-05-10T06:12:35Z'
        }
      ];
      
      set({ agents: mockAgents, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching agents:', error);
    }
  },
  
  // Create a new agent
  createAgent: async (agentData) => {
    set({ isLoading: true, error: null });
    
    try {
      // In a real app, this would be an API call
      // Example: const response = await fetch('/api/agents', { method: 'POST', body: JSON.stringify(agentData) });
      
      // For now, we'll just add the agent to our state
      const newAgent = {
        id: `agent-${Date.now()}`,
        status: 'stopped',
        walletStatus: 'pending',
        walletAddress: '',
        balance: '0',
        created: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        ...agentData
      };
      
      set(state => ({ 
        agents: [...state.agents, newAgent],
        isLoading: false 
      }));
      
      return newAgent;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error creating agent:', error);
      throw error;
    }
  },
  
  // Start an agent
  startAgent: async (agentId) => {
    set({ isLoading: true, error: null });
    
    try {
      // In a real app, this would be an API call
      // Example: await fetch(`/api/agents/${agentId}/start`, { method: 'POST' });
      
      // For now, we'll just update our state
      set(state => ({
        agents: state.agents.map(agent => 
          agent.id === agentId
            ? { ...agent, status: 'running', lastActive: new Date().toISOString() }
            : agent
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error(`Error starting agent ${agentId}:`, error);
    }
  },
  
  // Stop an agent
  stopAgent: async (agentId) => {
    set({ isLoading: true, error: null });
    
    try {
      // In a real app, this would be an API call
      // Example: await fetch(`/api/agents/${agentId}/stop`, { method: 'POST' });
      
      // For now, we'll just update our state
      set(state => ({
        agents: state.agents.map(agent => 
          agent.id === agentId
            ? { ...agent, status: 'stopped', lastActive: new Date().toISOString() }
            : agent
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error(`Error stopping agent ${agentId}:`, error);
    }
  },
  
  // Create a wallet for an agent
  createWallet: async (agentId) => {
    set({ isLoading: true, error: null });
    
    try {
      // In a real app, this would be an API call
      // Example: const response = await fetch(`/api/agents/${agentId}/wallet`, { method: 'POST' });
      
      // Generate a mock wallet address
      const mockWalletAddress = '0x' + Array.from({length: 40}, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      
      // For now, we'll just update our state
      set(state => ({
        agents: state.agents.map(agent => 
          agent.id === agentId
            ? { 
                ...agent, 
                walletStatus: 'active',
                walletAddress: mockWalletAddress,
                balance: '0.00',
                lastActive: new Date().toISOString() 
              }
            : agent
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error(`Error creating wallet for agent ${agentId}:`, error);
    }
  },
  
  // Get agent logs
  getAgentLogs: async (agentId) => {
    set({ isLoading: true, error: null });
    
    try {
      // In a real app, this would be an API call
      // Example: const response = await fetch(`/api/agents/${agentId}/logs`);
      
      // For now, we'll return mock logs
      const mockLogs = [
        { id: 1, timestamp: new Date().toISOString(), level: 'info', message: 'Agent started successfully' },
        { id: 2, timestamp: new Date(Date.now() - 60000).toISOString(), level: 'info', message: 'Processing user request' },
        { id: 3, timestamp: new Date(Date.now() - 120000).toISOString(), level: 'info', message: 'Retrieved data from external API' },
        { id: 4, timestamp: new Date(Date.now() - 180000).toISOString(), level: 'warning', message: 'Slow response from database' },
        { id: 5, timestamp: new Date(Date.now() - 240000).toISOString(), level: 'info', message: 'Generated response using AI model' }
      ];
      
      set({ isLoading: false });
      return mockLogs;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error(`Error fetching logs for agent ${agentId}:`, error);
      return [];
    }
  }
}));