import os
import subprocess
import json
import time
from pathlib import Path

def exec_code(uid: str, password: str) -> dict:
    ftype = "trading_code.py"
    file_path = Path(f"./user_assets/{uid}/{ftype}")
    
    if not file_path.exists():
        return {"status": "error", "message": f"File {file_path} does not exist"}

    window_title = f"{uid}_{password}_trading_code"
    log_file = Path(f"./user_assets/{uid}/trading_code.log")
    exit_code_file = Path(f"./user_assets/{uid}/trading_code.exitcode")

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

        # Monitor for 10 seconds
        start_time = time.time()
        while time.time() - start_time < 10:
            if process.poll() is not None:  # Process has finished
                # Check exit code
                if exit_code_file.exists():
                    with open(exit_code_file, "r") as f:
                        exit_code = int(f.read().strip())
                    if exit_code != 0:
                        with open(log_file, "r") as f:
                            error_output = f.read()
                        return {"status": "error", "message": f"Code execution failed: {error_output}"}
                break
            
            # Check log file for errors in real-time
            if log_file.exists():
                with open(log_file, "r") as f:
                    content = f.read().lower()
                    if any(error in content for error in ["error", "exception", "traceback", "http"]):
                        process.kill()
                        return {"status": "error", "message": "Error detected during execution"}
            
            time.sleep(0.5)  # Check every 0.5 seconds

        # If we get here, the code ran without detected errors for 10 seconds
        return {"status": "success", "message": "Code has been successfully deployed and is being executed"}

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
# result = exec_code("wz2K93PDkc", "abcd")
# print(json.dumps(result, indent=2))