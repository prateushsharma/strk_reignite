// server.js - Updated with Telegram integration
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const crypto = require('crypto');
const axios = require('axios');
const walletService = require('./walletService.cjs');
const telegramService = require('./telegramService.cjs');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ----- BALANCE MANAGEMENT -----

// Store balances in memory (in a real app this would be in a database)
let balances = {
  sui: 0,
  usdc: 0
};

// SUI/USDC price management
let currentPrice = 0.95; // Initial price: 1 SUI = 0.95 USDC
let lastPriceUpdate = Date.now();
let isUpdatingPrice = false;

// Track agent status
let agentStatus = 'stopped';
let agentLogs = [];
let telegramCommandListener = null;

// ----- PRICE SERVICE -----

/**
 * Fetch real SUI/USDC price from cryptocurrency exchanges
 * Tries multiple sources for redundancy: CoinGecko, Binance, and Coinbase
 */
async function updateRealPrice() {
  if (isUpdatingPrice) return; // Prevent concurrent updates
  isUpdatingPrice = true;
  
  try {
    console.log("Fetching SUI/USDC price from external APIs...");
    
    // Try CoinGecko first
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: 'sui',
          vs_currencies: 'usd'
        }
      });
      
      if (response.data?.sui?.usd) {
        currentPrice = response.data.sui.usd;
        lastPriceUpdate = Date.now();
        console.log(`Updated SUI/USDC price from CoinGecko: $${currentPrice.toFixed(4)}`);
        isUpdatingPrice = false;
        return;
      }
    } catch (coinGeckoError) {
      console.error("CoinGecko price fetch failed:", coinGeckoError.message);
    }
    
    // Try Binance as fallback
    try {
      const binanceResponse = await axios.get('https://api.binance.com/api/v3/ticker/price', {
        params: { symbol: 'SUIUSDT' }
      });
      
      if (binanceResponse.data?.price) {
        currentPrice = parseFloat(binanceResponse.data.price);
        lastPriceUpdate = Date.now();
        console.log(`Updated SUI/USDC price from Binance: $${currentPrice.toFixed(4)}`);
        isUpdatingPrice = false;
        return;
      }
    } catch (binanceError) {
      console.error("Binance price fetch failed:", binanceError.message);
    }
    
    // Try Coinbase as fallback
    try {
      const coinbaseResponse = await axios.get('https://api.coinbase.com/v2/prices/SUI-USD/spot');
      
      if (coinbaseResponse.data?.data?.amount) {
        currentPrice = parseFloat(coinbaseResponse.data.data.amount);
        lastPriceUpdate = Date.now();
        console.log(`Updated SUI/USDC price from Coinbase: $${currentPrice.toFixed(4)}`);
        isUpdatingPrice = false;
        return;
      }
    } catch (coinbaseError) {
      console.error("Coinbase price fetch failed:", coinbaseError.message);
    }
    
    // If all APIs fail, apply a small random change to simulate market movement
    const changePercent = (Math.random() * 0.04) - 0.02; // ±2%
    currentPrice = currentPrice * (1 + changePercent);
    lastPriceUpdate = Date.now();
    console.log(`All price APIs failed. Using simulated price: $${currentPrice.toFixed(4)}`);
    
  } catch (error) {
    console.error('Error updating price:', error);
  } finally {
    isUpdatingPrice = false;
  }
}

// ----- TELEGRAM INTEGRATION ENDPOINTS -----

