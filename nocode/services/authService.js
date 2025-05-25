// src/services/authService.js
/**
 * Authentication Service for DeFAI Agent Deployer
 * Handles wallet authentication and UID generation
 */

// Use your API base URL - update this to your actual endpoint
const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Generates a UID for the agent by authenticating with the wallet address
 * @param {string} walletAddress - The connected wallet address
 * @returns {Promise<{status: string, uid?: string, message?: string}>}
 */
export const generateUid = async (walletAddress) => {
  try {
    const response = await fetch(`${API_BASE_URL}/get_uid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: walletAddress
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating UID:', error);
    return {
      status: 'error',
      message: 'Failed to connect to authentication service'
    };
  }
};

/**
 * Stores the UID in local storage for persistence
 * @param {string} uid - The generated UID
 */
export const storeUid = (uid) => {
  localStorage.setItem('defai_uid', uid);
};

/**
 * Retrieves the stored UID from local storage
 * @returns {string|null} - The stored UID or null if not found
 */
export const getStoredUid = () => {
  return localStorage.getItem('defai_uid');
};

/**
 * Clears the stored UID from local storage
 */
export const clearUid = () => {
  localStorage.removeItem('defai_uid');
};