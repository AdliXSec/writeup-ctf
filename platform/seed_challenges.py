import sqlite3

def seed():
    conn = sqlite3.connect('/app/data/scoreboard.db')
    
    # Create table just in case it doesn't exist yet (if app.py hasn't re-initialized it)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS challenges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            category TEXT,
            base_points INTEGER DEFAULT 100,
            is_hidden BOOLEAN DEFAULT 0
        )
    ''')
    
    all_challenges = [
        "fetcher", "nslookup", "gag-wiki", "svg-viewer",
        "passforge", "papermaker", "betorganizer", "archivedesk",
        "action-packed", "silent-oracle", "neon-reactor", "optix-archiver"
    ]
    
    print("Seeding challenges...")
    for name in all_challenges:
        try:
            conn.execute('''
                INSERT INTO challenges (name, description, category, base_points, is_hidden)
                VALUES (?, ?, ?, ?, ?)
            ''', (name, f"Target Service: {name}", "Web", 100, 0))
            print(f"Added: {name}")
        except sqlite3.IntegrityError:
            print(f"Skipped (already exists): {name}")
            
    conn.commit()
    conn.close()
    print("Seed complete.")

if __name__ == "__main__":
    seed()
