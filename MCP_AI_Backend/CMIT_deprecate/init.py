# __init__.py
import subprocess
import os
import atexit

def _ensure_csharp_built():
    base_dir = os.path.dirname(__file__)
    csproj = os.path.join(base_dir, "AgentToolChecker", "AgentToolChecker.csproj")
    output_dir = os.path.join(base_dir, "AgentToolChecker", "bin")

    exe_path = os.path.join(output_dir, "Release", "net8.0", "AgentToolChecker.exe")

    if not os.path.exists(exe_path):
        print("🔧 Building AgentToolChecker...")
        subprocess.run([
            "dotnet", "publish", csproj, "-c", "Release"
        ], check=True)
        print("✅ AgentToolChecker built.")

    return exe_path

def _run_validator():
    exe_path = _ensure_csharp_built()
    subprocess.run([exe_path, os.getcwd()])

atexit.register(_run_validator)
