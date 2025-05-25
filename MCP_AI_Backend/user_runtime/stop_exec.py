import psutil
import sqlite3
import json

async def kill_code(uid: str, password: str):
    try:
        # Connect to your SQLite DB
        conn = sqlite3.connect("./core_db/users.db")
        cursor = conn.cursor()

        # Fetch the PID for the given uid and password
        cursor.execute("SELECT pid FROM pid_data WHERE uid = ? AND user_password = ?", (uid, password))
        result = cursor.fetchone()

        if not result:
            return {"status": "error", "message": "No process found for the given credentials."}

        pid = result[0]

        # Access the parent process (cmd)
        parent_process = psutil.Process(pid)

        # Get child processes (usually 2: Python and its subprocess)
        children = parent_process.children(recursive=True)

        # Kill up to two child processes
        killed = 0
        for child in children:
            try:
                child.terminate()
                child.wait(timeout=3)
                print(f"Process with PID {child.pid} terminated.")
                killed += 1
                if killed == 2:
                    break
            except psutil.NoSuchProcess:
                print(f"Child PID {child.pid} already terminated.")
            except Exception as e:
                print(f"Failed to terminate PID {child.pid}: {e}")

        # Skip terminating or waiting on the parent `cmd.exe`

        # Remove entry from DB
        cursor.execute("DELETE FROM pid_data WHERE uid = ? AND user_password = ?", (uid, password))
        conn.commit()
        conn.close()

        json_path = f"./user_assets/{uid}/code_sync.json"

        # Read JSON as a Python dictionary
        with open(json_path, "r") as f:
            data = json.load(f)

        # Modify the dictionary
        data["deploy_status"] = False

        # Write it back as JSON
        with open(json_path, "w") as f:
            json.dump(data, f, indent=4)
        return {"status": "success", "message": "The code has been terminated successfully"}

    except psutil.NoSuchProcess:
        return {"status": "error", "message": "The process with the given PID does not exist."}
    except psutil.AccessDenied:
        return {"status": "error", "message": "Permission denied to terminate the process."}
    except Exception as e:
        return {"status": "error", "message": f"An unexpected error occurred: {str(e)}"}
