import os
import shutil
import json
import sqlite3

async def clone_code(uid_to, password_to, uid_from, password_from):
    db_path = "./core_db/users.db"
    user_assets_dir = "./user_assets"

    # Step 1: Verify credentials using sqlite3
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE uid = ? AND user_password = ?", (uid_from, password_from))
        result = cursor.fetchone()
        conn.close()

        if result is None:
            return {
                "status": "error",
                "message": "Authentication error: Source UID or password is invalid."
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Database error: {str(e)}"
        }

    # Step 2: Clone files from uid_from to uid_to
    src_dir = os.path.join(user_assets_dir, uid_from)
    dst_dir = os.path.join(user_assets_dir, uid_to)

    if not os.path.isdir(src_dir) or not os.path.isdir(dst_dir):
        return {
            "status": "error",
            "message": "Source or target project folder is missing."
        }

    try:
        for filename in os.listdir(src_dir):
            src_file = os.path.join(src_dir, filename)
            dst_file = os.path.join(dst_dir, filename)

            if os.path.isfile(src_file):
                with open(src_file, 'r') as fsrc:
                    content = fsrc.read()
                with open(dst_file, 'w') as fdst:
                    fdst.write(content)
    except Exception as e:
        return {
            "status": "error",
            "message": f"File cloning error: {str(e)}"
        }

    # Step 3: Overwrite code_sync.json in target directory
    try:
        code_sync = {
            "deploy_status": False,
            "clone_status": True,
            "cloned_from_uid": uid_from,
            "cloned_from_password": password_from,
        }
        code_sync_path = os.path.join(dst_dir, "code_sync.json")
        with open(code_sync_path, 'w') as f:
            json.dump(code_sync, f, indent=4)
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to clone graph: {str(e)}"
        }

    return {
        "status": "success",
        "uid": uid_to,
        "message": "Project code successfully cloned and synchronized."
    }
