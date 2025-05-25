import os
import sqlite3

db_path = "./core_db/users.db"

# Step 1: Check if DB path exists
if not os.path.exists(db_path):
    print(f"Database path '{db_path}' does not exist.")
else:
    # Step 2: Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Step 3: Get all table names
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()

    if not tables:
        print("No tables found in the database.")
    else:
        # Step 4: For each table, print all rows
        for table in tables:
            table_name = table[0]
            print(f"\n--- Contents of table: {table_name} ---")
            try:
                cursor.execute(f"SELECT * FROM {table_name}")
                rows = cursor.fetchall()
                for row in rows:
                    print(row)
            except Exception as e:
                print(f"Error reading table {table_name}: {e}")

    conn.close()
