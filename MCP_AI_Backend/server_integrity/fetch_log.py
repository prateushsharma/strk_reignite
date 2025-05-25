import os

async def get_datalogs(uid, password):
    log_path = f"./user_assets/{uid}/data_log.txt"
    if os.path.exists(log_path):
        with open(log_path, 'r') as f:
            log_data = f.read()
        return {"status": "success", "log": log_data, "code": 200}
    else:
        return {"status": "error", "message": "Log file not found", "code": 404}