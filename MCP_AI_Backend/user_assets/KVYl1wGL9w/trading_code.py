


import os
import redis
import json
import requests
import time
from pydantic import BaseModel

def ensure_json(wallet):
    # Check if wallet is a dictionary
    if isinstance(wallet, dict):
        # If it's a dictionary, convert it to JSON string
        wallet_json = json.dumps(wallet, indent=2)
        print("Converted to JSON")
        # print(wallet_json)
        return wallet_json  # Return the JSON string
    elif isinstance(wallet, str):
        # If it's already a string (possibly JSON), skip
        try:
            # Try parsing the JSON string to verify if it's valid JSON
            json.loads(wallet)
            print("Already in JSON format, no conversion needed.")
            return wallet  # It's already a valid JSON string, return as-is
        except json.JSONDecodeError:
            # If it's a string but not valid JSON
            print("String is not valid JSON.")
            return None  # or handle error as needed
    else:
        print("Wallet is neither a dictionary nor a JSON string.")
        return None  # Handle the case where it's neither a dict nor a JSON string

# Define the Wallet and SwapRequest models using Pydantic
class Wallet(BaseModel):
    address: str
    privateKey: dict
    secretKey: str

class SwapRequest(BaseModel):
    wallet: Wallet
    fromCoin: str
    toCoin: str

# Function to call the /swap endpoint using requests
def swap(wallet, from_coin, to_coin):
    url = "http://localhost:5000/swap"
    
    # Prepare the payload for the swap request
    swap_request = SwapRequest(
        wallet=wallet,  # Pass the wallet object
        fromCoin=from_coin,
        toCoin=to_coin
    )
    
    # Convert the Pydantic model to a dictionary to send in the request
    swap_payload = swap_request.dict()  # This will serialize the model to a dictionary

    # Send the POST request to the /swap endpoint
    try:
        response = requests.post(url, json=swap_payload)
        response_json = response.json()

        if response.status_code == 200 and response_json.get("success", False):
            print(f"Swap successful: {response_json}")
            return response_json  # Return the response if success
        else:
            print(f"Swap failed, no change in status. Error: {response_json}")
            return None
    except Exception as e:
        print(f"Error during swap request: {e}")
        return None

def candle_generator(redis_host='localhost', redis_port=6379, channel='binance_data'):
    r = redis.Redis(host=redis_host, port=redis_port)
    pubsub = r.pubsub()
    pubsub.subscribe(channel)
    
    # Wait for subscription confirmation
    while True:
        msg = pubsub.get_message()
        if msg and msg['type'] == 'subscribe':
            print(f"✅ Successfully subscribed to {channel}")
            break
    
    try:
        while True:
            message = pubsub.get_message(timeout=0.5)
            
            if message and message['type'] == 'message':
                try:
                    data = json.loads(message['data'])
                    print(f"📩 Received batch at {data['timestamp']}")
                    
                    # Yield the data exactly as it comes from your publisher
                    yield data
                    
                except json.JSONDecodeError:
                    print("⚠️ Invalid JSON received")
                except KeyError as e:
                    print(f"⚠️ Missing expected field in data: {e}")
                except Exception as e:
                    print(f"⚠️ Error processing message: {e}")
                    
    finally:
        pubsub.close()
        print("🔴 Redis connection closed")

def agent_code(data):
    close_price = data['candlesticks'][-1]['close']
    if close_price == 3.25:
        decision_to_buy_or_sell = 'buy'
    elif close_price == 3.3:
        decision_to_buy_or_sell = 'sell'
    else:
        decision_to_buy_or_sell = 'hold'
    return decision_to_buy_or_sell

