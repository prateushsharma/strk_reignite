import os
import json
import sys

sys.path.append('..')
from codegen_engine.graph_codegen import gen_code
from utils.json_to_map import map_json

placeholder_code = """
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
        with open(f"./user_assets/{uid}/data_log.txt", "a", encoding="utf-8") as f:
            f.write(f"[RISK FILTER] Risk profile '{risk.upper()}' intercepted decision '{original_decision.upper()}' → revised to 'HOLD'. Reason: {reason}.\\n")
    else:
        with open(f"./user_assets/{uid}/data_log.txt", "a", encoding="utf-8") as f:
            f.write(f"[RISK FILTER] Decision '{original_decision.upper()}' passed with risk profile '{risk.upper()}'. No action taken.\\n")

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
<<>>
    return decision_to_buy_or_sell

# Example usage
if __name__ == "__main__":
    wallet = >><<
    # wallet = Wallet(**wallet)
    risk_status = "<><>"
    log_file_path = "./user_assets/{uid}/data_log.txt"
    try:
        curr_status = "liq"
        for data in candle_generator():
            if not data.get('candlesticks'):
                continue
            
            decision = agent_code(data)
            print(f"Agent Decision: {decision}")
            with open(log_file_path, 'a', encoding='utf-8') as f:
                f.write("="*100)
                f.write(f"\\n[AGENT EVALUATION] Agent Based Analysis Result: {decision.upper()}\\n")
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
                    f.write("[DECISION] Tokens already acquired, updating decision to 'hold'\\n")
                decision = "hold"
            
            elif decision == "sell" and curr_status == "liq":
                # No action needed as already in liquidity (liq)
                with open(log_file_path, 'a', encoding='utf-8') as f:
                    f.write("[DECISION] Liquidity already acquired, updating decision to 'hold'\\n")
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
                f.write(f"[FINAL DECISION] {decision.upper()} at {time.strftime('%Y-%m-%d %H:%M:%S')}\\n")
                print(f"Logged decision: {decision}")
            
            with open(log_file_path, 'a', encoding='utf-8') as f:
                f.write("="*100)
                f.write("\\n\\n")
            
            ### Main Tasks
            ## Call endpoint here to send swap request
            ## Also log the decision to data_log.txt
            ## Add get_logs endpoint to main.py
            # latest = data['candlesticks'][-1]
            # print(f"🕯️ Latest Candle - Close: {latest['close']}, Volume: {latest['volume']}")
            # print("---")
            
    except KeyboardInterrupt:
        print("\\n🛑 Stopped by user")
    except Exception as e:
        print(f"💥 Fatal error: {e}")
"""

async def get_wallet(uid):
    try:
        user_folder = f"./user_assets/{uid}"
        wallet_path = os.path.join(user_folder, "wallet_sync.json")
        with open(wallet_path, 'r') as f:
            wallet_data = json.load(f)
        return wallet_data.get("wallet")
    except Exception as e:
        print(f"Error in getting wallet: {e}")
        return None

async def graph_to_code(uid, password=None, risk="low"):
    try:
        user_folder = f"./user_assets/{uid}"
        code_sync_path = os.path.join(user_folder, "code_sync.json")

        # Check if the user folder exists
        if not os.path.exists(user_folder):
            return {"status": "error", "message": "User folder does not exist", "code": 404}
        
        # Check if the code_sync.json file exists in the folder
        if not os.path.isfile(code_sync_path):
            return {"status": "error", "message": "code_sync.json file not found", "code": 404}
        
        # Read the code_sync.json file
        with open(code_sync_path, 'r') as file:
            code_sync_data = json.load(file)

        # Check if the "deploy_status" field exists in the json and its value
        if code_sync_data.get("deploy_status", False):
            return {"status": "error", "message": "The no code graph is already deployed and no changes are noticed", "code": 400}

        # Copy the content of data_config.json and preprocess using map_json
        with open(user_folder + "/data_config.json", 'r') as file:
            data_config = json.load(file)

        mapped_json = map_json(data_config)

        ### Here we will convert json to code, and then try to deploy it ###
        req, imp, code = gen_code(mapped_json)
        imp2 = imp.copy()
        imp.append("\n\nprint(\"Hello World\")")

        print(code)

        wallet = await get_wallet(uid)
        if not wallet:
            return {"status": "error", "message": "Wallet not found", "code": 404}

        req_path = os.path.join(user_folder, "requirements.txt")
        imp_path = os.path.join(user_folder, "initialise.py")
        code_path = os.path.join(user_folder, "trading_code.py")

        with open(req_path, 'w') as file:
            file.write("\n".join(req))

        # Write each import on a new line
        with open(imp_path, 'w') as file:
            file.write("\n".join(imp))

        indented_code = "\n".join("    " + line for line in code.splitlines())

        # Replace placeholder and combine
        final_code = "\n".join(imp2) + "\n\n" + placeholder_code.replace("{uid}", str(uid)).replace("<<>>", indented_code).replace(">><<", json.dumps(wallet)).replace("<><>", risk)

        with open(code_path, 'w', encoding='utf-8') as file:
            file.write(final_code)

        return {"status": "success", "message": "Deployed successfully", "code": 200}
    except Exception as e:
        return {"status": "error", "message": str(e), "code": 500}