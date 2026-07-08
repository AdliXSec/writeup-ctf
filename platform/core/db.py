import sqlite3
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
                password TEXT NOT NULL,
                is_admin BOOLEAN DEFAULT 0,
                is_banned BOOLEAN DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS solves (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                challenge_id TEXT NOT NULL,
                flag_value TEXT NOT NULL,
                solved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
                is_dynamic BOOLEAN DEFAULT 0
            );
        ''')
    except sqlite3.OperationalError:
        pass
        
    try:
        hashed = generate_password_hash("0xL33XYAdliXSec12!@")
        conn.execute('INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)', ('admin', hashed, 1))
        conn.commit()
    except sqlite3.IntegrityError:
        pass
