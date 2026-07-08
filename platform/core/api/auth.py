import jwt
import datetime
from flask import Blueprint, request, jsonify, g
from werkzeug.security import check_password_hash, generate_password_hash
import sqlite3

from config import Config
from core.db import get_db
from core.decorators import jwt_required

auth_bp = Blueprint('auth_api', __name__, url_prefix='/api/v2')

@auth_bp.route('/authenticate', methods=['POST'])
def api_authenticate():
    data = request.get_json(silent=True)
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({"type": "about:blank", "title": "Bad Request", "status": 400, "detail": "Missing email or password"}), 400
        
    username = data['email']  # Mapping email to username
    password = data['password']
    
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    if user and check_password_hash(user['password'], password):
        if user['is_banned']:
            return jsonify({"type": "about:blank", "title": "Forbidden", "status": 403, "detail": "Your account has been banned."}), 403
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
        }, Config.JWT_SECRET, algorithm="HS256")
        return jsonify({"token": token, "token_type": "Bearer"})
    
    return jsonify({"type": "about:blank", "title": "Forbidden", "status": 403, "detail": "Invalid credentials"}), 403

@auth_bp.route('/admin/login', methods=['POST'])
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
        }, Config.JWT_SECRET, algorithm="HS256")
        return jsonify({"token": token})
    
    return jsonify({"error": "Invalid admin credentials"}), 403

@auth_bp.route('/session', methods=['GET'])
@jwt_required
def api_session():
    user = g.user
    return jsonify({
        "id": user['id'],
        "name": user['username'],
        "email": user['username'] + "@ctf.local",
        "role": "admin" if user['is_admin'] else "player"
    })

@auth_bp.route('/register', methods=['POST'])
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
