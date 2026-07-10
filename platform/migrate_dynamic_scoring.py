import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'db', 'ctf.db')

def migrate():
    if not os.path.exists(DB_PATH):
        print("Database not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    
    # Check if columns exist
    cursor = conn.execute("PRAGMA table_info(challenges)")
    columns = [col['name'] for col in cursor.fetchall()]
    
    try:
        if 'min_points' not in columns:
            print("Adding min_points to challenges...")
            conn.execute("ALTER TABLE challenges ADD COLUMN min_points INTEGER DEFAULT 50")
            
        if 'decay' not in columns:
            print("Adding decay to challenges...")
            conn.execute("ALTER TABLE challenges ADD COLUMN decay INTEGER DEFAULT 10")
            
        conn.commit()
        print("Migration complete!")
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
