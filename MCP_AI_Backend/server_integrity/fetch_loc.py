import sqlite3
import os
import json

async def fetch_user_data(password):
    # Database path
    db_path = './core_db/users.db'
    
    # Connect to the SQLite database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Query to get all uids where user_password matches the input password
    cursor.execute("SELECT uid FROM users WHERE user_password = ?", (password,))
    user_ids = cursor.fetchall()  # List of tuples (uid,)

    # Prepare the data list to send to the frontend
    data = []

    # Iterate over the user_ids
    for uid_tuple in user_ids:
        uid = uid_tuple[0]  # Extract the uid from the tuple
        user_folder = f"./user_assets/{uid}"

        # Check if the folder exists
        if os.path.exists(user_folder):
            data_config_path = os.path.join(user_folder, "data_config.json")
            
            # Check if the data_config.json file exists in the folder
            if os.path.isfile(data_config_path):
                with open(data_config_path, 'r') as file:
                    # Read the json file and load its content
                    graph_data = json.load(file)
                    
                    # Append the uid and its corresponding graph data to the data list
                    data.append({"uid": uid, "graph": graph_data})

    # Close the database connection
    conn.close()

    # Prepare the final JSON response
    response = {"data": data}

    return response
