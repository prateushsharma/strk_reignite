import redis
import json
import time

REDIS_HOST = 'localhost'
REDIS_PORT = 6379
CHANNEL_NAME = 'binance_data'

def check_shutdown_event(shutdown_event):
    if shutdown_event and shutdown_event.is_set():
        return True
    return False

def start_binance_data_subscriber(shutdown_event):
    print(f"        [INIT] -> 📡 Starting Subscriber on Redis Server")
    r = redis.Redis(host="localhost", port=6379)
    pubsub = r.pubsub()
    pubsub.subscribe("binance_data")

    try:
        while not check_shutdown_event(shutdown_event):
            message = pubsub.get_message(timeout=0.5)  # non-blocking with timeout
            if message and message['type'] == 'message':
                try:
                    data_object = json.loads(message['data'])
                    print("---")
                    print(f"[INFO] -> 🕒 Received batch at {data_object['timestamp']}, Candles: {len(data_object['candlesticks'])}")
                    latest = data_object['candlesticks'][-1]
                    print(f"[INFO] -> Latest Candle — Time: {latest['timestamp']}, Close: {latest['close']}, Volume: {latest['volume']}")
                except Exception as e:
                    print(f"[ERROR] -> ❌ Failed to process message: {e}")
            time.sleep(1)  # prevent CPU spin
    except Exception as e:
        print(f"[ERROR] -> ❌ Subscriber loop error: {e}")
    finally:
        pubsub.close()
        print("[THREAD TERMINATION REQUEST] -> 🔴 SUBSCRIBER connection closed — termination flag received.")
