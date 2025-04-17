import sqlite3
import sys
import bcrypt

def update_password(db_path, username, new_password_hash):
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        if not isinstance(new_password_hash, str) or not new_password_hash.startswith('$2b$10$'):
            print(f"Error: Internal hash generation failed or produced invalid format.")
            return False

        cursor.execute("UPDATE account SET password = ? WHERE username = ?", (new_password_hash, username))
        conn.commit()

        if cursor.rowcount == 0:
            print(f"Error: No user found with username '{username}'.")
            return False
        else:
            print(f"Password for user '{username}' updated successfully.")
            return True

    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        if conn:
            conn.rollback()
        return False
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python resetpass.py <db_path> <username> <new_plain_password>")
        sys.exit(1)

    db_path = sys.argv[1]
    username = sys.argv[2]
    plain_password = sys.argv[3]

    try:
        lowercase_password_bytes = plain_password.lower().encode('utf-8')
        generated_hash = bcrypt.hashpw(lowercase_password_bytes, bcrypt.gensalt(rounds=10)).decode('utf-8')
        print(f"Generated hash for '{username}': {generated_hash}")
    except Exception as e:
        print(f"Error generating bcrypt hash: {e}")
        sys.exit(1)

    if update_password(db_path, username, generated_hash):
        sys.exit(0)
    else:
        sys.exit(1)
