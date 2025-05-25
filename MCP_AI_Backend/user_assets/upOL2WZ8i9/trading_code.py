


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
        with open(f"./user_assets/upOL2WZ8i9/data_log.txt", "a", encoding="utf-8") as f:
            f.write(f"[RISK FILTER] Risk profile '{risk.upper()}' intercepted decision '{original_decision.upper()}' → revised to 'HOLD'. Reason: {reason}.\n")
    else:
        with open(f"./user_assets/upOL2WZ8i9/data_log.txt", "a", encoding="utf-8") as f:
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
    volume = data['candlesticks'][-1]['volume']  
    if volume > 100:
        decision_to_buy_or_sell = "buy"
    else:
        decision_to_buy_or_sell = "sell"
    return decision_to_buy_or_sell

# Example usage
if __name__ == "__main__":
    wallet = {"address": "0xbcee51bb90e8f07e91365c7b4fd4cd2b9af92637ae1c8b4c93e895ad18b0c9a1", "privateKey": {"keypair": {"publicKey": {"0": 179, "1": 185, "2": 197, "3": 202, "4": 57, "5": 53, "6": 190, "7": 41, "8": 62, "9": 207, "10": 82, "11": 250, "12": 196, "13": 39, "14": 103, "15": 54, "16": 252, "17": 214, "18": 153, "19": 107, "20": 173, "21": 239, "22": 154, "23": 188, "24": 229, "25": 62, "26": 77, "27": 13, "28": 21, "29": 181, "30": 104, "31": 220}, "secretKey": {"0": 244, "1": 202, "2": 176, "3": 19, "4": 19, "5": 111, "6": 80, "7": 172, "8": 254, "9": 214, "10": 69, "11": 119, "12": 200, "13": 188, "14": 166, "15": 135, "16": 200, "17": 235, "18": 132, "19": 78, "20": 48, "21": 147, "22": 164, "23": 203, "24": 68, "25": 38, "26": 66, "27": 244, "28": 223, "29": 254, "30": 95, "31": 81, "32": 179, "33": 185, "34": 197, "35": 202, "36": 57, "37": 53, "38": 190, "39": 41, "40": 62, "41": 207, "42": 82, "43": 250, "44": 196, "45": 39, "46": 103, "47": 54, "48": 252, "49": 214, "50": 153, "51": 107, "52": 173, "53": 239, "54": 154, "55": 188, "56": 229, "57": 62, "58": 77, "59": 13, "60": 21, "61": 181, "62": 104, "63": 220}}}, "secretKey": "suiprivkey1qr6v4vqnzdh4pt876ezh0j9u56ru36uyfccf8fxtgsny9axlle04zqfak7z"}
    # wallet = Wallet(**wallet)
    risk_status = "high"
    log_file_path = "./user_assets/upOL2WZ8i9/data_log.txt"
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
