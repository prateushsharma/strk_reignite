from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import random

# Create FastAPI app
app = FastAPI()

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Define the Wallet object used in input for swap
class Wallet(BaseModel):
    address: str
    privateKey: dict
    secretKey: str

# Define the request body model for the swap endpoint
class SwapRequest(BaseModel):
    wallet: Wallet  # Full wallet object
    fromCoin: str  # The coin to swap from (e.g., "SUI")
    toCoin: str  # The coin to swap to (e.g., "USDC")

# Define the endpoint to generate wallet (same as before)
@app.post("/api/wallet/generate")
async def generate_wallet():
    return {
        "success": True,
        "wallet": {
            "address": "0x352425ab2c9cec336f16d6856d29cc0ce003b9f157285da951a86a8c6ce490dc",
            "privateKey": {
                "keypair": {
                    "publicKey": {
                        "0": 101,
                        "1": 196,
                        "2": 78,
                        "3": 23,
                        "4": 122,
                        "5": 138,
                        "6": 187,
                        "7": 25,
                        "8": 117,
                        "9": 211,
                        "10": 67,
                        "11": 11,
                        "12": 255,
                        "13": 239,
                        "14": 15,
                        "15": 167,
                        "16": 101,
                        "17": 231,
                        "18": 135,
                        "19": 8,
                        "20": 52,
                        "21": 145,
                        "22": 107,
                        "23": 169,
                        "24": 149,
                        "25": 106,
                        "26": 110,
                        "27": 197,
                        "28": 11,
                        "29": 216,
                        "30": 199,
                        "31": 43
                    },
                    "secretKey": {
                        "0": 208,
                        "1": 0,
                        "2": 66,
                        "3": 168,
                        "4": 84,
                        "5": 164,
                        "6": 10,
                        "7": 231,
                        "8": 77,
                        "9": 249,
                        "10": 140,
                        "11": 113,
                        "12": 99,
                        "13": 195,
                        "14": 12,
                        "15": 85,
                        "16": 78,
                        "17": 31,
                        "18": 51,
                        "19": 116,
                        "20": 156,
                        "21": 248,
                        "22": 64,
                        "23": 101,
                        "24": 158,
                        "25": 111,
                        "26": 127,
                        "27": 101,
                        "28": 70,
                        "29": 101,
                        "30": 127,
                        "31": 49,
                        "32": 101,
                        "33": 196,
                        "34": 78,
                        "35": 23,
                        "36": 122,
                        "37": 138,
                        "38": 187,
                        "39": 25,
                        "40": 117,
                        "41": 211,
                        "42": 67,
                        "43": 11,
                        "44": 255,
                        "45": 239,
                        "46": 15,
                        "47": 167,
                        "48": 101,
                        "49": 231,
                        "50": 135,
                        "51": 8,
                        "52": 52,
                        "53": 145,
                        "54": 107,
                        "55": 169,
                        "56": 149,
                        "57": 106,
                        "58": 110,
                        "59": 197,
                        "60": 11,
                        "61": 216,
                        "62": 199,
                        "63": 43
                    }
                }
            },
            "secretKey": "suiprivkey1qrgqqs4g2jjq4e6dlxx8zc7rp325u8enwjw0ssr9nehh7e2xv4lnzzansjy"
        }
    }

# Define the endpoint to handle coin swap
@app.post("/api/swap")
async def swap(request: SwapRequest):
    # Simulate a transaction hash and swap amounts (this is just a mock, you'd normally call an API to execute the swap)
    
    # Simulate transaction hash (just generating a random string for demo)
    tx_hash = f"0x{random.getrandbits(256):x}"
    
    # Simulate the swap (in a real-world scenario, you'd perform the actual logic here)
    # For simplicity, let's say we give a 95% return due to slippage
    amount_in = int(1000)
    slippage_factor = (100 - 1) / 100
    amount_out = int(amount_in * slippage_factor)

    return {
        "success": True,
        "txHash": tx_hash,
        "amountIn": str(amount_in),  # Return amount in as a string
        "amountOut": str(amount_out)  # Return amount out as a string
    }

# Run the app with Uvicorn on port 5000
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
