import os

import mysql.connector


def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST", "localhost"),
            user=os.getenv("MYSQL_USER", "root"),
            password=os.getenv("MYSQL_PASSWORD", "abdotheravage11"),
            database=os.getenv("MYSQL_DATABASE", "myfitnesspal_db"),
        )
        return connection
    except mysql.connector.Error as err:
        print(f"Connection Error: {err}")
        return None
