import subprocess
import json
import sqlite3
from pathlib import Path

async def deploy_code(uid: str, password: str) -> dict:
    """Deploy trading code in a new terminal window (runs indefinitely)"""
    try:
        ftype = "trading_code.py"
        file_path = Path(f"./user_assets/{uid}/{ftype}")
        
        if not file_path.exists():
            return {"status": "error", "message": f"File {file_path} does not exist"}

        # Set terminal window title
        window_title = f"{uid}_{password}_python"
        print(f"Window title to Deploy: {window_title}")

        # Launch the process in a new console
        process = subprocess.Popen(
            ["cmd", "/k", f"title {window_title} && call venv\\Scripts\\activate && python {file_path}"],
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )

        pid = process.pid
        print(f"Started process with PID: {pid}")

        # Insert PID into database
        try:
            conn = sqlite3.connect("./core_db/users.db")
            cursor = conn.cursor()

            # Create the table if it doesn't exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS pid_data (
                    uid TEXT PRIMARY KEY NOT NULL UNIQUE,
                    user_password TEXT NOT NULL,
                    pid INTEGER NOT NULL UNIQUE
                )
            """)

            # Insert new entry (overwrite if exists)
            cursor.execute("INSERT OR REPLACE INTO pid_data (uid, user_password, pid) VALUES (?, ?, ?)", (uid, password, pid))
            conn.commit()
            conn.close()
        except Exception as db_error:
            return {"status": "error", "message": f"Database error: {str(db_error)}"}

        # Update deployment status in code_sync.json
        try:
            sync_path = Path(f"./user_assets/{uid}/code_sync.json")
            with open(sync_path, "r") as json_file:
                data = json.load(json_file)
            data["deploy_status"] = True
            with open(sync_path, "w") as json_file:
                json.dump(data, json_file, indent=4)
            clear_log_path = Path(f"./user_assets/{uid}/data_log.txt")
            with open(clear_log_path, "w") as f:
                f.close()
        except Exception as file_error:
            return {"status": "error", "message": f"Failed to update code_sync.json: {str(file_error)}"}

        return {"status": "success", "message": "Deployed successfully."}

    except Exception as e:
        return {"status": "error", "message": f"Unexpected error: {str(e)}"}
