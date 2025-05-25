import httpx

async def get_wallet():
    url = "http://localhost:5000/api/wallet/generate"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url)
            response.raise_for_status()
            data = response.json()
            return {
                "status": "success",
                "wallet": data.get("wallet")
            }
    except httpx.HTTPError as e:
        print(f"Error in getting wallet: {e}")
        return {
            "status": "error",
            "message": str(e)
        }
    except Exception as e:
        print(f"Unexpected error in getting wallet: {e}")
        return {
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        }
