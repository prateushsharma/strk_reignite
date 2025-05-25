import sys
import os
import subprocess
from importlib import import_module

def ensure_requirements():
    """Ensure all requirements are installed"""
    try:
        # Try to import a commonly used package to check if we're in a proper env
        import pip
    except ImportError:
        print("Python environment not properly set up")
        sys.exit(1)

def auto_configure():
    """Automatically configure the environment if needed"""
    # Add library directory to path
    library_path = os.path.join(os.path.dirname(__file__), '..', 'library')
    if library_path not in sys.path:
        sys.path.insert(0, library_path)

import sys
import os
import runpy

def main():
    if len(sys.argv) < 2:
        print("Usage: python -m library.autoloader script.py")
        sys.exit(1)
    
    script_path = os.path.abspath(sys.argv[1])
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    
    runpy.run_path(script_path, run_name="__main__")

if __name__ == "__main__":
    main()