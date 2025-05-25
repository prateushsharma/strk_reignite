import requests
import redis
import json
import time
from datetime import datetime, timezone

# Initialize Redis Pub/Sub
redis_host = 'localhost'  # Redis server address
redis_port = 6379         # Redis server port
redis_channel = 'binance_data'  # Redis pub/sub channel name
r = redis.Redis(host=redis_host, port=redis_port)

# Function to fetch candlestick data for SUIUSDC
def fetch_candlesticks(symbol="SUIUSDC", interval="1m", limit=500):
    url = "https://api.binance.com/api/v3/klines"
    params = {
        "symbol": symbol,
        "interval": interval,
        "limit": limit
    }
    response = requests.get(url, params=params)
    data = response.json()

    # Parse the data into a useful format
    parsed = []
    for candle in data:
        parsed.append({
            'timestamp': datetime.fromtimestamp(candle[0] / 1000, timezone.utc).strftime('%Y-%m-%d %H:%M:%S'),
            'open': float(candle[1]),
            'high': float(candle[2]),
            'low': float(candle[3]),
            'close': float(candle[4]),
            'volume': float(candle[5]),
            'close_time': datetime.fromtimestamp(candle[6] / 1000, timezone.utc).strftime('%Y-%m-%d %H:%M:%S'),
            'quote_asset_volume': float(candle[7]),
            'number_of_trades': int(candle[8]),
            'taker_buy_base_asset_volume': float(candle[9]),
            'taker_buy_quote_asset_volume': float(candle[10]),
        })
    
    return parsed

def check_shutdown_event(shutdown_event):
    if shutdown_event and shutdown_event.is_set():
        return True
    return False

# Function to fetch and publish data every minute
def start_binance_data_publisher(symbol="SUIUSDC", shutdown_event=None):
    iteration = 0
    print(f"        [INIT] -> 🚀 Starting Publisher on Redis Server")

    try:
        while not check_shutdown_event(shutdown_event):
            time.sleep(5)
            iteration += 1

            try:
                # Fetch the last 500 candlesticks
                data = fetch_candlesticks(symbol=symbol, interval="1m", limit=500)
                if check_shutdown_event(shutdown_event):
                    break
                print("---")
                print(f"[INFO] -> Iteration {iteration}: Retrieved {len(data)} candlestick entries for symbol '{symbol}'.")

                # ✅ Print the most recent candle info
                latest_candle = data[-1]  # Get the most recent one
                print(f"[DATA] -> Latest Candle:")
                print(f"         Time:   {latest_candle['timestamp']}")
                print(f"         Open:   {latest_candle['open']}")
                print(f"         High:   {latest_candle['high']}")
                print(f"         Low:    {latest_candle['low']}")
                print(f"         Close:  {latest_candle['close']}")
                print(f"         Volume: {latest_candle['volume']}")
                
                data_object = {
                    "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    "candlesticks": data
                }

                try:
                    r.publish(redis_channel, json.dumps(data_object))
                    print(f"[INFO] -> 📤 Published: Iter {iteration} on Redis Server")
                except redis.RedisError as redis_err:
                    print(f"[ERROR] -> ❌ Redis publish error: {redis_err}")

            except requests.RequestException as req_err:
                print(f"[ERROR] -> ❌ API request error during iteration {iteration}: {req_err}")
            except Exception as e:
                print(f"[ERROR] -> ❌ Unexpected error during iteration {iteration}: {e}")

    except Exception as loop_error:
        print(f"[ERROR] -> ❌ Publisher loop error: {loop_error}")

    finally:
        print("[THREAD TERMINATION REQUEST] -> 🔴 PUBLISHER connection closed — termination flag received.")