# Example usage
if __name__ == "__main__":
    wallet = {
  "address": "0x95d2aba0a884e94b2e1656a259fa29b52ca36c6b28ce2dc07c3f7e706c50bd39",
  "privateKey": {
    "keypair": {
      "publicKey": {
        "0": 130,
        "1": 254,
        "2": 149,
        "3": 255,
        "4": 226,
        "5": 226,
        "6": 217,
        "7": 3,
        "8": 73,
        "9": 219,
        "10": 122,
        "11": 207,
        "12": 20,
        "13": 211,
        "14": 46,
        "15": 160,
        "16": 186,
        "17": 143,
        "18": 144,
        "19": 213,
        "20": 196,
        "21": 63,
        "22": 89,
        "23": 214,
        "24": 69,
        "25": 236,
        "26": 222,
        "27": 176,
        "28": 188,
        "29": 85,
        "30": 110,
        "31": 83
      },
      "secretKey": {
        "0": 37,
        "1": 219,
        "2": 90,
        "3": 12,
        "4": 165,
        "5": 243,
        "6": 133,
        "7": 65,
        "8": 173,
        "9": 107,
        "10": 164,
        "11": 218,
        "12": 147,
        "13": 211,
        "14": 192,
        "15": 164,
        "16": 144,
        "17": 66,
        "18": 69,
        "19": 239,
        "20": 122,
        "21": 142,
        "22": 173,
        "23": 165,
        "24": 8,
        "25": 6,
        "26": 129,
        "27": 5,
        "28": 58,
        "29": 172,
        "30": 115,
        "31": 124,
        "32": 130,
        "33": 254,
        "34": 149,
        "35": 255,
        "36": 226,
        "37": 226,
        "38": 217,
        "39": 3,
        "40": 73,
        "41": 219,
        "42": 122,
        "43": 207,
        "44": 20,
        "45": 211,
        "46": 46,
        "47": 160,
        "48": 186,
        "49": 143,
        "50": 144,
        "51": 213,
        "52": 196,
        "53": 63,
        "54": 89,
        "55": 214,
        "56": 69,
        "57": 236,
        "58": 222,
        "59": 176,
        "60": 188,
        "61": 85,
        "62": 110,
        "63": 83
      }
    }
  },
  "secretKey": "suiprivkey1qqjakksv5hec2sdddwjd4y7nczjfqsj9aaagatd9pqrgzpf643ehc7rwwyt"
}
    wallet = ensure_json(wallet)
    try:
        curr_status = "liq"
        for data in candle_generator():
            if not data.get('candlesticks'):
                continue
            
            decision = agent_code(data)
            print(f"Decision: {decision}")

            if decision == "buy" and curr_status == "liq":
                # Call swap from USDC to SUI (buy scenario)
                print("Initiating swap from USDC to SUI...")
                response = swap(wallet, "USDC", "SUI")
                if response: 
                    curr_status = "tkn"  # Change status to token
                    decision = "buy"
            
            elif decision == "buy" and curr_status == "tkn":
                # No action needed as already in tokens (tkn)
                decision = "hold"
            
            elif decision == "sell" and curr_status == "liq":
                # No action needed as already in liquidity (liq)
                decision = "hold"
            
            elif decision == "sell" and curr_status == "tkn":
                # Call swap from SUI to USDC (sell scenario)
                print("Initiating swap from SUI to USDC...")
                response = swap(wallet, "SUI", "USDC")
                if response: 
                    curr_status = "liq"  # Change status to liquidity
                    decision = "sell"
            
            log_file_path = "./user_assets/KVYl1wGL9w/data_log.txt"
            with open(log_file_path, 'a') as f:
                f.write(f"Decision: {decision} at {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
                print(f"Logged decision: {decision}")
            
            ### Main Tasks
            ## Call endpoint here to send swap request
            ## Also log the decision to data_log.txt
            ## Add get_logs endpoint to main.py
            # latest = data['candlesticks'][-1]
            # print(f"🕯️ Latest Candle - Close: {latest['close']}, Volume: {latest['volume']}")
            # print("---")
            
    except KeyboardInterrupt:
        print("\n🛑 Stopped by user")
    except Exception as e:
        print(f"💥 Fatal error: {e}")
