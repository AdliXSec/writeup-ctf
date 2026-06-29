import os
import sqlite3
import jwt
import datetime
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, session, flash, g, jsonify, make_response
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'super_secret_ctf_key'
JWT_SECRET = 'super_secret_jwt_key_playit'
DB_PATH = '/app/data/scoreboard.db'
ENV_PATH = '/app/.env'

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH, timeout=20)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
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
                password TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS solves (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                challenge_id TEXT NOT NULL,
                flag_value TEXT NOT NULL,
                tick INTEGER DEFAULT 1,
                solved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id),
                UNIQUE(user_id, flag_value)
            );
        ''')
        try:
            conn.execute('ALTER TABLE solves ADD COLUMN tick INTEGER DEFAULT 1')
        except sqlite3.OperationalError:
            pass
    except sqlite3.OperationalError:
        pass

def get_current_flags():
    flags = {}
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, 'r') as f:
            for line in f:
                if '=' in line:
                    key, val = line.strip().split('=', 1)
                    flags[key] = val
    return flags

# --- MIDDLEWARE JWT ---
def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"type": "about:blank", "title": "Unauthorized", "status": 403, "detail": "Bearer token missing"}), 403
        
        token = auth_header.split(' ')[1]
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            user_id = data['user_id']
            # Verify user exists
            conn = get_db()
            user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
            if not user:
                return jsonify({"type": "about:blank", "title": "Forbidden", "status": 403, "detail": "User not found"}), 403
            g.user = user
        except jwt.ExpiredSignatureError:
            return jsonify({"type": "about:blank", "title": "Forbidden", "status": 403, "detail": "Token expired"}), 403
        except jwt.InvalidTokenError:
            return jsonify({"type": "about:blank", "title": "Forbidden", "status": 403, "detail": "Invalid token"}), 403
            
        return f(*args, **kwargs)
    return decorated

# --- API ENDPOINTS (PLAY IT 2026 SPEC) ---

@app.route('/api/v2/authenticate', methods=['POST'])
def api_authenticate():
    data = request.get_json(silent=True)
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({"type": "about:blank", "title": "Bad Request", "status": 400, "detail": "Missing email or password"}), 400
        
    username = data['email']  # Mapping email to username
    password = data['password']
    
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    if user and check_password_hash(user['password'], password):
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
        }, JWT_SECRET, algorithm="HS256")
        return jsonify({"token": token, "token_type": "Bearer"})
    
    return jsonify({"type": "about:blank", "title": "Forbidden", "status": 403, "detail": "Invalid credentials"}), 403

@app.route('/api/v2/session', methods=['GET'])
@jwt_required
def api_session():
    user = g.user
    return jsonify({
        "player_id": user['id'],
        "team_id": user['id'],
        "team_name": user['username'],
        "display_name": user['username'],
        "email": user['username'],
        "role": "captain"
    })

@app.route('/api/v2/challenges', methods=['GET'])
@jwt_required
def api_challenges():
    flags = get_current_flags()
    
    port_map = {
        'FLAG_FETCHER': '5000',
        'FLAG_NSLOOKUP': '5001',
        'FLAG_GAGWIKI': '5002',
        'FLAG_SVG_VIEWER': '8888',
        'FLAG_PASSFORGE': '8120',
        'FLAG_PAPERMAKER': '8130',
        'FLAG_BETORGANIZER': '8140',
        'FLAG_ARCHIVEDESK': '8150'
    }
    
    chal_list = []
    for i, chal_id in enumerate(flags.keys()):
        # Filter out proofs and meta
        if chal_id.startswith('PROOF_') or chal_id == 'CTF_TICK': continue
        
        chal_list.append({
            "id": i + 1,
            "name": chal_id.replace('FLAG_', '').lower(),
            "has_source_download": False,
            "endpoint": f"localhost:{port_map.get(chal_id, '80')}"
        })
    return jsonify(chal_list)

@app.route('/api/v2/game/status', methods=['GET'])
@jwt_required
def api_game_status():
    import time
    try:
        last_reset = os.path.getmtime(ENV_PATH)
    except:
        last_reset = time.time()
        
    flags = get_current_flags()
    current_tick = int(flags.get('CTF_TICK', 1))
        
    return jsonify({
        "match": {
            "state": "running",
            "started_at": "2026-06-29T00:00:00+00:00",
            "accepting_submissions": True
        },
        "current_tick": {
            "id": current_tick,
            "status": "completed"
        },
        "scheduler": {
            "state": "running",
            "interval_seconds": 300,
            "last_tick_id": current_tick,
            "last_reset_time": last_reset
        },
        "total_ticks": current_tick
    })

@app.route('/api/v2/scoreboard', methods=['GET'])
@jwt_required
def api_scoreboard():
    conn = get_db()
    query = '''
        SELECT u.username, 
               COUNT(s.id) * 100 as score
        FROM users u 
        LEFT JOIN solves s ON u.id = s.user_id 
        GROUP BY u.id 
        ORDER BY score DESC
    '''
    rows = conn.execute(query).fetchall()
    scoreboard = []
    for rank, row in enumerate(rows):
        scoreboard.append({
            "rank": rank + 1,
            "team": row['username'],
            "attack": 0,
            "defense": 0,
            "sla": 0,
            "total": row['score'],
            "delta": "+0"
        })
    return jsonify(scoreboard)

@app.route('/api/v2/attacks', methods=['GET'])
@jwt_required
def api_attacks():
    conn = get_db()
    query = '''
        SELECT s.id, u.username, s.challenge_id, s.solved_at, s.tick 
        FROM solves s 
        JOIN users u ON s.user_id = u.id 
        ORDER BY s.solved_at DESC LIMIT 50
    '''
    rows = conn.execute(query).fetchall()
    
    items = []
    for row in rows:
        items.append({
            "id": f"solve-{row['id']}",
            "attacker": row['username'],
            "victim": "System",
            "service": row['challenge_id'].replace('FLAG_', '').lower(),
            "tick": row['tick'],
            "verdict": "first valid submission accepted"
        })
    return jsonify({
        "items": items,
        "limit": 50,
        "offset": 0,
        "total_count": len(items),
        "has_prev": False,
        "has_next": False
    })

@app.route('/api/v2/submit', methods=['POST'])
@jwt_required
def api_submit():
    data = request.get_json(silent=True)
    if not isinstance(data, list):
        return jsonify({"type": "about:blank", "title": "Bad Request", "status": 400, "detail": "Expected array of flags"}), 400
        
    current_flags = get_current_flags()
    current_tick = int(current_flags.get('CTF_TICK', 1))
    
    results = []
    accepted = 0
    rejected = 0
    
    conn = get_db()
    for submitted_flag in data:
        solved_challenge_id = None
        for chal_id, correct_flag in current_flags.items():
            if submitted_flag == correct_flag:
                solved_challenge_id = chal_id
                break
                
        if solved_challenge_id:
            try:
                conn.execute('INSERT INTO solves (user_id, challenge_id, flag_value, tick) VALUES (?, ?, ?, ?)', 
                             (g.user['id'], solved_challenge_id, submitted_flag, current_tick))
                conn.commit()
                results.append({
                    "flag": submitted_flag,
                    "status": "accepted",
                    "detail": "flag is correct."
                })
                accepted += 1
            except sqlite3.IntegrityError:
                results.append({
                    "flag": submitted_flag,
                    "status": "duplicate",
                    "detail": "flag already submitted."
                })
                rejected += 1
        else:
            results.append({
                "flag": submitted_flag,
                "status": "invalid",
                "detail": "flag is wrong or expired."
            })
            rejected += 1

    return jsonify({
        "results": results,
        "accepted_count": accepted,
        "rejected_count": rejected
    })


@app.route('/api/v2/register', methods=['POST'])
def api_register():
    data = request.get_json(silent=True)
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({"type": "about:blank", "title": "Bad Request", "status": 400, "detail": "Missing email or password"}), 400
        
    username = data['email']
    password = data['password']
    hashed = generate_password_hash(password)
    
    conn = get_db()
    try:
        conn.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, hashed))
        conn.commit()
        return jsonify({"status": "success", "detail": "User registered"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"type": "about:blank", "title": "Conflict", "status": 409, "detail": "Username already exists"}), 409

# --- EXISTING HTML ROUTES (NOW STATIC) ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/submit')
def submit():
    return render_template('submit.html')

@app.route('/profile')
def profile():
    return render_template('profile.html')

@app.route('/challenges')
def challenges():
    return render_template('challenges.html')

@app.route('/status')
def status():
    return render_template('status.html')

@app.route('/attacks')
def attacks():
    return render_template('attacks.html')

if __name__ == '__main__':
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with app.app_context():
        init_db()
    app.run(host='0.0.0.0', port=8000, debug=True)

# Initialize DB on load for Gunicorn
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
with app.app_context():
    init_db()
