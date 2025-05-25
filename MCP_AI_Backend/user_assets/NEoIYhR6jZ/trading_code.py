import random


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
    decision_to_buy_or_sell = random.choice(['buy', 'sell', 'hold'])
    return decision_to_buy_or_sell

# Example usage
if __name__ == "__main__":
    wallet = {
  "address": "0x9f97435926b69e655c5de8548c275c35884cdfceffbd2276fa0496b7e0020549",
  "privateKey": {
    "keypair": {
      "publicKey": {
        "0": 232,
        "1": 70,
        "2": 164,
        "3": 33,
        "4": 144,
        "5": 158,
        "6": 203,
        "7": 131,
        "8": 155,
        "9": 186,
        "10": 207,
        "11": 11,
        "12": 233,
        "13": 161,
        "14": 62,
        "15": 5,
        "16": 31,
        "17": 184,
        "18": 129,
        "19": 38,
        "20": 68,
        "21": 211,
        "22": 12,
        "23": 83,
        "24": 139,
        "25": 188,
        "26": 101,
        "27": 183,
        "28": 191,
        "29": 204,
        "30": 96,
        "31": 43
      },
      "secretKey": {
        "0": 70,
        "1": 28,
        "2": 182,
        "3": 123,
        "4": 62,
        "5": 128,
        "6": 214,
        "7": 207,
        "8": 158,
        "9": 157,
        "10": 103,
        "11": 126,
        "12": 33,
        "13": 104,
        "14": 174,
        "15": 43,
        "16": 174,
        "17": 192,
        "18": 235,
        "19": 147,
        "20": 200,
        "21": 107,
        "22": 218,
        "23": 98,
        "24": 88,
        "25": 233,
        "26": 198,
        "27": 246,
        "28": 0,
        "29": 27,
        "30": 51,
        "31": 4,
        "32": 232,
        "33": 70,
        "34": 164,
        "35": 33,
        "36": 144,
        "37": 158,
        "38": 203,
        "39": 131,
        "40": 155,
        "41": 186,
        "42": 207,
        "43": 11,
        "44": 233,
        "45": 161,
        "46": 62,
        "47": 5,
        "48": 31,
        "49": 184,
        "50": 129,
        "51": 38,
        "52": 68,
        "53": 211,
        "54": 12,
        "55": 83,
        "56": 139,
        "57": 188,
        "58": 101,
        "59": 183,
        "60": 191,
        "61": 204,
        "62": 96,
        "63": 43
      }
    }
  },
  "secretKey": "suiprivkey1qprpednm86qddnu7n4nhugtg4c46as8tj0yxhknztr5udasqrvesg5y3wvf"
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
            
            log_file_path = "./user_assets/NEoIYhR6jZ/data_log.txt"
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
