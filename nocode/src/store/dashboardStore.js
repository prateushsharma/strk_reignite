// src/store/dashboardStore.js
import { create } from 'zustand';

export const useDashboardStore = create((set, get) => ({
  // API Performance metrics
  apiMetrics: {
    overall: {
      healthPercentage: 90,
      avgResponseTime: 150,
      errorRate: 1.2,
      totalRequests: 12500,
    },
    endpoints: [],
    lastUpdated: Date.now()
  },
  
  // AI Model Health metrics
  aiModelMetrics: {
    overall: {
      activeModels: 5,
      totalModels: 6,
      avgLatency: 230,
      successRate: 98.5,
      totalInferences: 25000
    },
    models: [],
    lastUpdated: Date.now()
  },
  
  // Loading states
  isLoadingApiMetrics: false,
  isLoadingAiModelMetrics: false,
  
  // Error states
  apiMetricsError: null,
  aiModelMetricsError: null,
  
  // Fetch API metrics
  fetchApiMetrics: async (timeRange = '1h') => {
    set({ isLoadingApiMetrics: true, apiMetricsError: null });
    
    try {
      // In a real app, this would be an API call
      // For now, we'll just update with mock data
      set({ 
        apiMetrics: {
          overall: {
            healthPercentage: Math.floor(Math.random() * 10) + 90,
            avgResponseTime: Math.floor(Math.random() * 100) + 100,
            errorRate: (Math.random() * 2).toFixed(2),
            totalRequests: Math.floor(Math.random() * 5000) + 10000,
          },
          endpoints: [],
          lastUpdated: Date.now()
        },
        isLoadingApiMetrics: false
      });
    } catch (error) {
      set({ 
        apiMetricsError: error.message,
        isLoadingApiMetrics: false
      });
      console.error('Error fetching API metrics:', error);
    }
  },
  
  // Fetch AI model metrics
  fetchAiModelMetrics: async () => {
    set({ isLoadingAiModelMetrics: true, aiModelMetricsError: null });
    
    try {
      // In a real app, this would be an API call
      // For now, we'll just update with mock data
      set({ 
        aiModelMetrics: {
          overall: {
            activeModels: Math.floor(Math.random() * 2) + 5,
            totalModels: 7,
            avgLatency: Math.floor(Math.random() * 100) + 200,
            successRate: (Math.random() * 3 + 97).toFixed(2),
            totalInferences: Math.floor(Math.random() * 10000) + 20000
          },
          models: [],
          lastUpdated: Date.now()
        },
        isLoadingAiModelMetrics: false
      });
    } catch (error) {
      set({ 
        aiModelMetricsError: error.message,
        isLoadingAiModelMetrics: false
      });
      console.error('Error fetching AI model metrics:', error);
    }
  },
  
  // Refresh all dashboard data
  refreshDashboardData: async () => {
    const { fetchApiMetrics, fetchAiModelMetrics } = get();
    
    // Start all fetch operations in parallel
    await Promise.all([
      fetchApiMetrics(),
      fetchAiModelMetrics()
    ]);
  }
}));