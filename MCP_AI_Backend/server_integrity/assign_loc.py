import sys
import os
sys.path.append('..')
from uid_management.uid_generator import get_uid

import os
import sqlite3
import json
from pathlib import Path

# Function to generate a 10-digit random UID (using uid_generator)
def generate_uid():
    return get_uid()  # Assuming this function returns a 10-digit string

# Function to create the SQLite database and table if not exists
def create_db():
    db_path = "./core_db/users.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create users table if not exists
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY UNIQUE NOT NULL,
        user_password TEXT NOT NULL
    );
    ''')
    
    # Create indexes on uid and user_password columns
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_uid ON users (uid);')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_password ON users (user_password);')
    
    conn.commit()
    return conn, cursor

# Function to insert user into the database
def insert_user(cursor, uid, password):
    try:
        cursor.execute('''
        INSERT INTO users (uid, user_password)
        VALUES (?, ?)
        ''', (uid, password))
    except sqlite3.IntegrityError:
        return False  # If IntegrityError happens, it means a duplicate UID was found
    return True

# Function to handle the entire user creation logic
async def create_user(password: str):
    
    retries = 10
    uid = generate_uid()

    conn, cursor = create_db()

    for _ in range(retries):
        # print(f"Attempting to create user with UID: {uid}")
        # Check if the UID already exists in the database
        cursor.execute('SELECT 1 FROM users WHERE uid = ?', (uid,))
        if cursor.fetchone() is None:  # UID does not exist, safe to insert
            if insert_user(cursor, uid, password):
                conn.commit()
                break
        else:
            uid = generate_uid()  # UID already exists, generate a new one
    else:
        conn.close()
        return {"status": "error", "message": "Unable to generate a unique UID after 10 retries", "code": 500}
    
    # Create the user directory and files
    user_folder = Path(f"./user_assets/{uid}")
    user_folder.mkdir(parents=True, exist_ok=True)

    code_sync = {
        "deploy_status": False,
        "clone_status": False,
        "cloned_from_uid": None,
        "cloned_from_password": None,
    }

    wallet_sync = {
    }

    data_config = {}

    # Create the necessary files (without writing any content except init_config.json)
    with open(user_folder / "initialise.py", 'w') as f:
        pass  # Empty file, no content written
    
    with open(user_folder / "requirements.txt", 'w') as f:
        pass  # Empty file, no content written
    
    with open(user_folder / "trading_code.py", 'w') as f:
        pass  # Empty file, no content written
    
    with open(user_folder / "data_log.txt", 'w') as f:
        pass  # Empty file, no content written
    
    with open(user_folder / "trade_updates.json", 'w') as f:
        pass  # Empty file, no content written
    
    with open(user_folder / "data_config.json", 'w') as f:
        json.dump(data_config, f, indent=4)

    with open(user_folder / "code_sync.json", 'w') as f:
        json.dump(code_sync, f, indent=4) 

    with open(user_folder / "wallet_sync.json", 'w') as f:
        json.dump(wallet_sync, f, indent=4)

    # Close the DB connection
    conn.close()

    return {"status": "success", "uid": uid}