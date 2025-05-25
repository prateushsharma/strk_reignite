import os
import json
import shutil
import sqlite3

async def delete_asset(uid, password):
    db_path = "./core_db/users.db"
    user_assets_dir = f"./user_assets/{uid}"
    code_sync_path = os.path.join(user_assets_dir, "code_sync.json")

    # Step 1: Verify user credentials
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE uid = ? AND user_password = ?", (uid, password))
        result = cursor.fetchone()
        conn.close()

        if not result:
            return {
                "status": "error",
                "message": "Authentication failed: Invalid UID or password."
            }
    except sqlite3.Error as e:
        return {
            "status": "error",
            "message": f"Database error during authentication: {e}"
        }

    # Step 2: Check deploy_status in code_sync.json
    if not os.path.exists(code_sync_path):
        return {
            "status": "error",
            "message": "Missing code_sync.json: Cannot verify deployment status."
        }

    try:
        with open(code_sync_path, "r") as f:
            code_sync = json.load(f)
    except json.JSONDecodeError:
        return {
            "status": "error",
            "message": "Invalid JSON format in code_sync.json."
        }

    if code_sync.get("deploy_status") is True:
        return {
            "status": "error",
            "message": "Asset is currently deployed. Please stop the deployment before deletion."
        }

    # Step 3: Delete user asset directory
    try:
        shutil.rmtree(user_assets_dir)
    except FileNotFoundError:
        return {
            "status": "error",
            "message": "User asset directory not found."
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error deleting user assets: {e}"
        }

    # Step 4: Remove user entry from the database
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE uid = ? AND user_password = ?", (uid, password))
        conn.commit()
        conn.close()
    except sqlite3.Error as e:
        return {
            "status": "error",
            "message": f"Database error during deletion: {e}"
        }

    return {
        "status": "success",
        "message": "User asset and credentials successfully deleted."
    }
