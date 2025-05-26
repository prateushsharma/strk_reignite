// telegramService.cjs
/**
 * Telegram Integration Service for Backend
 * This service handles sending agent logs and trading decisions to a Telegram bot
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Default configuration
let config = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  chatId: process.env.TELEGRAM_CHAT_ID || '',
  enabled: false,
  logLevel: 'all' // 'all', 'decisions', 'errors'
};

// Config file path
const configFilePath = path.join(__dirname, 'telegram-config.json');

/**
 * Initialize the Telegram service
 */
function initialize() {
  // Load config from file if it exists
  try {
    if (fs.existsSync(configFilePath)) {
      const savedConfig = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
      config = { ...config, ...savedConfig };
      console.log('Telegram configuration loaded from file');
      
      // Check if we have required settings
      config.enabled = !!(config.botToken && config.chatId);
      console.log(`Telegram notifications ${config.enabled ? 'ENABLED' : 'DISABLED'}`);
    }
  } catch (error) {
    console.error('Error loading Telegram configuration:', error);
  }
}

/**
 * Configure the Telegram service
 * @param {object} settings - Configuration object
 */
function configure(settings) {
  // Update config with provided settings
  config = { ...config, ...settings };
  
  // Check if we have required settings
  config.enabled = !!(config.botToken && config.chatId);
  
  // Save config to file
  try {
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
    console.log('Telegram configuration saved to file');
  } catch (error) {
    console.error('Error saving Telegram configuration:', error);
  }
  
  return { success: true, enabled: config.enabled };
}

/**
 * Check if telegram notifications are enabled
 * @returns {boolean} Whether notifications are enabled
 */
function isEnabled() {
  return config.enabled;
}

/**
 * Get the current notification log level
 * @returns {string} Current log level
 */
function getLogLevel() {
  return config.logLevel;
}

/**
 * Send a message to the Telegram chat
 * @param {string} message - The message to send
 * @returns {Promise<boolean>} - Whether the message was sent successfully
 */
