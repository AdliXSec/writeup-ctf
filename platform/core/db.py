import sqlite3
import os
from flask import g
from werkzeug.security import generate_password_hash
from config import Config

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(Config.DB_PATH, timeout=20)
        g.db.row_factory = sqlite3.Row
    return g.db

def close_connection(exception):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    conn = get_db()
    try:
        conn.execute('PRAGMA journal_mode=WAL;')
        conn.executescript('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT,
                website TEXT,
                affiliation TEXT,
                country TEXT,
                password TEXT NOT NULL,
                is_admin BOOLEAN DEFAULT 0,
                is_banned BOOLEAN DEFAULT 0,
                is_hidden BOOLEAN DEFAULT 0,
                must_change_password BOOLEAN DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS solves (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                challenge_id TEXT NOT NULL,
                flag_value TEXT NOT NULL,
                solved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_first_blood BOOLEAN DEFAULT 0,
                blood_tier INTEGER DEFAULT 0,
                FOREIGN KEY(user_id) REFERENCES users(id),
                UNIQUE(user_id, challenge_id)
            );
            CREATE TABLE IF NOT EXISTS challenges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                category TEXT,
                base_points INTEGER DEFAULT 100,
                is_hidden BOOLEAN DEFAULT 0,
                is_dynamic BOOLEAN DEFAULT 0,
                is_whitebox BOOLEAN DEFAULT 0,
                download_url TEXT,
                min_points INTEGER DEFAULT 50,
                decay INTEGER DEFAULT 10,
                level TEXT DEFAULT 'Easy'
            );
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS game_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                start_time DATETIME,
                end_time DATETIME,
                is_paused BOOLEAN DEFAULT 0,
                freeze_time DATETIME
            );
        ''')
    except sqlite3.OperationalError:
        pass

    # Migrations for new profile columns
    migrations = [
        "ALTER TABLE users ADD COLUMN email TEXT",
        "ALTER TABLE users ADD COLUMN website TEXT",
        "ALTER TABLE users ADD COLUMN affiliation TEXT",
        "ALTER TABLE users ADD COLUMN country TEXT",
        "ALTER TABLE solves ADD COLUMN is_first_blood BOOLEAN DEFAULT 0",
        "ALTER TABLE solves ADD COLUMN blood_tier INTEGER DEFAULT 0",
        "ALTER TABLE challenges ADD COLUMN is_whitebox BOOLEAN DEFAULT 0",
        "ALTER TABLE challenges ADD COLUMN download_url TEXT",
        "ALTER TABLE users ADD COLUMN is_hidden BOOLEAN DEFAULT 0",
        "ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT 0",
        "ALTER TABLE challenges ADD COLUMN level TEXT DEFAULT 'Easy'"
    ]
    for mig in migrations:
        try:
            conn.execute(mig)
        except sqlite3.OperationalError:
            pass
            
    try:
        # Migrate existing first bloods to tier 1
        conn.execute("UPDATE solves SET blood_tier = 1 WHERE is_first_blood = 1 AND blood_tier = 0")
        conn.commit()
    except sqlite3.OperationalError:
        pass
        
    try:
        import secrets as _secrets
        admin_pw = os.environ.get('ADMIN_PASSWORD')
        must_change = 0
        if not admin_pw:
            admin_pw = _secrets.token_urlsafe(16)
            must_change = 1
            print(f"\n{'='*60}")
            print(f"  [!] AUTO-GENERATED ADMIN PASSWORD: {admin_pw}")
            print(f"  [!] Set ADMIN_PASSWORD env var to use a custom password.")
            print(f"{'='*60}\n")
        hashed = generate_password_hash(admin_pw)
        conn.execute('INSERT INTO users (username, email, password, is_admin, must_change_password) VALUES (?, ?, ?, ?, ?)', ('admin', 'admin@local', hashed, 1, must_change))
        conn.commit()
    except sqlite3.IntegrityError:
        pass
        
    try:
        # Seed game settings if empty
        settings = conn.execute('SELECT COUNT(*) FROM game_settings').fetchone()[0]
        if settings == 0:
            conn.execute('INSERT INTO game_settings (id, is_paused) VALUES (1, 0)')
            conn.commit()
    except Exception as e:
        print("Settings seed error:", e)
