import os
import requests as http_requests
from flask import Blueprint, request, jsonify, make_response
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash

from config import Config
from core.db import get_db
from core.decorators import admin_required

admin_bp = Blueprint('admin_api', __name__, url_prefix='/api/v2/admin')

@admin_bp.route('/instances', methods=['GET'])
@admin_required
def api_admin_instances():
    try:
        resp = http_requests.get(f"{Config.INSTANCE_MANAGER_URL}/instances", timeout=10)
        im_data = resp.json()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
    conn = get_db()
    users = conn.execute("SELECT id, username FROM users").fetchall()
    user_map = {str(u['id']): u['username'] for u in users}
    
    instances_list = im_data.get('instances', [])
    for inst in instances_list:
        tid = str(inst.get('team_id', ''))
        inst['username'] = user_map.get(tid, f"Unknown (ID: {tid})")
        
    return jsonify(instances_list)

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

@admin_bp.route('/users', methods=['POST'])
@admin_required
def api_admin_create_admin():
    data = request.get_json(silent=True) or {}
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400
        
    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
    if existing:
        return jsonify({"error": "Username already exists"}), 409
        
    hashed = generate_password_hash(password)
    # create dummy email for admin since we just use username/password for admin
    email = f"admin_{username}@local" 
    try:
        conn.execute("INSERT INTO users (username, email, password, is_admin) VALUES (?, ?, ?, 1)", (username, email, hashed))
        conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
    return jsonify({"status": "success", "message": "Admin user created successfully"}), 201

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
    is_dynamic = 1 if str(request.form.get('is_dynamic')).lower() in ['true', '1'] else 0
    
    is_whitebox = 1 if str(request.form.get('is_whitebox')).lower() in ['true', '1'] else 0
    download_url = request.form.get('download_url') or ""
    
    min_points = request.form.get('min_points', type=int)
    if min_points is None: min_points = 50
    decay = request.form.get('decay', type=int)
    if decay is None: decay = 10
    
    source_file = request.files.get('source_file')
    
    if not all([name, category, points, description]):
        return jsonify({"error": "Missing required fields"}), 400
        
    # 1. Forward to Instance Manager (if file is provided)
    if file:
        try:
            file_content = file.read()
            files = {'file': (file.filename, file_content, file.mimetype)}
            data = {'name': name}
            r = http_requests.post(f"{Config.INSTANCE_MANAGER_URL}/admin/build", data=data, files=files, timeout=300)
            
            if r.status_code != 200:
                return jsonify({"error": f"Instance Manager Error: {r.text}"}), r.status_code
        except Exception as e:
            return jsonify({"error": f"Failed to contact Instance Manager: {str(e)}"}), 500

    # 1.5 Handle Source Code Upload (Whitebox)
    if is_whitebox and source_file and source_file.filename != '':
        filename = secure_filename(f"{name}_source_{source_file.filename}")
        downloads_dir = os.path.join(request.environ.get('FLASK_APP', ''), '..', 'static', 'downloads')
        # Wait, using request.environ for paths might be brittle.
        # Let's use current app static folder
        from flask import current_app
        downloads_dir = os.path.join(current_app.static_folder, 'downloads')
        os.makedirs(downloads_dir, exist_ok=True)
        source_path = os.path.join(downloads_dir, filename)
        source_file.save(source_path)
        download_url = f"/static/downloads/{filename}"

    # 2. Save to Scoreboard DB
    conn = get_db()
    
    # Preserve old download_url if not uploading a new one
    if not source_file or source_file.filename == '':
        try:
            old_row = conn.execute("SELECT download_url FROM challenges WHERE name = ?", (name,)).fetchone()
            if old_row and old_row['download_url']:
                download_url = old_row['download_url']
        except Exception:
            pass

    try:
        conn.execute('''
            INSERT INTO challenges (name, description, category, base_points, is_hidden, is_dynamic, is_whitebox, download_url, min_points, decay)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET
            description=excluded.description,
            category=excluded.category,
            base_points=excluded.base_points,
            is_dynamic=excluded.is_dynamic,
            is_whitebox=excluded.is_whitebox,
            download_url=excluded.download_url,
            min_points=excluded.min_points,
            decay=excluded.decay
        ''', (name, description, category, points, 1, is_dynamic, is_whitebox, download_url, min_points, decay))
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

@admin_bp.route('/notifications', methods=['POST'])
@admin_required
def api_admin_add_notification():
    data = request.get_json(silent=True) or {}
    title = data.get('title')
    message = data.get('message')
    
    if not title or not message:
        return jsonify({"error": "Title and message are required"}), 400
        
    conn = get_db()
    try:
        conn.execute("INSERT INTO notifications (title, message) VALUES (?, ?)", (title, message))
        conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
    return jsonify({"status": "success", "message": "Notification broadcasted successfully"})

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def api_admin_delete_user(user_id):
    conn = get_db()
    # Check if user is admin
    user = conn.execute("SELECT is_admin FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    if user['is_admin']:
        return jsonify({"error": "Cannot delete an admin account"}), 400
        
    try:
        # Delete user solves first to maintain integrity (if we want, or rely on cascading)
        conn.execute("DELETE FROM solves WHERE user_id = ?", (user_id,))
        # Delete the user
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
    return jsonify({"status": "success", "message": "User deleted successfully"})

@admin_bp.route('/notifications/<int:notif_id>', methods=['DELETE'])
@admin_required
def api_admin_delete_notification(notif_id):
    conn = get_db()
    try:
        conn.execute("DELETE FROM notifications WHERE id = ?", (notif_id,))
        conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
    return jsonify({"status": "success", "message": "Notification deleted"})

@admin_bp.route('/settings', methods=['GET'])
@admin_required
def api_admin_get_settings():
    conn = get_db()
    row = conn.execute("SELECT start_time, end_time, is_paused, freeze_time FROM game_settings WHERE id = 1").fetchone()
    if not row:
        return jsonify({"error": "Settings not found"}), 404
    return jsonify({
        "start_time": row["start_time"],
        "end_time": row["end_time"],
        "is_paused": bool(row["is_paused"]),
        "freeze_time": row["freeze_time"]
    })

@admin_bp.route('/settings', methods=['PUT'])
@admin_required
def api_admin_update_settings():
    data = request.get_json(silent=True) or {}
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    is_paused = 1 if data.get('is_paused') else 0
    freeze_time = data.get('freeze_time')
    
    conn = get_db()
    try:
        conn.execute('''
            UPDATE game_settings 
            SET start_time = ?, end_time = ?, is_paused = ?, freeze_time = ?
            WHERE id = 1
        ''', (start_time, end_time, is_paused, freeze_time))
        conn.commit()
        
        # If game is paused, proactively kill all active instances
        if is_paused == 1:
            try:
                http_requests.post(f"{Config.INSTANCE_MANAGER_URL}/instances/kill_all", timeout=10)
            except Exception as im_e:
                print("Failed to kill instances on pause:", im_e)
                
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
    return jsonify({"status": "success", "message": "Settings updated"})
