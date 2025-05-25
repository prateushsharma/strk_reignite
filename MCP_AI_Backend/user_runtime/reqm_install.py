import os
import subprocess
import json
import time
from pathlib import Path

async def handle_req_install(uid: str, password: str) -> dict:
    ftype = "requirements.txt"

    file_path = Path(f"./user_assets/{uid}/{ftype}")
    if not file_path.exists():
        return {"status": "error", "message": f"File {file_path} does not exist"}

    window_title = f"{uid}_{password}_pip_install"
    log_file = Path(f"./user_assets/{uid}/pip_install.log")
    exit_code_file = Path(f"./user_assets/{uid}/pip_install.exitcode")

    # Cleanup any previous files
    for f in [log_file, exit_code_file]:
        if f.exists():
            f.unlink()

    try:
        # Create the command sequence
        commands = [
            f"title {window_title}",
            "call venv\\Scripts\\activate",
            f"pip install -r {file_path} > {log_file} 2>&1",
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
            process.wait(timeout=300)  # 5 minute timeout
        except subprocess.TimeoutExpired:
            process.kill()
            return {"status": "error", "message": "Installation timed out"}

        # Verify exit code file was created
        if not exit_code_file.exists():
            return {"status": "error", "message": "Failed to capture exit code"}

        with open(exit_code_file, "r") as f:
            exit_code = int(f.read().strip())

        if exit_code == 0:
            return {"status": "success"}
        else:
            with open(log_file, "r") as f:
                error_output = f.read()
            return {"status": "error", "message": f"pip install failed: {error_output}"}

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

# # Test
# result = handle_user_file("wz2K93PDkc", "abcd", "requirements.txt")
# print(json.dumps(result, indent=2))