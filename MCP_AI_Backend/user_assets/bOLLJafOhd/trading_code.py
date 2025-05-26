


import os
import redis
import json
import requests
import time
from pydantic import BaseModel
import numpy as np
from datetime import datetime
from scipy.stats import linregress

def compute_trend_slope(data, lookback=20):
    candles = data.get("candlesticks", [])
    if len(candles) < lookback:
        return 0
    prices = [candle["close"] for candle in candles[-lookback:]]
    x = np.arange(len(prices))
    slope, _, _, _, _ = linregress(x, prices)
    return slope

def average_volume(data, lookback=50):
    candles = data.get("candlesticks", [])
    if len(candles) < lookback:
        return 0
    return np.mean([c["volume"] for c in candles[-lookback:]])

def current_volume(data):
    candles = data.get("candlesticks", [])
    if not candles:
        return 0
    return candles[-1]["volume"]

def compute_rsi(data, lookback=14):
    candles = data.get("candlesticks", [])
    if len(candles) < lookback + 1:
        return 0
    closes = np.array([c["close"] for c in candles[-(lookback + 1):]])
    diffs = np.diff(closes)
    up = np.where(diffs > 0, diffs, 0).sum() / lookback
    down = -np.where(diffs < 0, diffs, 0).sum() / lookback
    rs = up / down if down != 0 else 100
    return 100 - (100 / (1 + rs))

def filter_decision(decision, data, risk="low"):
    original_decision = decision
    if risk == "high" or decision == "hold":
        return decision

    trend = compute_trend_slope(data)
    vol = current_volume(data)
    avg_vol = average_volume(data)
    rsi = compute_rsi(data)

    reason = ""
    new_decision = decision

    if decision == "buy":
        if risk == "low":
            if trend < 0.01 or vol < avg_vol:
                new_decision = "hold"
                reason = f"Trend slope ({trend:.4f}) insufficient or volume ({vol:.2f}) below average ({avg_vol:.2f})"
        elif risk == "med":
            if trend < 0:
                new_decision = "hold"
                reason = f"Negative trend slope detected ({trend:.4f})"
    elif decision == "sell":
        if risk == "low":
            if trend > -0.01 or vol < avg_vol or rsi < 60:
                new_decision = "hold"
                reason = f"Trend slope ({trend:.4f}) insufficient, volume ({vol:.2f}) below average ({avg_vol:.2f}), or RSI ({rsi:.2f}) below threshold"
        elif risk == "med":
            if rsi < 50:
                new_decision = "hold"
                reason = f"RSI ({rsi:.2f}) below acceptable threshold (50)"

    if new_decision != original_decision:
        with open(f"./user_assets/bOLLJafOhd/data_log.txt", "a", encoding="utf-8") as f:
            f.write(f"[RISK FILTER] Risk profile '{risk.upper()}' intercepted decision '{original_decision.upper()}' → revised to 'HOLD'. Reason: {reason}.\n")
    else:
        with open(f"./user_assets/bOLLJafOhd/data_log.txt", "a", encoding="utf-8") as f:
            f.write(f"[RISK FILTER] Decision '{original_decision.upper()}' passed with risk profile '{risk.upper()}'. No action taken.\n")

    return new_decision


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
    swap_payload = swap_request.model_dump()   # This will serialize the model to a dictionary

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
    import random
    decision_to_buy_or_sell = random.choice(['buy', 'sell', 'hold'])
    return decision_to_buy_or_sell

# Example usage
if __name__ == "__main__":
    wallet = {"address": "0xd363e99771a3dbacc9a26414ea3d2fe7c79e1c575a7862e7d3514defba1b2616", "privateKey": {"keypair": {"publicKey": {"0": 136, "1": 211, "2": 150, "3": 122, "4": 108, "5": 246, "6": 157, "7": 160, "8": 75, "9": 169, "10": 224, "11": 67, "12": 87, "13": 30, "14": 21, "15": 241, "16": 80, "17": 220, "18": 138, "19": 130, "20": 110, "21": 78, "22": 28, "23": 177, "24": 37, "25": 138, "26": 18, "27": 181, "28": 74, "29": 213, "30": 223, "31": 216}, "secretKey": {"0": 25, "1": 139, "2": 211, "3": 168, "4": 160, "5": 18, "6": 36, "7": 241, "8": 210, "9": 56, "10": 73, "11": 62, "12": 78, "13": 223, "14": 98, "15": 13, "16": 147, "17": 252, "18": 118, "19": 21, "20": 177, "21": 63, "22": 215, "23": 245, "24": 11, "25": 242, "26": 163, "27": 98, "28": 191, "29": 60, "30": 224, "31": 135, "32": 136, "33": 211, "34": 150, "35": 122, "36": 108, "37": 246, "38": 157, "39": 160, "40": 75, "41": 169, "42": 224, "43": 67, "44": 87, "45": 30, "46": 21, "47": 241, "48": 80, "49": 220, "50": 138, "51": 130, "52": 110, "53": 78, "54": 28, "55": 177, "56": 37, "57": 138, "58": 18, "59": 181, "60": 74, "61": 213, "62": 223, "63": 216}}}, "secretKey": "suiprivkey1qqvch5ag5qfzfuwj8pynunklvgxe8lrkzkcnl4l4p0e2xc4l8nsgw0aptnu"}
    # wallet = Wallet(**wallet)
    risk_status = "high"
    log_file_path = "./user_assets/bOLLJafOhd/data_log.txt"
    try:
        curr_status = "liq"
        for data in candle_generator():
            if not data.get('candlesticks'):
                continue
            
            decision = agent_code(data)
            print(f"Agent Decision: {decision}")
            with open(log_file_path, 'a', encoding='utf-8') as f:
                f.write("="*100)
                f.write(f"\n[AGENT EVALUATION] Agent Based Analysis Result: {decision.upper()}\n")
            decision = filter_decision(decision, data, risk_status)
            print(f"Filtered Decision: {decision}")

            if decision == "buy" and curr_status == "liq":
                # Call swap from USDC to SUI (buy scenario)
                print("Initiating swap from USDC to SUI...")
                response = swap(wallet, "USDC", "SUI")
                if response: 
                    curr_status = "tkn"  # Change status to token
                    decision = "buy"
            
            elif decision == "buy" and curr_status == "tkn":
                # No action needed as already in tokens (tkn)
                with open(log_file_path, 'a', encoding='utf-8') as f:
                    f.write("[DECISION] Tokens already acquired, updating decision to 'hold'\n")
                decision = "hold"
            
            elif decision == "sell" and curr_status == "liq":
                # No action needed as already in liquidity (liq)
                with open(log_file_path, 'a', encoding='utf-8') as f:
                    f.write("[DECISION] Liquidity already acquired, updating decision to 'hold'\n")
                decision = "hold"
            
            elif decision == "sell" and curr_status == "tkn":
                # Call swap from SUI to USDC (sell scenario)
                print("Initiating swap from SUI to USDC...")
                response = swap(wallet, "SUI", "USDC")
                if response: 
                    curr_status = "liq"  # Change status to liquidity
                    decision = "sell"

            print(f"Final Decision: {decision}")

            with open(log_file_path, 'a', encoding='utf-8') as f:
                f.write(f"[FINAL DECISION] {decision.upper()} at {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
                print(f"Logged decision: {decision}")
            
            with open(log_file_path, 'a', encoding='utf-8') as f:
                f.write("="*100)
                f.write("\n\n")
            
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
