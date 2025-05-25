import os
import json

async def get_user_wallet_address(uid: str):
    user_dir = f"./user_assets/{uid}"
    
    # Step 1: Check if user directory exists
    if not os.path.exists(user_dir):
        return {"status": "error", "message": "404 not found, the uid doesn't exist"}
    
    wallet_file = os.path.join(user_dir, "wallet_sync.json")
    
    # Step 2: Check if wallet_sync.json exists and read it
    if not os.path.exists(wallet_file):
        return {"status": "error", "message": "User didn't initialise a wallet for this uid"}

    try:
        with open(wallet_file, mode='r') as f:
            data = json.load(f)
    except (json.JSONDecodeError, IOError):
        return {"status": "error", "message": "Unable to read or parse wallet file"}
    
    # Step 3: Check for "wallet" key
    if "wallet" not in data:
        return {"status": "error", "message": "User didn't initialise a wallet for this uid"}
    
    wallet_data = data["wallet"]
    
    # Step 4: Check for "address" key
    if "address" not in wallet_data:
        return {"status": "error", "message": "Wallet was initialised with an unknown key, unable to fetch the address"}
    
    # Step 5: Return success with address
    return {"status": "success", "address": wallet_data["address"]}
