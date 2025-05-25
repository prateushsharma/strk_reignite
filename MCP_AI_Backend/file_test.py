import subprocess
import time
import os

def launch_full_process():
    # Create unique window title for tracking
    unique_id = str(time.time()).replace('.', '')
    window_title = f"PyRunner_{unique_id}"
    
    # Full command sequence for the new terminal:
    # 1. Create scratch.py with content
    # 2. Activate venv
    # 3. Install dependencies
    # 4. Run the script
    command = (
        f'start "{window_title}" cmd /K '
        f'"echo Creating scratch.py... && '
        # Create scratch.py with multi-line content
        f'(echo import time && '
        f'echo from dotenv import load_dotenv && '
        f'echo. && '
        f'echo load_dotenv^(^) && '
        f'echo. && '
        f'echo def print_hello_world^(^): && '
        f'echo     while True: && '
        f'echo         print^("Hello World"^) && '
        f'echo         time.sleep^(1^) && '
        f'echo. && '
        f'echo if __name__ == "__main__": && '
        f'echo     print_hello_world^(^)'
        f') > scratch.py && '
        # Activate, install, and run
        f'call venv\\Scripts\\activate && '
        f'pip install python-dotenv psutil && '
        f'python scratch.py"'
    )
    
    subprocess.Popen(command, shell=True)
    return window_title

def stop_process(window_title):
    try:
        subprocess.run(
            f'taskkill /FI "WINDOWTITLE eq {window_title}" /F', 
            shell=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    except Exception:
        pass

def main():
    print("Launching complete process in new terminal...")
    window_title = launch_full_process()

    input("Press Enter to stop the process...\n")
    
    print("Terminating process...")
    stop_process(window_title)
    print("Process terminated.")

if __name__ == "__main__":
    main()