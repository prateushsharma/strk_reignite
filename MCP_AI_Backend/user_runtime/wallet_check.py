import os
import json
from uid_management.wallet_generator import get_wallet

async def ensure_wallet(uid: str):
    path = f"./user_assets/{uid}/wallet_sync.json"
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(path), exist_ok=True)
    
    # Load or initialize the JSON file
    data = {}
    try:
        if os.path.exists(path):
            with open(path, "r") as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError as e:
                    print(f"Error loading JSON from {path}: {e}")
                    data = {}
        else:
            data = {}
    except OSError as e:
        # If there's an error reading the file or directory
        print(f"Error accessing the file system at {path}: {e}")
        return {
            "status": "error",
            "message": "There was an issue accessing the file system. Please try again later."
        }
    
    # Check if "wallet" key already exists
    if "wallet" in data:
        return {"status": "success", "update": False}

    try:
        result = await get_wallet()
        if result["status"] == "success":
            data["wallet"] = result["wallet"]
            try:
                with open(path, "w") as f:
                    json.dump(data, f, indent=2)
            except OSError as e:
                # If there's an error writing to the file
                print(f"Error writing to file {path}: {e}")
                return {
                    "status": "error",
                    "message": "There was an issue saving the wallet. Please try again later."
                }
            return {"status": "success", "update": True}
        else:
            # If get_wallet result is not successful
            print(f"Error getting wallet: {result}")
            return {
                "status": "error",
                "message": "Wallet access server is busy and facing issues right now, please try again later."
            }
    except Exception as e:
        # Catch any unexpected errors during the wallet fetch
        print(f"Unexpected error while getting wallet: {e}")
        return {
            "status": "error",
            "message": "Unexpected error occurred. Please try again later."
        }

