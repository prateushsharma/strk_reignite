// src/services/agentDeploymentService.js
/**
 * Agent Deployment Service for DeFAI Agent Deployer
 * Updated to work with the simplified server implementation
 */

// Use your API base URL
const API_BASE_URL = 'http://localhost:8000';
const TRADING_API_URL = 'http://localhost:5000';

/**
 * Phase 1: Updates/prepares the agent with the flow configuration
 * @param {string} uid - The generated UID
 * @param {string} walletAddress - The connected wallet address (used as password)
 * @param {object} code - The exported JSON flow graph
 * @returns {Promise<{status: string, update?: boolean, message?: string}>}
 */
export const updateAgentConfiguration = async (uid, walletAddress, code) => {
  try {
    const requestBody = {
      uid: uid,
      password: walletAddress,
      code: code
    };
    
    console.log('=== PHASE 1: UPDATE AGENT CONFIGURATION ===');
    console.log('URL:', `${API_BASE_URL}/update`);
    console.log('Method:', 'POST');
    console.log('Headers:', {
      'Content-Type': 'application/json',
    });
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));
    console.log('=========================');
    
    const response = await fetch(`${API_BASE_URL}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response Status:', response.status);
    console.log('Response OK:', response.ok);
    
    // Check if the response is OK (status 200-299)
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error Response Body:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('=== UPDATE RESPONSE ===');
    console.log('Response Data:', JSON.stringify(data, null, 2));
    console.log('Response Status:', data.status);
    console.log('Response Update:', data.update);
    console.log('Response Message:', data.message);
    console.log('==========================');
    
    // If the API response indicates an error, handle it
    if (data.status !== 'success') {
      throw new Error(data.message || 'Configuration update failed on server');
    }
    
    return data;
  } catch (error) {
    console.error('=== CONFIGURATION UPDATE ERROR ===');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('=======================');
    
    return {
      status: 'error',
      message: error.message || 'Failed to update agent configuration'
    };
  }
};

/**
 * Deploy agent with trading parameters
 * @param {string} uid - The agent UID
 * @param {string} walletAddress - The wallet address
 * @param {object} tradingSettings - Trading settings (profit, loss, risk)
 * @returns {Promise<{status: string, message?: string}>}
 */
export const deployAgent = async (uid, walletAddress, tradingSettings) => {
  try {
    const requestBody = {
      uid: uid,
      password: walletAddress,
      profit: tradingSettings.profit,
      loss: tradingSettings.loss,
      risk: tradingSettings.risk
    };
    
    console.log('=== DEPLOY AGENT ===');
    console.log('URL:', `${API_BASE_URL}/deploy`);
    console.log('Method:', 'POST');
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Deploy error! Status: ${response.status}, Message: ${errorText}`);
    }
    
    // The deploy endpoint returns a streaming response
    // For simplicity, we'll just return a success message
    return {
      status: 'success',
      message: 'Agent deployment initiated'
    };
  } catch (error) {
    console.error('Error deploying agent:', error);
    return {
      status: 'error',
      message: error.message || 'Failed to deploy agent'
    };
  }
};

/**
 * Set initial trading amounts
 * @param {number} initialAmount - Initial USDC amount
 * @param {string} walletAddress - Optional wallet address
 * @returns {Promise<{status: string, message?: string}>}
 */
export const setInitialTrading = async (initialAmount, walletAddress = null) => {
  try {
    const requestBody = {
      sui: 0, // Start with 0 SUI
      usdc: initialAmount, // Start with user-defined USDC
    };
    
    // Add wallet address if provided
    if (walletAddress) {
      requestBody.address = walletAddress;
    }
    
    console.log('=== SET INITIAL TRADING ===');
    console.log('URL:', `${TRADING_API_URL}/set_swap`);
    console.log('Method:', 'POST');
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${TRADING_API_URL}/set_swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Set trading error! Status: ${response.status}, Message: ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      status: 'success',
      data: data
    };
  } catch (error) {
    console.error('Error setting initial trading amounts:', error);
    return {
      status: 'error',
      message: error.message || 'Failed to set initial trading amounts'
    };
  }
};

/**
 * Stop the running agent
 * @param {string} uid - The agent UID
 * @param {string} walletAddress - The wallet address
 * @returns {Promise<{status: string, message?: string}>}
 */