async function sendMessage(message) {
  if (!config.enabled) {
    console.log('Telegram notifications disabled, not sending message');
    return false;
  }
  
  try {
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    const response = await axios.post(url, {
      chat_id: config.chatId,
      text: message,
      parse_mode: 'HTML'
    });
    
    if (response.data.ok) {
      console.log('Telegram message sent successfully');
      return true;
    } else {
      console.error('Failed to send Telegram message:', response.data);
      return false;
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Send a trading decision notification to Telegram
 * @param {string} action - Trading action (BUY, SELL, HOLD)
 * @param {object} data - Additional data (price, balances, etc.)
 * @returns {Promise<boolean>} - Whether the notification was sent successfully
 */
async function sendTradingNotification(action, data = {}) {
  if (!config.enabled) return false;
  if (config.logLevel === 'errors') return false; // Only send errors
  
  const { price = 0, balances = { sui: 0, usdc: 0 } } = data;
  
  let emoji = '';
  switch (action.toUpperCase()) {
    case 'BUY':
      emoji = '🟢';
      break;
    case 'SELL':
      emoji = '🔴';
      break;
    case 'HOLD':
      emoji = '🟡';
      break;
    default:
      emoji = 'ℹ️';
  }
  
  // Create message
  let message = `<b>${emoji} ${action.toUpperCase()} Signal</b>\n\n`;
  
  if (price) {
    message += `<b>Price:</b> $${price.toFixed(4)}\n\n`;
  }
  
  if (balances) {
    message += `<b>Current Balances:</b>\n`;
    message += `SUI: ${balances.sui.toFixed(6)}\n`;
    message += `USDC: ${balances.usdc.toFixed(2)}\n\n`;
  }
  
  message += `<i>${new Date().toLocaleString()}</i>`;
  
  return await sendMessage(message);
}

/**
 * Send agent status notification to Telegram
 * @param {string} status - Status message ('started', 'stopped', 'error')
 * @param {object} data - Additional data
 * @returns {Promise<boolean>} - Whether the notification was sent successfully
 */
async function sendStatusNotification(status, data = {}) {
  if (!config.enabled) return false;
  
  // Always send status updates regardless of log level
  
  let emoji = '';
  let statusText = '';
  
  switch (status.toLowerCase()) {
    case 'started':
      emoji = '▶️';
      statusText = 'STARTED';
      break;
    case 'stopped':
      emoji = '⏹️';
      statusText = 'STOPPED';
      break;
    case 'error':
      emoji = '⚠️';
      statusText = 'ERROR';
      break;
    default:
      emoji = 'ℹ️';
      statusText = status.toUpperCase();
  }
  
  let message = `<b>${emoji} Trading Agent ${statusText}</b>\n\n`;
  
  if (data.reason) {
    message += `<b>Reason:</b> ${data.reason}\n\n`;
  }
  
  if (data.balances) {
    message += `<b>Current Balances:</b>\n`;
    message += `SUI: ${data.balances.sui.toFixed(6)}\n`;
    message += `USDC: ${data.balances.usdc.toFixed(2)}\n\n`;
  }
  
  if (data.error) {
    message += `<b>Error:</b> ${data.error}\n\n`;
  }
  
  message += `<i>${new Date().toLocaleString()}</i>`;
  
  return await sendMessage(message);
}

/**
 * Send error notification to Telegram
 * @param {string} error - Error message
 * @param {object} data - Additional data
 * @returns {Promise<boolean>} - Whether the notification was sent successfully
 */
async function sendErrorNotification(error, data = {}) {
  if (!config.enabled) return false;
  
  let message = `<b>⚠️ ERROR</b>\n\n${error}\n\n`;
  
  if (data.details) {
    message += `<b>Details:</b> ${data.details}\n\n`;
  }
  
  if (data.balances) {
    message += `<b>Current Balances:</b>\n`;
    message += `SUI: ${data.balances.sui.toFixed(6)}\n`;
    message += `USDC: ${data.balances.usdc.toFixed(2)}\n\n`;
  }
  
  message += `<i>${new Date().toLocaleString()}</i>`;
  
  return await sendMessage(message);
}

/**
 * Set up a command listener for Telegram bot
 * This function starts a polling mechanism to listen for bot commands
 * @param {function} stopAgentCallback - Callback function to stop the agent
 * @returns {object} - Polling controller object
 */
function setupCommandListener(stopAgentCallback) {
  if (!config.enabled) {
    console.log('Telegram notifications disabled, not setting up command listener');
    return { stop: () => {} };
  }
  
  console.log('Setting up Telegram command listener');
  
  let lastUpdateId = 0;
  let isRunning = true;
  
  // Start polling
  const poll = async () => {
    if (!isRunning) return;
    
    try {
      const url = `https://api.telegram.org/bot${config.botToken}/getUpdates?offset=${lastUpdateId + 1}`;
      const response = await axios.get(url);
      
      if (response.data.ok && response.data.result.length > 0) {
        // Process updates
        response.data.result.forEach(update => {
          // Update lastUpdateId
          if (update.update_id > lastUpdateId) {
            lastUpdateId = update.update_id;
          }
          
          // Process message
          if (update.message && update.message.chat.id.toString() === config.chatId) {
            const text = update.message.text.trim().toLowerCase();
            
            // Process commands
            if (text === '/stop') {
              console.log('Received stop command from Telegram');
              sendMessage('Stopping trading agent...');
              
              // Call the callback function to stop the agent
              if (typeof stopAgentCallback === 'function') {
                stopAgentCallback();
              }
            } 
            else if (text === '/status') {
              console.log('Received status command from Telegram');
              sendMessage('Agent is currently running. Use /stop to stop the agent.');
            }
            else if (text === '/help') {
              console.log('Received help command from Telegram');
              sendMessage(`
<b>Available Commands:</b>

/status - Check agent status
/stop - Stop the trading agent
/balance - Show current balances
/help - Show this message
              `);
            }
            else if (text === '/balance') {
              // This would normally fetch balances from the server
              // For simplicity, we'll just send a message
              sendMessage('Fetching balances...');
              // In a real implementation, you would fetch the balances here
            }
          }
        });
      }
    } catch (error) {
      console.error('Error polling Telegram updates:', error);
    }
    
    // Continue polling after a delay
    if (isRunning) {
      setTimeout(poll, 2000); // Poll every 2 seconds
    }
  };
  
  // Start initial poll
  poll();
  
  // Return controller
  return {
    stop: () => {
      isRunning = false;
      console.log('Telegram command listener stopped');
    }
  };
}

// Initialize on load
initialize();

module.exports = {
  isEnabled,
  getLogLevel,
  configure,
  sendMessage,
  sendTradingNotification,
  sendStatusNotification,
  sendErrorNotification,
  setupCommandListener
};