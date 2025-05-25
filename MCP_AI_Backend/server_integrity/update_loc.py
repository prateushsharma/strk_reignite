import sqlite3
import os
import json
import sys

sys.path.append('..')
from utils.graph_preprocess import filter_workflow_json

def safe_json_load(path):
    if not os.path.exists(path):
        print(f"File {path} does not exist")
    if os.path.getsize(path) == 0:
        print(f"File {path} is empty")
    print(f"Loading JSON from {path}")

async def check_and_sync_code(uid: str, code):
    try:
        print(uid, code)
        user_dir = os.path.join("./user_assets", uid)
        data_config_path = os.path.join(user_dir, "data_config.json")
        code_sync_path = os.path.join(user_dir, "code_sync.json")

        # Set "deploy_status" to False in code_sync.json
        with open(code_sync_path, 'r') as f:
            code_sync = json.load(f)

        deploy_status = code_sync.get("deploy_status", False)
        if deploy_status:
            return False, 403

        # Read data_config.json and compare the code
        with open(data_config_path, 'r') as f:
            current_code = json.load(f)

        with open(data_config_path, 'w') as f:
            json.dump(code, f, indent=4)

        if filter_workflow_json(current_code) == filter_workflow_json(code) or current_code == code:
            return False, 200

        code_sync["deploy_status"] = False

        with open(code_sync_path, 'w') as f:
            json.dump(code_sync, f, indent=4)

        return True, 200

    except (FileNotFoundError, json.JSONDecodeError, KeyError, TypeError) as e:
        print(f"Error: {e}")
        return False, 500

async def update_user(uid: str, password: str, code):
    try:
        # Connect to the database
        print("init1")
        conn = sqlite3.connect("./core_db/users.db")
        cursor = conn.cursor()

        # Use parameterized query to avoid SQL injection
        cursor.execute("SELECT user_password FROM users WHERE uid = ?", (uid,))
        rows = cursor.fetchall()

        if len(rows) == 0:
            return {
                "status": "error",
                "message": "UID doesn't exist, bad request",
                "code": 400  # HTTP 400 Bad Request
            }
        elif len(rows) > 1:
            print("Error: Duplicate UID found in the database.")
            return {
                "status": "error",
                "message": "Internal Server Error",
                "code": 500  # HTTP 500 Internal Server Error
            }
        else:
            stored_password = rows[0][0]
            if stored_password != password:
                return {
                    "status": "error",
                    "message": "Permission to access denied",
                    "code": 403  # HTTP 403 Forbidden
                }
            else:
                # Check and sync code
                deploy_status, code_status = await check_and_sync_code(uid, code)
                print(deploy_status, code_status)
                if code_status == 403:
                    return {
                        "status": "error",
                        "message": "Deployed code cannot be updated, please stop the execution first or clone the graph to a new UID",
                        "code": 403
                    }
                if code_status != 200:
                    return {
                        "status": "error",
                        "message": "Internal Server Error",
                        "code": code_status
                    }
                return {
                    "status": "success",
                    "update": deploy_status
                }

    except sqlite3.Error as e:
        return {
            "status": "error",
            "message": f"Database error: {e}",
            "code": 500
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Internal Server Error: {e}",
            "code": 500
        }

    finally:
        if conn:
            conn.close()
