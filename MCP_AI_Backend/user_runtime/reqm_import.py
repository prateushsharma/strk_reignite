import os
import subprocess
import json
import time
from pathlib import Path

async def handle_req_import(uid: str, password: str) -> dict:
    ftype = "initialise.py"
    file_path = Path(f"./user_assets/{uid}/{ftype}")
    window_title = f"{uid}_{password}_python_init"
    log_file = Path(f"./user_assets/{uid}/python_init.log")
    exit_code_file = Path(f"./user_assets/{uid}/python_init.exitcode")

    # Cleanup any previous files
    for f in [log_file, exit_code_file]:
        if f.exists():
            f.unlink()

    try:
        # Create the command sequence
        commands = [
            f"title {window_title}",
            "call venv\\Scripts\\activate",
            f"python {file_path} > {log_file} 2>&1",
            f"echo %errorlevel% > {exit_code_file}",
            "exit"
        ]

        # Start the process in a new console
        process = subprocess.Popen(
            ["cmd", "/c", " && ".join(commands)],
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )

        # Wait for process completion with timeout
        try:
            process.wait(timeout=30)  # 30 second timeout for Python script
        except subprocess.TimeoutExpired:
            process.kill()
            return {"status": "error", "message": "Script execution timed out"}

        # Verify exit code file was created
        if not exit_code_file.exists():
            return {"status": "error", "message": "Failed to capture exit code"}

        with open(exit_code_file, "r") as f:
            exit_code = int(f.read().strip())

        # Check the output
        with open(log_file, "r") as f:
            output = f.read().strip()

        if exit_code == 0 and output == "Hello World":
            return {"status": "success", "message": "Imports checked and output verified"}
        elif exit_code != 0:
            return {"status": "error", "message": f"Script failed with exit code {exit_code}: {output}"}
        else:
            return {"status": "error", "message": f"Unexpected output: {output}. Expected 'Hello World'"}

    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        # Force kill the terminal window if it's still open
        subprocess.call(f'taskkill /fi "WindowTitle eq {window_title}" /f >nul 2>&1', shell=True)
        # Cleanup temporary files
        for f in [log_file, exit_code_file]:
            try:
                if f.exists():
                    f.unlink()
            except:
                pass

# # # Test
# result = handle_reqm_import("wz2K93PDkc", "abcd")
# print(json.dumps(result, indent=2))