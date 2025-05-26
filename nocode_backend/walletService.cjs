const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const { toB64 } = require('@mysten/sui.js/utils');
const { SuiClient } = require('@mysten/sui.js/client');
const { GraphQLClient, gql } = require('graphql-request');
const { bech32 } = require('bech32');

// Initialize Sui RPC client (optional)
const suiClient = new SuiClient({
  url: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443',
});

// GraphQL endpoint
const GRAPHQL_ENDPOINT = 'https://sui-testnet.mystenlabs.com/graphql';
const gqlClient = new GraphQLClient(GRAPHQL_ENDPOINT);

/**
 * Generate a Bech32-encoded password from a 33-byte extended public key
 * @param {Buffer} pubKeyBytes - 32-byte Ed25519 public key
 * @param {string} prefix - Bech32 prefix
 * @returns {string} Bech32 encoded string
 */
function generateBech32FromPubKey(pubKeyBytes, prefix = 'pw') {
  if (pubKeyBytes.length !== 32) {
    throw new Error('Public key must be 32 bytes');
  }

  // Append 0x00 to get 33-byte buffer
  const extendedKey = Buffer.concat([pubKeyBytes, Buffer.from([0x00])]);
  const words = bech32.toWords(extendedKey);
  return bech32.encode(prefix, words);
}

/**
 * Generate a new Sui wallet
 * @returns {Object} Object containing wallet address, private key, and Bech32 password
 */
function generateWallet() {
  try {
   
    const keypair = Ed25519Keypair.generate();
    
    const address = keypair.getPublicKey().toSuiAddress()
    console.log("Address: ",address);
    const secretKey = keypair.getSecretKey();
    return {
      address,
      privateKey: keypair,
      secretKey:secretKey

    }
  } catch (error) {
    console.error('Error generating Sui wallet:', error);
    throw new Error('Failed to generate wallet: ' + error.message);
  }
}

/**
 * Get the balance of a Sui wallet using GraphQL
 * @param {string} address Wallet address
 * @returns {Object} Balance information
 */
async function getWalletBalance(address) {
  console.log("Address is: ", address);
  try {
    const query = gql`
      query GetWalletBalance($addr: String!) {
        address(address: $addr) {
          address
          balance {
            coinType {
              repr
            }
            coinObjectCount
            totalBalance
          }
          coins {
            nodes {
              contents {
                type {
                  repr
                }
              }
            }
          }
        }
      }
    `;

    const variables = { addr: address };
    const data = await gqlClient.request(query, variables);

    return {
      address: data.address.address,
      balance: data.address.balance.totalBalance,
      coinType: data.address.balance.coinType.repr,
      coinObjectCount: data.address.balance.coinObjectCount,
      raw: data
    };
  } catch (error) {
    console.error('Error fetching wallet balance via GraphQL:', error);
    throw new Error('Failed to fetch wallet balance: ' + error.message);
  }
}

module.exports = {
  generateWallet,
  getWalletBalance
};