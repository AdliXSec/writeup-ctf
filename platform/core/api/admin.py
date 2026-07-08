import requests as http_requests
from flask import Blueprint, request, jsonify, make_response

from config import Config
from core.db import get_db
from core.decorators import admin_required

admin_bp = Blueprint('admin_api', __name__, url_prefix='/api/v2/admin')

@admin_bp.route('/instances', methods=['GET'])
@admin_required
def api_admin_instances():
    try:
        resp = http_requests.get(f"{Config.INSTANCE_MANAGER_URL}/admin/instances", timeout=10)
        im_data = resp.json()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
    conn = get_db()
    users = conn.execute("SELECT id, username FROM users").fetchall()
    user_map = {str(u['id']): u['username'] for u in users}
    
    for inst in im_data:
        tid = str(inst.get('team_id', ''))
        inst['username'] = user_map.get(tid, f"Unknown (ID: {tid})")
        
    return jsonify(im_data)

@admin_bp.route('/instances/stop', methods=['POST'])
@admin_required
def api_admin_stop_instance():
    data = request.get_json(silent=True) or {}
    team_id = data.get('team_id')
    challenge = data.get('challenge')
    
    if not team_id or not challenge:
        return jsonify({"error": "Missing team_id or challenge"}), 400
        
    try:
        resp = http_requests.post(
            f"{Config.INSTANCE_MANAGER_URL}/instances/stop",
            json={"team_id": team_id, "challenge": challenge},
            timeout=10
        )
        return make_response(resp.content, resp.status_code)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route('/stats', methods=['GET'])
@admin_required
def api_admin_stats():
    conn = get_db()
    total_users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    banned_users = conn.execute("SELECT COUNT(*) FROM users WHERE is_banned = 1").fetchone()[0]
    total_solves = conn.execute("SELECT COUNT(*) FROM solves").fetchone()[0]
    
    try:
        im_stats = http_requests.get(f"{Config.INSTANCE_MANAGER_URL}/stats", timeout=5).json()
    except Exception:
        im_stats = {"error": "Unreachable", "active_instances": 0, "docker_containers_running": 0}
        
    return jsonify({
        "users": {"total": total_users, "banned": banned_users},
        "solves": total_solves,
        "instance_manager": im_stats
    })

@admin_bp.route('/users', methods=['GET'])
@admin_required
def api_admin_users():
    conn = get_db()
    users = conn.execute("SELECT id, username, is_admin, is_banned FROM users").fetchall()
    res = [{"id": u["id"], "username": u["username"], "is_admin": bool(u["is_admin"]), "is_banned": bool(u["is_banned"])} for u in users]
    return jsonify(res)

@admin_bp.route('/users/<int:user_id>/ban', methods=['PUT'])
@admin_required
def api_admin_toggle_ban(user_id):
    conn = get_db()
    user = conn.execute("SELECT is_banned, is_admin FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        return jsonify({"error": "User not found"}), 404
    if user['is_admin']:
        return jsonify({"error": "Cannot ban admin"}), 400
        
    new_status = 0 if user['is_banned'] else 1
    conn.execute("UPDATE users SET is_banned = ? WHERE id = ?", (new_status, user_id))
    conn.commit()
    
    if new_status == 1:
        try:
            http_requests.post(f"{Config.INSTANCE_MANAGER_URL}/instances/{user_id}/stop_all", timeout=10)
        except Exception:
            pass
            
    return jsonify({"status": "success", "is_banned": new_status})

@admin_bp.route('/challenges', methods=['POST'])
@admin_required
def api_admin_add_challenge():
    name = request.form.get('name')
    category = request.form.get('category')
    points = request.form.get('points', type=int)
    description = request.form.get('description')
    file = request.files.get('file')
    is_dynamic = 1 if request.form.get('is_dynamic') == 'true' else 0
    
    if not all([name, category, points, description]):
        return jsonify({"error": "Missing required fields"}), 400
        
    # 1. Forward to Instance Manager (if file is provided)
    if file:
        try:
            files = {'file': (file.filename, file.stream, file.mimetype)}
            data = {'name': name}
            r = http_requests.post(f"{Config.INSTANCE_MANAGER_URL}/admin/build", data=data, files=files, timeout=300)
            
            if r.status_code != 200:
                return jsonify({"error": f"Instance Manager Error: {r.text}"}), r.status_code
        except Exception as e:
            return jsonify({"error": f"Failed to contact Instance Manager: {str(e)}"}), 500

    # 2. Save to Scoreboard DB
    conn = get_db()
    try:
        conn.execute('''
            INSERT INTO challenges (name, description, category, base_points, is_hidden, is_dynamic)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET
            description=excluded.description,
            category=excluded.category,
            base_points=excluded.base_points,
            is_dynamic=excluded.is_dynamic
        ''', (name, description, category, points, 1, is_dynamic))
        conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
    return jsonify({"status": "success", "message": "Challenge saved successfully"})

@admin_bp.route('/challenges/<name>', methods=['DELETE'])
@admin_required
def api_admin_delete_challenge(name):
    try:
        r = http_requests.delete(f"{Config.INSTANCE_MANAGER_URL}/admin/build/{name}", timeout=60)
        if r.status_code != 200:
            return jsonify({"error": f"Instance Manager Error: {r.text}"}), r.status_code
    except Exception as e:
        return jsonify({"error": f"Failed to contact Instance Manager: {str(e)}"}), 500
        
    conn = get_db()
    try:
        conn.execute("DELETE FROM challenges WHERE name = ?", (name,))
        conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
    return jsonify({"status": "success", "message": "Challenge deleted successfully"})

@admin_bp.route('/challenges/<name>/toggle', methods=['PUT'])
@admin_required
def api_admin_toggle_challenge(name):
    conn = get_db()
    try:
        conn.execute("UPDATE challenges SET is_hidden = CASE WHEN is_hidden = 1 THEN 0 ELSE 1 END WHERE name = ?", (name,))
        conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify({"status": "success", "message": f"Challenge {name} visibility toggled"})