export const stopAgent = async (uid, walletAddress) => {
  try {
    const requestBody = {
      uid: uid,
      password: walletAddress
    };
    
    console.log('=== STOP AGENT ===');
    console.log('URL:', `${API_BASE_URL}/stop_execution`);
    console.log('Method:', 'POST');
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/stop_execution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stop agent error! Status: ${response.status}, Message: ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      status: 'success',
      message: data.message || 'Agent stopped successfully'
    };
  } catch (error) {
    console.error('Error stopping agent:', error);
    return {
      status: 'error',
      message: error.message || 'Failed to stop agent'
    };
  }
};

/**
 * Fetch agent logs
 * @param {string} uid - The agent UID
 * @param {string} walletAddress - The wallet address
 * @returns {Promise<{status: string, logs?: Array, message?: string}>}
 */
export const fetchAgentLogs = async (uid, walletAddress) => {
  try {
    const requestBody = {
      uid: uid,
      password: walletAddress
    };
    
    const response = await fetch(`${API_BASE_URL}/fetch_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fetch logs error! Status: ${response.status}, Message: ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      status: 'success',
      logs: data.log || []
    };
  } catch (error) {
    console.error('Error fetching agent logs:', error);
    return {
      status: 'error',
      message: error.message || 'Failed to fetch agent logs'
    };
  }
};

/**
 * Fetch current trading balances
 * @param {string} walletAddress - Optional wallet address
 * @returns {Promise<{status: string, balances?: object, message?: string}>}
 */
export const fetchTradingBalances = async (walletAddress = null) => {
  try {
    let requestBody = {};
    
    // Add wallet address if provided
    if (walletAddress) {
      requestBody.address = walletAddress;
    }
    
    const response = await fetch(`${TRADING_API_URL}/check-balances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fetch balances error! Status: ${response.status}, Message: ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      status: 'success',
      balances: data.balances || { sui: 0, usdc: 0 }
    };
  } catch (error) {
    console.error('Error fetching trading balances:', error);
    return {
      status: 'error',
      message: error.message || 'Failed to fetch trading balances',
      balances: { sui: 0, usdc: 0 } // Return default balances on error
    };
  }
};

/**
 * Fetch current pair status
 * @returns {Promise<{status: string, data?: object, message?: string}>}
 */
export const fetchPairStatus = async () => {
  try {
    const response = await fetch(`${TRADING_API_URL}/api/wallet/fetch_pair`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fetch pair error! Status: ${response.status}, Message: ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      status: 'success',
      data: data
    };
  } catch (error) {
    console.error('Error fetching pair status:', error);
    // Return mock data on error to prevent UI crashes
    return {
      status: 'success',
      data: {
        sui: 0,
        usdc: 0, 
        currentPrice: 0.95 // Default price
      }
    };
  }
};

/**
 * Execute a swap between SUI and USDC
 * @param {string} fromCoin - Source coin (SUI or USDC)
 * @param {string} toCoin - Target coin (SUI or USDC)
 * @param {number|string} amount - Amount to swap (optional - if not provided, swaps all available balance)
 * @returns {Promise<{status: string, data?: object, message?: string}>}
 */
export const executeSwap = async (fromCoin, toCoin, amount = null) => {
  try {
    const requestBody = {
      fromCoin: fromCoin,
      toCoin: toCoin
    };
    
    // Add amount if provided
    if (amount !== null) {
      requestBody.amount = amount.toString();
    }
    
    console.log('=== EXECUTE SWAP ===');
    console.log('URL:', `${TRADING_API_URL}/swap`);
    console.log('Method:', 'POST');
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${TRADING_API_URL}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Swap error! Status: ${response.status}, Message: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Swap failed');
    }
    
    // Return the expected format that the agent needs
    return {
      status: 'success',
      txHash: data.txHash,
      amountIn: data.amountIn,
      amountOut: data.amountOut
    };
  } catch (error) {
    console.error('Error executing swap:', error);
    return {
      status: 'error',
      message: error.message || 'Failed to execute swap'
    };
  }
};;

/**
 * Fetch deployed agent data
 * @param {string} walletAddress - The wallet address
 * @returns {Promise<{status: string, data?: Array, message?: string}>}
 */
export const fetchAgentData = async (walletAddress) => {
  try {
    const requestBody = {
      password: walletAddress
    };
    
    const response = await fetch(`${API_BASE_URL}/fetch_data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fetch agent data error! Status: ${response.status}, Message: ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      status: 'success',
      data: data.data || []
    };
  } catch (error) {
    console.error('Error fetching agent data:', error);
    return {
      status: 'error',
      message: error.message || 'Failed to fetch agent data'
    };
  }
};