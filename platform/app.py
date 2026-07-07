import os
import sqlite3
import jwt
import datetime
import requests as http_requests
import time
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, session, flash, g, jsonify, make_response
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
DB_PATH = '/app/data/scoreboard.db'
INSTANCE_MANAGER_URL = os.environ.get('INSTANCE_MANAGER_URL', 'http://ctf-instance-manager:9000')

def get_or_create_secret():
    secret_path = '/app/data/secret.key'
    try:
        os.makedirs('/app/data', exist_ok=True)
        if not os.path.exists(secret_path):
            # Create secret file exclusively to avoid race condition
            fd = os.open(secret_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.write(fd, os.urandom(32).hex().encode())
            os.close(fd)
    except FileExistsError:
        pass # File created by another worker
    with open(secret_path, 'r') as f:
        return f.read().strip()

_persistent_secret = get_or_create_secret()
app.secret_key = os.environ.get('FLASK_SECRET', _persistent_secret)
JWT_SECRET = os.environ.get('JWT_SECRET', _persistent_secret)

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
                password TEXT NOT NULL,
                is_admin BOOLEAN DEFAULT 0
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
                is_hidden BOOLEAN DEFAULT 0
            );
        ''')
    except sqlite3.OperationalError:
        pass
        
    try:
        conn.execute('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0')
    except sqlite3.OperationalError:
        pass

    try:
        hashed = generate_password_hash("0xL33XYAdliXSec12!@")
        conn.execute('INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)', ('admin', hashed, 1))
        conn.commit()
    except sqlite3.IntegrityError:
        pass


# ---------------------------------------------------------------------------
# Instance Manager communication
# ---------------------------------------------------------------------------
def im_provision(team_id):
    """Ask Instance Manager to create containers for a team."""
    try:
        resp = http_requests.post(
            f"{INSTANCE_MANAGER_URL}/provision",
            json={"team_id": team_id},
            timeout=120,
        )
        return resp.json()
    except Exception as exc:
        return {"error": str(exc)}


def im_get_instances(team_id):
    """Get port mapping for a team from Instance Manager."""
    try:
        resp = http_requests.get(
            f"{INSTANCE_MANAGER_URL}/instances/{team_id}",
            timeout=10,
        )
        if resp.status_code == 200:
            return resp.json().get("instances", {})
        return None
    except Exception:
        return None


def im_get_all_flags():
    """Get all flags from Instance Manager for submit validation."""
    try:
        resp = http_requests.get(
            f"{INSTANCE_MANAGER_URL}/all-flags",
            timeout=10,
        )
        if resp.status_code == 200:
            return resp.json()
        return {}
    except Exception:
        return {}


# --- MIDDLEWARE JWT ---
def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]
        
        if not token:
            return jsonify({"type": "about:blank", "title": "Unauthorized", "status": 401, "detail": "Missing token"}), 401
            
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            conn = get_db()
            user = conn.execute('SELECT * FROM users WHERE id = ?', (data['user_id'],)).fetchone()
            if not user:
                raise Exception("User not found")
            g.user = user
        except Exception as e:
            return jsonify({"type": "about:blank", "title": "Unauthorized", "status": 401, "detail": "Invalid or expired token"}), 401
            
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]
        
        if not token:
            return jsonify({"error": "Missing token"}), 401
            
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            if data.get('role') != 'admin':
                return jsonify({"error": "Admin privileges required"}), 403
            conn = get_db()
            user = conn.execute('SELECT * FROM users WHERE id = ?', (data['user_id'],)).fetchone()
            if not user or not user['is_admin']:
                return jsonify({"error": "Admin privileges required"}), 403
            g.user = user
        except Exception as e:
            return jsonify({"error": "Invalid or expired token"}), 401
            
        return f(*args, **kwargs)
    return decorated

# --- API ENDPOINTS (0XL33XY 2026 SPEC) ---

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

@app.route('/api/v2/admin/login', methods=['POST'])
def api_admin_login():
    data = request.get_json(silent=True)
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"error": "Missing username or password"}), 400
        
    username = data['username']
    password = data['password']
    
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE username = ? AND is_admin = 1', (username,)).fetchone()
    if user and check_password_hash(user['password'], password):
        token = jwt.encode({
            'user_id': user['id'],
            'role': 'admin',
            'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
        }, JWT_SECRET, algorithm="HS256")
        return jsonify({"token": token})
    
    return jsonify({"error": "Invalid admin credentials"}), 403

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

# ── ON-DEMAND INSTANCE ENDPOINTS ──

@app.route('/api/v2/game/instances/start', methods=['POST'])
@jwt_required
def api_instance_start():
    data = request.get_json(silent=True) or {}
    chal_name = data.get("challenge")
    if not chal_name:
        return jsonify({"error": "challenge name required"}), 400
        
    conn = get_db()
    chal = conn.execute('SELECT is_hidden FROM challenges WHERE name = ?', (chal_name,)).fetchone()
    if not chal or chal['is_hidden']:
        return jsonify({"error": "Challenge is disabled or not found"}), 403
        
    resp = http_requests.post(
        f"{INSTANCE_MANAGER_URL}/instances/start",
        json={"team_id": g.user['id'], "challenge": chal_name},
        timeout=120
    )
    return make_response(resp.content, resp.status_code)

@app.route('/api/v2/game/instances/stop', methods=['POST'])
@jwt_required
def api_instance_stop():
    data = request.get_json(silent=True) or {}
    chal_name = data.get("challenge")
    resp = http_requests.post(
        f"{INSTANCE_MANAGER_URL}/instances/stop",
        json={"team_id": g.user['id'], "challenge": chal_name},
        timeout=10
    )
    return make_response(resp.content, resp.status_code)

@app.route('/api/v2/game/instances/extend', methods=['POST'])
@jwt_required
def api_instance_extend():
    data = request.get_json(silent=True) or {}
    chal_name = data.get("challenge")
    resp = http_requests.post(
        f"{INSTANCE_MANAGER_URL}/instances/extend",
        json={"team_id": g.user['id'], "challenge": chal_name},
        timeout=10
    )
    return make_response(resp.content, resp.status_code)

@app.route('/api/v2/game/instances/reset', methods=['POST'])
@jwt_required
def api_instance_reset():
    data = request.get_json(silent=True) or {}
    chal_name = data.get("challenge")
    # Reset is basically stop then start
    http_requests.post(
        f"{INSTANCE_MANAGER_URL}/instances/stop",
        json={"team_id": g.user['id'], "challenge": chal_name},
        timeout=10
    )
    resp = http_requests.post(
        f"{INSTANCE_MANAGER_URL}/instances/start",
        json={"team_id": g.user['id'], "challenge": chal_name},
        timeout=120
    )
    return make_response(resp.content, resp.status_code)

@app.route('/api/v2/challenges', methods=['GET'])
@jwt_required
def api_challenges():
    team_id = g.user['id']
    instances = im_get_instances(team_id) or {}
    
    conn = get_db()
    # Fetch unhidden challenges from DB unless admin
    if getattr(g, 'user', {}).get('is_admin'):
        rows = conn.execute('SELECT id, name, description, category, base_points, is_hidden FROM challenges').fetchall()
    else:
        rows = conn.execute('SELECT id, name, description, category, base_points, is_hidden FROM challenges WHERE is_hidden = 0').fetchall()
    
    host = os.environ.get('CTF_HOST', 'localhost')
    chal_list = []
    
    for row in rows:
        name = row['name']
        chal_info = {
            "id": row['id'],
            "name": name,
            "category": row['category'],
            "description": row['description'],
            "points": row['base_points'],
            "is_hidden": bool(row['is_hidden']),
            "has_source_download": False,
            "instance": {
                "status": "stopped"
            }
        }
        
        if name in instances:
            chal_info["instance"]["status"] = "running"
            chal_info["instance"]["endpoint"] = f"{host}:{instances[name]['port']}"
            chal_info["instance"]["expires_at"] = instances[name]["expires_at"]
            
        chal_list.append(chal_info)

    return jsonify(chal_list)

@app.route('/api/v2/game/status', methods=['GET'])
@jwt_required
def api_game_status():
    import time
    return jsonify({
        "match": {
            "state": "running",
            "started_at": "2026-06-29T00:00:00+00:00",
            "accepting_submissions": True
        },
        "mode": "dynamic_instancing",
        "scheduler": {
            "state": "running",
        },
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
        SELECT s.id, u.username, s.challenge_id, s.solved_at
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
            "service": row['challenge_id'],
            "verdict": "first valid submission accepted",
            "solved_at": row['solved_at']
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
    
    # Build a reverse lookup: flag_value -> (team_id, challenge_name)
    all_flags = im_get_all_flags()
    flag_lookup = {}
    for tid, challenges in all_flags.items():
        for chal_name, flag_val in challenges.items():
            flag_lookup[flag_val] = (int(tid), chal_name)

    submitter_team_id = g.user['id']
    results = []
    accepted = 0
    rejected = 0
    
    conn = get_db()
    for submitted_flag in data:
        match = flag_lookup.get(submitted_flag)
        
        if match:
            instance_team_id, challenge_name = match

            # Jeopardy Mode: You MUST submit your own instance's flag.
            if instance_team_id != submitter_team_id:
                results.append({
                    "flag": submitted_flag,
                    "status": "rejected",
                    "detail": "Flag valid, tetapi ini bukan flag dari instance milik tim Anda!"
                })
                rejected += 1
                continue

            try:
                conn.execute(
                    'INSERT INTO solves (user_id, challenge_id, flag_value) VALUES (?, ?, ?)', 
                    (submitter_team_id, challenge_name, submitted_flag)
                )
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


@app.route('/api/v2/admin/challenges', methods=['POST'])
@admin_required
def api_admin_add_challenge():
    name = request.form.get('name')
    category = request.form.get('category')
    points = request.form.get('points', type=int)
    description = request.form.get('description')
    file = request.files.get('file')
    
    if not all([name, category, points, description]):
        return jsonify({"error": "Missing required fields"}), 400
        
    # 1. Forward to Instance Manager (if file is provided)
    if file:
        try:
            files = {'file': (file.filename, file.stream, file.mimetype)}
            data = {'name': name}
            r = http_requests.post(f"{INSTANCE_MANAGER_URL}/admin/build", data=data, files=files, timeout=300)
            
            if r.status_code != 200:
                return jsonify({"error": f"Instance Manager Error: {r.text}"}), r.status_code
        except Exception as e:
            return jsonify({"error": f"Failed to contact Instance Manager: {str(e)}"}), 500

    # 2. Save to Scoreboard DB
    conn = get_db()
    try:
        conn.execute('''
            INSERT INTO challenges (name, description, category, base_points, is_hidden)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET
            description=excluded.description,
            category=excluded.category,
            base_points=excluded.base_points
        ''', (name, description, category, points, 0))
        conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
    return jsonify({"status": "success", "message": "Challenge saved successfully"})

@app.route('/api/v2/admin/challenges/<name>', methods=['DELETE'])
@admin_required
def api_admin_delete_challenge(name):
    # 1. Delete from Instance Manager
    try:
        r = http_requests.delete(f"{INSTANCE_MANAGER_URL}/admin/build/{name}", timeout=60)
        if r.status_code != 200:
            return jsonify({"error": f"Instance Manager Error: {r.text}"}), r.status_code
    except Exception as e:
        return jsonify({"error": f"Failed to contact Instance Manager: {str(e)}"}), 500
        
    # 2. Delete from Scoreboard DB
    conn = get_db()
    try:
        conn.execute("DELETE FROM challenges WHERE name = ?", (name,))
        conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
    return jsonify({"status": "success", "message": "Challenge deleted successfully"})

@app.route('/api/v2/admin/challenges/<name>/toggle', methods=['PUT'])
@admin_required
def api_admin_toggle_challenge(name):
    conn = get_db()
    try:
        conn.execute("UPDATE challenges SET is_hidden = CASE WHEN is_hidden = 1 THEN 0 ELSE 1 END WHERE name = ?", (name,))
        conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify({"status": "success", "message": f"Challenge {name} visibility toggled"})
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

@app.route('/admin')
def admin():
    return render_template('admin/dashboard.html')

@app.route('/admin/login')
def admin_login():
    return render_template('admin/login.html')

if __name__ == '__main__':
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with app.app_context():
        init_db()
    app.run(host='0.0.0.0', port=8000, debug=True)

# Initialize DB on load for Gunicorn
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
with app.app_context():
    init_db()
