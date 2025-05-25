import os

def count_lines_in_file(file_path):
    """Counts the number of lines in a given file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return sum(1 for _ in file)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return 0

def count_lines_in_directory(directory):
    """Recursively counts the lines of code in all files in a directory."""
    total_lines = 0
    for root, dirs, files in os.walk(directory):
        # Skip the venv directory
        if 'venv' in dirs:
            dirs.remove('venv')
        
        for file in files:
            # You can specify which files to count based on extensions, e.g., '.py'
            if file.endswith('.py'):  # For Python files, change to any extension you prefer
                file_path = os.path.join(root, file)
                total_lines += count_lines_in_file(file_path)
    
    return total_lines

if __name__ == "__main__":
    current_directory = os.getcwd()  # Current working directory
    total_lines = count_lines_in_directory(current_directory)
    print(f"Total lines of code (excluding venv folder): {total_lines}")
