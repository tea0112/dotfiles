import mysql.connector
from mysql.connector import Error
from prettytable import PrettyTable

def get_table_structure(cursor, table_name, db_name):
    """
    Retrieves and returns the structure of a given table as a string.

    Args:
        cursor: The database cursor object.
        table_name (str): The name of the table.
        db_name (str): The name of the database.

    Returns:
        str: A formatted string representing the table structure, or None if an error occurs.
    """
    try:
        # The DESCRIBE command shows information about the columns in a table
        cursor.execute(f"DESCRIBE `{db_name}`.`{table_name}`;")
        structure = cursor.fetchall()
        
        if not structure:
            print(f"\nWarning: Could not find structure for table '{table_name}' or it's empty.")
            return None

        # Use PrettyTable for a nicely formatted output
        table = PrettyTable()
        table.field_names = [i[0] for i in cursor.description]
        
        print(f"\n--- Table Structure: {table_name} ---")
        for row in structure:
            table.add_row(row)
        
        print(table)
        return structure

    except Error as e:
        print(f"Error retrieving structure for table '{table_name}': {e}")
        return None

def get_foreign_key_tables(cursor, table_name, db_name):
    """
    Finds all tables referenced by foreign keys in the specified table.

    Args:
        cursor: The database cursor object.
        table_name (str): The name of the table to check for foreign keys.
        db_name (str): The name of the database.

    Returns:
        list: A list of unique referenced table names.
    """
    referenced_tables = []
    try:
        # Query INFORMATION_SCHEMA to find foreign key relationships
        query = """
            SELECT 
                referenced_table_name
            FROM 
                information_schema.key_column_usage
            WHERE 
                table_schema = %s 
                AND table_name = %s 
                AND referenced_table_name IS NOT NULL;
        """
        cursor.execute(query, (db_name, table_name))
        results = cursor.fetchall()
        
        # Use a set to store unique table names
        referenced_tables = list(set([row[0] for row in results]))
        
    except Error as e:
        print(f"Error retrieving foreign keys for table '{table_name}': {e}")
        
    return referenced_tables

def main():
    """
    Main function to connect to the database and print table structures.
    """
    # --- IMPORTANT: Replace with your database credentials ---
    db_config = {
        'host': 'localhost',
        'user': 'user',
        'password': 'password',
        'database': 'database',
        'port': 3306  # Default MySQL port. Change if yours is different.
    }
    
    # --- Specify the primary table you want to inspect ---
    primary_table_name = 'legal_support_requests'

    connection = None
    try:
        # Establish the database connection
        connection = mysql.connector.connect(**db_config)
        
        if connection.is_connected():
            print(f"Successfully connected to database: {db_config['database']}")
            cursor = connection.cursor()

            # 1. Get and print the structure of the primary table
            get_table_structure(cursor, primary_table_name, db_config['database'])

            # 2. Find all tables referenced by foreign keys
            print(f"\n--- Checking for Foreign Key Relationships in '{primary_table_name}' ---")
            foreign_tables = get_foreign_key_tables(cursor, primary_table_name, db_config['database'])

            if not foreign_tables:
                print(f"No foreign key relationships found for table '{primary_table_name}'.")
            else:
                print(f"Found {len(foreign_tables)} foreign key table(s): {', '.join(foreign_tables)}")
                # 3. Get and print the structure for each referenced table
                for fk_table in foreign_tables:
                    get_table_structure(cursor, fk_table, db_config['database'])
            
            cursor.close()

    except Error as e:
        print(f"Error connecting to MySQL database: {e}")
        
    finally:
        # Ensure the connection is closed
        if connection and connection.is_connected():
            connection.close()
            print("\nMySQL connection is closed.")

if __name__ == '__main__':
    main()

