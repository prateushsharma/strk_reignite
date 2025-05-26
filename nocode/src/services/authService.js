// src/services/authService.js - Fixed duplicate exports for Starknet wallet authentication
/**
 * Authentication Service for DeFAI Agent Deployer
 * Handles Starknet wallet authentication and UID generation
 */

// Use your API base URL - update this to your actual endpoint
const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Validates if an address is a valid Starknet address
 * @param {string} address - The address to validate
 * @returns {boolean} - True if valid Starknet address
 */
export const isValidStarknetAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  // Remove 0x prefix if present
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  
  // Starknet addresses are 64 characters long (32 bytes in hex)
  // and contain only hexadecimal characters
  const starknetAddressRegex = /^[0-9a-fA-F]{1,64}$/;
  
  return starknetAddressRegex.test(cleanAddress) && cleanAddress.length <= 64;
};

/**
 * Formats a Starknet address for display
 * @param {string} address - The full Starknet address
 * @returns {string} - Formatted address (first 6 + last 4 characters)
 */
export const formatStarknetAddress = (address) => {
  if (!address || !isValidStarknetAddress(address)) {
    return '';
  }
  
  // Ensure address has 0x prefix
  const fullAddress = address.startsWith('0x') ? address : `0x${address}`;
  
  if (fullAddress.length <= 10) {
    return fullAddress;
  }
  
  return `${fullAddress.slice(0, 6)}...${fullAddress.slice(-4)}`;
};

/**
 * Generates a UID for the agent by authenticating with the Starknet wallet address
 * @param {string} walletAddress - The connected Starknet wallet address
 * @returns {Promise<{status: string, uid?: string, message?: string}>}
 */
export const generateUid = async (walletAddress) => {
  try {
    // Validate Starknet address format
    if (!walletAddress || !isValidStarknetAddress(walletAddress)) {
      return {
        status: 'error',
        message: 'Invalid Starknet wallet address format'
      };
    }

    const response = await fetch(`${API_BASE_URL}/get_uid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: walletAddress,
        network: 'starknet', // Specify that this is a Starknet address
        blockchain: 'starknet'
      }),
    });

    const data = await response.json();
    
    // Log successful UID generation
    if (data.status === 'success') {
      console.log('UID generated successfully for Starknet address:', {
        address: formatStarknetAddress(walletAddress),
        uid: data.uid
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error generating UID for Starknet wallet:', error);
    return {
      status: 'error',
      message: 'Failed to connect to authentication service'
    };
  }
};

/**
 * Stores the UID in local storage for persistence
 * @param {string} uid - The generated UID
 * @param {string} walletAddress - The associated wallet address
 */
export const storeUid = (uid, walletAddress = null) => {
  const uidData = {
    uid,
    walletAddress,
    network: 'starknet',
    timestamp: Date.now()
  };
  
  localStorage.setItem('defai_uid', JSON.stringify(uidData));
  
  // Also store just the UID for backward compatibility
  localStorage.setItem('defai_uid_simple', uid);
};

/**
 * Retrieves the stored UID from local storage
 * @returns {string|null} - The stored UID or null if not found
 */
export const getStoredUid = () => {
  try {
    // Try to get the structured data first
    const uidData = localStorage.getItem('defai_uid');
    if (uidData) {
      const parsed = JSON.parse(uidData);
      return parsed.uid;
    }
    
    // Fallback to simple UID storage
    return localStorage.getItem('defai_uid_simple');
  } catch (error) {
    console.error('Error retrieving stored UID:', error);
    // Fallback to simple storage
    return localStorage.getItem('defai_uid_simple');
  }
};

/**
 * Retrieves the full stored UID data from local storage
 * @returns {object|null} - The stored UID data or null if not found
 */
export const getStoredUidData = () => {
  try {
    const uidData = localStorage.getItem('defai_uid');
    if (uidData) {
      return JSON.parse(uidData);
    }
    
    // If only simple UID exists, return basic structure
    const simpleUid = localStorage.getItem('defai_uid_simple');
    if (simpleUid) {
      return {
        uid: simpleUid,
        walletAddress: null,
        network: 'starknet',
        timestamp: null
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving stored UID data:', error);
    return null;
  }
};

/**
 * Clears the stored UID from local storage
 */
export const clearUid = () => {
  localStorage.removeItem('defai_uid');
  localStorage.removeItem('defai_uid_simple');
  console.log('Cleared stored UID data');
};

/**
 * Validates if the stored UID matches the current wallet
 * @param {string} currentWalletAddress - Current connected wallet address
 * @returns {boolean} - True if UID matches current wallet
 */
export const isUidValidForWallet = (currentWalletAddress) => {
  const uidData = getStoredUidData();
  
  if (!uidData || !uidData.walletAddress || !currentWalletAddress) {
    return false;
  }
  
  // Compare addresses (case insensitive)
  return uidData.walletAddress.toLowerCase() === currentWalletAddress.toLowerCase();
};

/**
 * Refreshes the UID for a given wallet address
 * @param {string} walletAddress - The wallet address to refresh UID for
 * @returns {Promise<{status: string, uid?: string, message?: string}>}
 */
export const refreshUid = async (walletAddress) => {
  try {
    // Clear existing UID
    clearUid();
    
    // Generate new UID
    const result = await generateUid(walletAddress);
    
    if (result.status === 'success' && result.uid) {
      storeUid(result.uid, walletAddress);
    }
    
    return result;
  } catch (error) {
    console.error('Error refreshing UID:', error);
    return {
      status: 'error',
      message: 'Failed to refresh UID'
    };
  }
};