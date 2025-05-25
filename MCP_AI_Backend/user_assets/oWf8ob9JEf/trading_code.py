import random


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
        with open(f"./user_assets/oWf8ob9JEf/data_log.txt", "a", encoding="utf-8") as f:
            f.write(f"[RISK FILTER] Risk profile '{risk.upper()}' intercepted decision '{original_decision.upper()}' → revised to 'HOLD'. Reason: {reason}.\n")
    else:
        with open(f"./user_assets/oWf8ob9JEf/data_log.txt", "a", encoding="utf-8") as f:
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
    decision_to_buy_or_sell = random.choice(["buy", "sell", "hold"])
    return decision_to_buy_or_sell

# Example usage
if __name__ == "__main__":
    wallet = {"address": "0xff36313eeacf524fbe948c167b0e225ab0c10da9bf5998dc14b85050fc35ae3f", "privateKey": {"keypair": {"publicKey": {"0": 60, "1": 227, "2": 70, "3": 55, "4": 188, "5": 231, "6": 163, "7": 181, "8": 117, "9": 63, "10": 249, "11": 73, "12": 208, "13": 89, "14": 47, "15": 13, "16": 135, "17": 73, "18": 74, "19": 118, "20": 123, "21": 79, "22": 172, "23": 203, "24": 28, "25": 187, "26": 7, "27": 189, "28": 241, "29": 112, "30": 157, "31": 253}, "secretKey": {"0": 108, "1": 235, "2": 112, "3": 41, "4": 21, "5": 205, "6": 184, "7": 234, "8": 117, "9": 201, "10": 137, "11": 172, "12": 74, "13": 13, "14": 108, "15": 213, "16": 29, "17": 134, "18": 200, "19": 99, "20": 39, "21": 151, "22": 200, "23": 41, "24": 56, "25": 10, "26": 156, "27": 243, "28": 110, "29": 123, "30": 27, "31": 186, "32": 60, "33": 227, "34": 70, "35": 55, "36": 188, "37": 231, "38": 163, "39": 181, "40": 117, "41": 63, "42": 249, "43": 73, "44": 208, "45": 89, "46": 47, "47": 13, "48": 135, "49": 73, "50": 74, "51": 118, "52": 123, "53": 79, "54": 172, "55": 203, "56": 28, "57": 187, "58": 7, "59": 189, "60": 241, "61": 112, "62": 157, "63": 253}}}, "secretKey": "suiprivkey1qpkwkupfzhxm36n4exy6cjsddn23mpkgvvne0jpf8q9feumw0vdm58e0mk3"}
    # wallet = Wallet(**wallet)
    risk_status = "high"
    log_file_path = "./user_assets/oWf8ob9JEf/data_log.txt"
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
