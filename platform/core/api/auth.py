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
    """
    Authenticate User (Player)
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
          properties:
            email:
              type: string
              example: player@example.com
            password:
              type: string
              example: secret
    responses:
      200:
        description: Returns JWT token
      400:
        description: Missing email or password
      403:
        description: Invalid credentials or banned
    """
    data = request.get_json(silent=True)
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({"type": "about:blank", "title": "Bad Request", "status": 400, "detail": "Missing email or password"}), 400
        
    email = data['email']
    password = data['password']
    
    conn = get_db()
    # Try fetching by email ONLY
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
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
    """
    Authenticate Admin
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - username
            - password
          properties:
            username:
              type: string
              example: admin
            password:
              type: string
              example: supersecret
    responses:
      200:
        description: Returns JWT token
      400:
        description: Missing username or password
      403:
        description: Invalid admin credentials
    """
    data = request.get_json(silent=True)
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"error": "Missing username or password"}), 400
        
    username = data['username']
    password = data['password']
    
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE (username = ? OR email = ?) AND is_admin = 1', (username, username)).fetchone()
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
    """
    Get Current Session
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: Current user profile
      401:
        description: Unauthorized
    """
    user = g.user
    return jsonify({
        "id": user['id'],
        "name": user['username'],
        "email": user['email'] if 'email' in user.keys() else None,
        "website": user['website'] if 'website' in user.keys() else None,
        "affiliation": user['affiliation'] if 'affiliation' in user.keys() else None,
        "country": user['country'] if 'country' in user.keys() else None,
        "role": "admin" if user['is_admin'] else "player"
    })

@auth_bp.route('/register', methods=['POST'])
def api_register():
    """
    Register New Player
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - username
            - email
            - password
          properties:
            username:
              type: string
            email:
              type: string
            password:
              type: string
    responses:
      201:
        description: User registered successfully
      400:
        description: Missing parameters
      409:
        description: Username or Email already exists
    """
    data = request.get_json(silent=True)
    if not data or 'username' not in data or 'email' not in data or 'password' not in data:
        return jsonify({"type": "about:blank", "title": "Bad Request", "status": 400, "detail": "Missing username, email, or password"}), 400
        
    username = data['username']
    email = data['email']
    password = data['password']
    hashed = generate_password_hash(password)
    
    conn = get_db()
    
    # Manually check uniqueness because SQLite ALTER TABLE doesn't support UNIQUE
    existing = conn.execute('SELECT id FROM users WHERE username = ? OR email = ?', (username, email)).fetchone()
    if existing:
        return jsonify({"type": "about:blank", "title": "Conflict", "status": 409, "detail": "Username or Email already exists"}), 409

    try:
        conn.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', (username, email, hashed))
        conn.commit()
        return jsonify({"status": "success", "detail": "User registered"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"type": "about:blank", "title": "Conflict", "status": 409, "detail": "Username or Email already exists"}), 409

@auth_bp.route('/profile', methods=['PATCH'])
@jwt_required
def api_update_profile():
    """
    Update Player Profile
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            website:
              type: string
            affiliation:
              type: string
            country:
              type: string
            username:
              type: string
            password:
              type: string
    responses:
      200:
        description: Profile updated successfully
      401:
        description: Unauthorized
      409:
        description: Username already in use
    """
    data = request.get_json(silent=True) or {}
    
    # Strictly filter allowed fields (email is read-only)
    website = data.get('website')
    affiliation = data.get('affiliation')
    country = data.get('country')
    username = data.get('username')
    password = data.get('password')
    
    conn = get_db()
    
    # Email is strictly immutable, so we don't process it anymore.
            
    # Check if username is used by another account
    if username:
        existing_user = conn.execute('SELECT id FROM users WHERE username = ? AND id != ?', (username, g.user['id'])).fetchone()
        if existing_user:
            return jsonify({"type": "about:blank", "title": "Conflict", "status": 409, "detail": "Username already taken"}), 409
            
    try:
        if password:
            hashed = generate_password_hash(password)
            conn.execute('''
                UPDATE users 
                SET website = ?, affiliation = ?, country = ?, username = COALESCE(?, username), password = ?
                WHERE id = ?
            ''', (website, affiliation, country, username, hashed, g.user['id']))
        else:
            conn.execute('''
                UPDATE users 
                SET website = ?, affiliation = ?, country = ?, username = COALESCE(?, username)
                WHERE id = ?
            ''', (website, affiliation, country, username, g.user['id']))
            
        conn.commit()
        return jsonify({"status": "success", "detail": "Profile updated"})
    except sqlite3.IntegrityError:
        return jsonify({"type": "about:blank", "title": "Conflict", "status": 409, "detail": "Username already in use by another account"}), 409