// Configure Telegram integration
app.post('/api/telegram/configure', (req, res) => {
  try {
    const { botToken, chatId, enabled, logLevel } = req.body;
    
    const result = telegramService.configure({
      botToken,
      chatId,
      enabled: !!enabled,
      logLevel: logLevel || 'all'
    });
    
    res.json({
      success: true,
      enabled: result.enabled
    });
  } catch (error) {
    console.error('Error configuring Telegram:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get Telegram configuration status
app.get('/api/telegram/status', (req, res) => {
  // Don't return sensitive info like botToken
  res.json({
    success: true,
    enabled: telegramService.isEnabled,
    logLevel: telegramService.logLevel
  });
});

// Test Telegram connection
app.post('/api/telegram/test', async (req, res) => {
  try {
    const result = await telegramService.sendMessage('🤖 Test message from DeFAI Trading Agent. If you can see this, your Telegram integration is working correctly!');
    
    res.json({
      success: result,
      message: result ? 'Test message sent successfully' : 'Failed to send test message'
    });
  } catch (error) {
    console.error('Error testing Telegram:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ----- TRADING ENDPOINTS -----

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SUI Trading API is running',
    balances: balances,
    currentPrice: currentPrice,
    lastPriceUpdate: new Date(lastPriceUpdate).toISOString(),
    agentStatus
  });
});

// Generate wallet endpoint - using your existing walletService
app.post('/api/wallet/generate', (req, res) => {
  console.log("Generate Wallet API called");
  try {
    // Use the wallet service from walletService.cjs
    const wallet = walletService.generateWallet();

    res.json({
      success: true,
      wallet
    });
  } catch (error) {
    console.error('Error generating wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate wallet',
      message: error.message
    });
  }
});

// Set initial balances (called when agent starts)
app.post('/set_swap', (req, res) => {
  try {
    const { sui, usdc, address } = req.body;
    
    // Update balances
    if (sui !== undefined) balances.sui = parseFloat(sui);
    if (usdc !== undefined) balances.usdc = parseFloat(usdc);
    
    console.log(`Set initial balances: SUI=${balances.sui}, USDC=${balances.usdc}`);
    
    res.json({
      success: true,
      message: "Balances updated successfully",
      balances: balances
    });
  } catch (error) {
    console.error('Error setting balances:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Check balances
app.post('/check-balances', (req, res) => {
  try {
    // Ignore address parameter for testing
    console.log('Checking balances:', balances);
    
    res.json({
      success: true,
      balances: balances
    });
  } catch (error) {
    console.error('Error checking balances:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Fetch pair info
app.post('/api/wallet/fetch_pair', (req, res) => {
  try {
    console.log('Fetching pair info');
    
    // Check if price needs updating (older than 10 minutes)
    if (Date.now() - lastPriceUpdate > 600000) {
      updateRealPrice(); // Don't await, just trigger the update
    }
    
    res.json({
      success: true,
      sui: balances.sui,
      usdc: balances.usdc,
      currentPrice: currentPrice
    });
  } catch (error) {
    console.error('Error fetching pair:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get wallet balance using walletService for real addresses
app.post('/api/wallet/balance', async (req, res) => {
  try {
    const { address } = req.body;
    console.log("Get balance API called for:", address);

    try {
      // First try to get real balance from chain using walletService
      const chainBalance = await walletService.getWalletBalance(address);
      console.log("Got balance from chain:", chainBalance);
      
      res.json({
        success: true,
        balance: chainBalance
      });
    } catch (chainError) {
      console.log("Falling back to local balances due to:", chainError.message);
      
      // Fall back to local balances if chain lookup fails
      res.json({
        success: true,
        balance: {
          sui: balances.sui,
          usdc: balances.usdc
        }
      });
    }
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet balance',
      message: error.message
    });
  }
});

// Swap API endpoint - simplified for testing
app.post('/swap', (req, res) => {
  try {
    // Extract basic parameters, ignore network, wallet, slippage
    const { fromCoin, toCoin, amount } = req.body;
    
    if (!fromCoin || !toCoin) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: fromCoin and toCoin"
      });
    }
    
    // Normalize coins to uppercase
    const from = fromCoin.toUpperCase();
    const to = toCoin.toUpperCase();
    
    // Validate coin types
    if ((from !== 'SUI' && from !== 'USDC') || (to !== 'SUI' && to !== 'USDC')) {
      return res.status(400).json({
        success: false,
        error: "Invalid coins. Only SUI and USDC are supported."
      });
    }
    
    // Ensure we're not trying to swap the same coin
    if (from === to) {
      return res.status(400).json({
        success: false,
        error: "Cannot swap a coin for itself"
      });
    }
    
    let amountToSwap;
    let receivedAmount;
    
    // Handle SUI to USDC
    if (from === 'SUI') {
      // If no amount specified, use all SUI
      amountToSwap = amount ? parseFloat(amount) : balances.sui;
      
      // Ensure we have enough balance
      if (amountToSwap > balances.sui) {
        return res.status(400).json({
          success: false,
          error: "Insufficient SUI balance"
        });
      }
      
      // Calculate USDC to receive (SUI * price)
      receivedAmount = amountToSwap * currentPrice;
      
      // Update balances
      balances.sui -= amountToSwap;
      balances.usdc += receivedAmount;
      
      // Log the decision and send Telegram notification
      const logMessage = `[FINAL DECISION] SELL at ${new Date().toISOString()}`;
      agentLogs.push(logMessage);
      console.log(logMessage);
      
      // Send Telegram notification with trading details
      telegramService.sendTradingNotification('SELL', {
        price: currentPrice,
        balances: balances
      });
    } 
    // Handle USDC to SUI
    else if (from === 'USDC') {
      // If no amount specified, use all USDC
      amountToSwap = amount ? parseFloat(amount) : balances.usdc;
      
      // Ensure we have enough balance
      if (amountToSwap > balances.usdc) {
        return res.status(400).json({
          success: false,
          error: "Insufficient USDC balance"
        });
      }
      
      // Calculate SUI to receive (USDC / price)
      receivedAmount = amountToSwap / currentPrice;
      
      // Update balances
      balances.usdc -= amountToSwap;
      balances.sui += receivedAmount;
      
      // Log the decision and send Telegram notification
      const logMessage = `[FINAL DECISION] BUY at ${new Date().toISOString()}`;
      agentLogs.push(logMessage);
      console.log(logMessage);
      
      // Send Telegram notification with trading details
      telegramService.sendTradingNotification('BUY', {
        price: currentPrice,
        balances: balances
      });
    }
    
    console.log(`Swap: ${amountToSwap} ${from} -> ${receivedAmount.toFixed(6)} ${to}`);
    console.log(`New balances: SUI=${balances.sui.toFixed(6)}, USDC=${balances.usdc.toFixed(6)}`);
    
    // Generate a mock transaction hash
    const txHash = '0x' + crypto.randomBytes(32).toString('hex');
    
    // Return response in exactly the format the agent expects
    res.json({
      success: true,
      txHash: txHash,       // Mock transaction hash
      amountIn: amountToSwap.toString(),  // Input amount as string
      amountOut: receivedAmount.toString() // Output amount as string
    });
    
  } catch (error) {
    console.error('Error performing swap:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ----- AGENT MANAGEMENT ENDPOINTS -----

// Deploy agent
app.post('/deploy', (req, res) => {
  try {
    const { uid, password, profit, loss, risk } = req.body;
    
    if (!uid || !password) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: uid and password"
      });
    }
    
    // Clear previous logs
    agentLogs = [];
    
    // Add startup logs
    agentLogs.push(`[INFO] Agent starting with parameters: profit=${profit}, loss=${loss}, risk=${risk}`);
    agentLogs.push(`[INFO] Agent initialized at ${new Date().toISOString()}`);
    agentLogs.push(`[AGENT EVALUATION] Agent Based Analysis Result: HOLD`);
    
    // Update agent status
    agentStatus = 'running';
    
    // Send Telegram notification that agent has started
    telegramService.sendStatusNotification('started', {
      reason: `Started with parameters: profit=${profit}, loss=${loss}, risk=${risk}`,
      balances: balances
    });
    
    // Setup Telegram command listener to allow stopping the agent via Telegram
    if (telegramCommandListener) {
      telegramCommandListener.stop();
    }
    
    telegramCommandListener = telegramService.setupCommandListener(() => {
      // This callback will be called when a /stop command is received
      agentStatus = 'stopped';
      agentLogs.push(`[INFO] Agent stopped by Telegram command at ${new Date().toISOString()}`);
      
      // Send Telegram notification that agent has stopped
      telegramService.sendStatusNotification('stopped', {
        reason: 'Stopped by Telegram command',
        balances: balances
      });
      
      // Stop the command listener
      if (telegramCommandListener) {
        telegramCommandListener.stop();
        telegramCommandListener = null;
      }
    });
    
    // Periodically make decisions
    scheduleAgentDecisions();
    
    res.json({
      status: 'success',
      message: 'Agent deployed successfully'
    });
  } catch (error) {
    console.error('Error deploying agent:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Stop agent execution
app.post('/stop_execution', (req, res) => {
  try {
    const { uid, password } = req.body;
    
    if (!uid || !password) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: uid and password"
      });
    }
    
    // Add stop log
    agentLogs.push(`[INFO] Agent stopped at ${new Date().toISOString()}`);
    
    // Update agent status
    agentStatus = 'stopped';
    
    // Send Telegram notification that agent has stopped
    telegramService.sendStatusNotification('stopped', {
      reason: 'Stopped by user request',
      balances: balances
    });
    
    // Stop Telegram command listener
    if (telegramCommandListener) {
      telegramCommandListener.stop();
      telegramCommandListener = null;
    }
    
    res.json({
      status: 'success',
      message: 'Agent stopped successfully'
    });
  } catch (error) {
    console.error('Error stopping agent:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Fetch agent logs
app.post('/fetch_logs', (req, res) => {
  try {
    const { uid, password } = req.body;
    
    if (!uid || !password) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: uid and password"
      });
    }
    
    res.json({
      status: 'success',
      log: agentLogs.join('\n')
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// ----- SIMULATED AGENT DECISIONS -----

// Schedule agent decisions (simulated)
function scheduleAgentDecisions() {
  if (agentStatus !== 'running') return;
  
  // Schedule the next decision randomly between 15 and 60 seconds
  const nextDecisionTime = Math.floor(Math.random() * 45000) + 15000;
  
  setTimeout(() => {
    if (agentStatus === 'running') {
      makeRandomDecision();
      scheduleAgentDecisions();
    }
  }, nextDecisionTime);
}

// Make a random trading decision (simulated)
function makeRandomDecision() {
  // Add evaluation log
  const evalResult = Math.random();
  let action;
  
  if (evalResult < 0.2) {
    action = 'BUY';
  } else if (evalResult < 0.4) {
    action = 'SELL';
  } else {
    action = 'HOLD';
  }
  
  // Log the evaluation
  agentLogs.push(`[AGENT EVALUATION] Agent Based Analysis Result: ${action}`);
  console.log(`Agent evaluation: ${action}`);
  
  // Add a small delay before making the final decision (simulates AI thinking)
  setTimeout(() => {
    if (agentStatus !== 'running') return;
    
    // 80% chance to follow the evaluation, 20% chance to change
    const finalAction = Math.random() < 0.8 ? action : (Math.random() < 0.5 ? 'BUY' : 'SELL');
    
    // Log the final decision
    const logMessage = `[FINAL DECISION] ${finalAction} at ${new Date().toISOString()}`;
    agentLogs.push(logMessage);
    console.log(logMessage);
    
    // Execute the action (except for HOLD)
    if (finalAction !== 'HOLD') {
      executeAction(finalAction);
    } else {
      // For HOLD actions, just send a notification without changing balances
      telegramService.sendTradingNotification('HOLD', {
        price: currentPrice,
        balances: balances
      });
    }
  }, 5000);
}

// Execute a trading action (simulated)
function executeAction(action) {
  try {
    let amountToSwap;
    let receivedAmount;
    
    // Calculate the action
    if (action === 'BUY') {
      // Buy SUI with 25-75% of available USDC
      const percentToUse = 0.25 + (Math.random() * 0.5);
      amountToSwap = balances.usdc * percentToUse;
      
      // Calculate SUI to receive (USDC / price)
      receivedAmount = amountToSwap / currentPrice;
      
      // Update balances
      balances.usdc -= amountToSwap;
      balances.sui += receivedAmount;
    } else if (action === 'SELL') {
      // Sell 25-75% of available SUI
      const percentToUse = 0.25 + (Math.random() * 0.5);
      amountToSwap = balances.sui * percentToUse;
      
      // Calculate USDC to receive (SUI * price)
      receivedAmount = amountToSwap * currentPrice;
      
      // Update balances
      balances.sui -= amountToSwap;
      balances.usdc += receivedAmount;
    }
    
    // Log the execution
    console.log(`Executed ${action}: ${amountToSwap.toFixed(6)} -> ${receivedAmount.toFixed(6)}`);
    console.log(`New balances: SUI=${balances.sui.toFixed(6)}, USDC=${balances.usdc.toFixed(6)}`);
    
    // Send Telegram notification with trading details
    telegramService.sendTradingNotification(action, {
      price: currentPrice,
      balances: balances
    });
  } catch (error) {
    console.error('Error executing action:', error);
    
    // Log the error
    agentLogs.push(`[ERROR] Failed to execute ${action}: ${error.message}`);
    
    // Send error notification to Telegram
    telegramService.sendErrorNotification(`Failed to execute ${action}`, {
      details: error.message,
      balances: balances
    });
  }
}

// Initialize price on startup, then update periodically
updateRealPrice();
// Try to update price every 5 minutes
setInterval(updateRealPrice, 300000);

// Start the server
app.listen(PORT, () => {
  console.log(`SUI Trading API Server running on port ${PORT}`);
  console.log(`Initial balances: SUI=${balances.sui}, USDC=${balances.usdc}`);
  console.log(`Initial price: 1 SUI = ${currentPrice} USDC`);
  
  // Initialize Telegram with a startup message
  telegramService.sendMessage(`
🤖 <b>DeFAI Trading Agent Server Started</b>

The trading agent server is now online and ready to receive commands.

<b>Available Commands:</b>
/status - Check agent status
/stop - Stop the trading agent
/balance - Show current balances
/help - Show this message

Current SUI price: ${currentPrice.toFixed(4)}
  `);
});