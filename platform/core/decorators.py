import jwt
from functools import wraps
from flask import request, jsonify, g
from config import Config
from core.db import get_db

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
            data = jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
            conn = get_db()
            user = conn.execute('SELECT * FROM users WHERE id = ?', (data['user_id'],)).fetchone()
            if not user:
                raise Exception("User not found")
            g.user = user
            if g.user['is_banned']:
                return jsonify({"type": "about:blank", "title": "Forbidden", "status": 403, "detail": "Your account has been banned."}), 403
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
            data = jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
            if data.get('role') != 'admin':
                return jsonify({"error": "Admin privileges required"}), 403
            conn = get_db()
            user = conn.execute('SELECT * FROM users WHERE id = ?', (data['user_id'],)).fetchone()
            if not user or not user['is_admin']:
                return jsonify({"error": "Admin privileges required"}), 403
            g.user = user
            if g.user['is_banned']:
                return jsonify({"error": "Admin account banned"}), 403
        except Exception as e:
            return jsonify({"error": "Invalid or expired token"}), 401
            
        return f(*args, **kwargs)
    return decorated
