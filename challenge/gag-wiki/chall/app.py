#!/usr/bin/env python3
"""
GaG Wiki - SQL Injection Challenge
Kerentanan: Parameter pencarian 'q' rentan SQL Injection karena
query dibangun langsung dari input pengguna (string concatenation).
Database: SQLite dengan tabel 'pages' dan 'users'.
Flag tersimpan sebagai password di tabel users.
"""
import os
import sqlite3
from flask import Flask, request, render_template_string, g

app = Flask(__name__)

FLAG = os.environ.get("FLAG", "foresty{7bcb6131d0c9f5e4e7e52f50073eeefd}")
DB_PATH = "/tmp/gagwiki.db"


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password TEXT NOT NULL
        );

        DELETE FROM pages;
        DELETE FROM users;

        INSERT INTO pages (title, content, category) VALUES
        ('Welcome to GaG Wiki', 'This is the official wiki for GaG community. Feel free to explore!', 'general'),
        ('Getting Started', 'New to GaG? Here is how to get started with your journey...', 'tutorial'),
        ('Rules & Guidelines', 'Please follow these community rules: 1. Be respectful...', 'general'),
        ('Advanced Techniques', 'For advanced users, here are some pro tips and tricks...', 'tutorial'),
        ('FAQ', 'Frequently asked questions about GaG Wiki and community.', 'general'),
        ('CTF Basics', 'Capture The Flag competitions are cybersecurity challenges...', 'security'),
        ('Web Exploitation', 'Common web vulnerabilities include SQLi, XSS, SSRF...', 'security'),
        ('Cryptography 101', 'Introduction to basic cryptographic concepts and ciphers.', 'security');

        INSERT INTO users (username, password) VALUES
        ('admin', '""" + FLAG + """');
    """)
    conn.close()


INDEX_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>GaG Wiki</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Georgia', serif;
            background: #f8f9fa; color: #333;
        }
        .navbar {
            background: #2c3e50; padding: 16px 32px;
            display: flex; align-items: center; gap: 24px;
        }
        .navbar h1 { color: #ecf0f1; font-size: 1.4em; }
        .navbar a { color: #bdc3c7; text-decoration: none; }
        .navbar a:hover { color: white; }
        .container { max-width: 900px; margin: 32px auto; padding: 0 20px; }
        .search-box {
            display: flex; gap: 8px; margin-bottom: 24px;
        }
        .search-box input {
            flex: 1; padding: 12px 16px; border: 2px solid #ddd;
            border-radius: 8px; font-size: 1em;
        }
        .search-box button {
            padding: 12px 24px; background: #3498db; color: white;
            border: none; border-radius: 8px; cursor: pointer;
            font-size: 1em; font-weight: bold;
        }
        .search-box button:hover { background: #2980b9; }
        .results { margin-top: 16px; }
        .result-card {
            background: white; border: 1px solid #e0e0e0;
            border-radius: 8px; padding: 20px; margin-bottom: 12px;
        }
        .result-card h3 { color: #2c3e50; margin-bottom: 8px; }
        .result-card p { color: #666; line-height: 1.5; }
        .result-card .category {
            display: inline-block; background: #eef; color: #339;
            padding: 2px 10px; border-radius: 12px; font-size: 0.8em;
            margin-top: 8px;
        }
        .count { color: #888; margin-bottom: 16px; }
        .error {
            background: #fee; border: 1px solid #fcc; padding: 16px;
            border-radius: 8px; color: #c33;
        }
    </style>
</head>
<body>
    <div class="navbar">
        <h1>📖 GaG Wiki</h1>
        <a href="/">Home</a>
        <a href="/search?q=">Browse All</a>
    </div>
    <div class="container">
        <form action="/search" method="GET" class="search-box">
            <input type="text" name="q" placeholder="Search wiki..."
                   value="{{ query or '' }}" autocomplete="off">
            <button type="submit">🔍 Search</button>
        </form>

        {% if error %}
        <div class="error">{{ error }}</div>
        {% endif %}

        {% if results is not none %}
        <p class="count">Found {{ results|length }} result(s) for "{{ query }}"</p>
        <div class="results">
            {% for row in results %}
            <div class="result-card">
                <h3>{{ row['title'] }}</h3>
                <p>{{ row['content'] }}</p>
                <span class="category">{{ row['category'] }}</span>
            </div>
            {% endfor %}
        </div>
        {% endif %}
    </div>
</body>
</html>
"""


@app.route("/")
def index():
    return render_template_string(INDEX_HTML)


@app.route("/search")
def search():
    query = request.args.get("q", "")
    if not query:
        return render_template_string(INDEX_HTML, query=query, results=[])

    db = get_db()
    try:
        # --- VULNERABLE: String concatenation dalam SQL query ---
        # Input pengguna langsung dimasukkan ke query tanpa parameterized query
        sql = f"SELECT title, content, category FROM pages WHERE title LIKE '%{query}%' OR content LIKE '%{query}%'"
        cursor = db.execute(sql)
        results = [dict(row) for row in cursor.fetchall()]
        return render_template_string(INDEX_HTML, query=query, results=results)
    except Exception as e:
        return render_template_string(INDEX_HTML, query=query, error=str(e), results=None)


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5002))
    app.run(host="0.0.0.0", port=port)
