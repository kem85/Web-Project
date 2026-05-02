import mysql.connector

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="0101023",
            database="myfitnesspal_db",
            auth_plugin='mysql_native_password' 
        )
        return connection
    except mysql.connector.Error as err:
        print(f"Connection Error: {err}")
        return None