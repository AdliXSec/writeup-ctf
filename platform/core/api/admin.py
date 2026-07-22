import os
import requests as http_requests
from flask import Blueprint, request, jsonify, make_response
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash
import logging

logger = logging.getLogger(__name__)

from config import Config
from core.db import get_db
from core.decorators import admin_required

admin_bp = Blueprint('admin_api', __name__, url_prefix='/api/v2/admin')

@admin_bp.route('/instances', methods=['GET'])
@admin_required
def api_admin_instances():
    """
    List Running Instances (Admin)
    ---
    tags:
      - Admin Instances
    security:
      - Bearer: []
    responses:
      200:
        description: List of running containers
    """
    try:
        resp = http_requests.get(f"{Config.INSTANCE_MANAGER_URL}/instances", headers={"X-API-Key": Config.IM_API_KEY}, timeout=10)
        im_data = resp.json()
    except Exception as e:
        logger.exception("Internal error in api_admin_instances")
        return jsonify({"error": "Internal server error"}), 500
        
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
    """
    Stop Challenge Instance (Admin)
    ---
    tags:
      - Admin Instances
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            team_id:
              type: integer
            challenge:
              type: string
    responses:
      200:
        description: Instance stopped
    """
    data = request.get_json(silent=True) or {}
    team_id = data.get('team_id')
    challenge = data.get('challenge')
    
    if not team_id or not challenge:
        return jsonify({"error": "Missing team_id or challenge"}), 400
        
    try:
        resp = http_requests.post(
            f"{Config.INSTANCE_MANAGER_URL}/instances/stop",
            json={"team_id": team_id, "challenge": challenge},
            headers={"X-API-Key": Config.IM_API_KEY},
            timeout=10
        )
        return make_response(resp.content, resp.status_code)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route('/stats', methods=['GET'])
@admin_required
def api_admin_stats():
    """
    Get Dashboard Stats
    ---
    tags:
      - Admin Dashboard
    security:
      - Bearer: []
    responses:
      200:
        description: System statistics
    """
    conn = get_db()
    total_users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    banned_users = conn.execute("SELECT COUNT(*) FROM users WHERE is_banned = 1").fetchone()[0]
    total_solves = conn.execute("SELECT COUNT(*) FROM solves").fetchone()[0]
    
    try:
        im_stats = http_requests.get(f"{Config.INSTANCE_MANAGER_URL}/stats", headers={"X-API-Key": Config.IM_API_KEY}, timeout=5).json()
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
    """
    List All Users
    ---
    tags:
      - Admin Users
    security:
      - Bearer: []
    responses:
      200:
        description: List of users
    """
    conn = get_db()
    try:
        users = conn.execute("SELECT id, username, is_admin, is_banned, is_hidden FROM users").fetchall()
        res = [{"id": u["id"], "username": u["username"], "is_admin": bool(u["is_admin"]), "is_banned": bool(u["is_banned"]), "is_hidden": bool(u["is_hidden"])} for u in users]
    except sqlite3.OperationalError:
        users = conn.execute("SELECT id, username, is_admin, is_banned FROM users").fetchall()
        res = [{"id": u["id"], "username": u["username"], "is_admin": bool(u["is_admin"]), "is_banned": bool(u["is_banned"]), "is_hidden": False} for u in users]
    return jsonify(res)

@admin_bp.route('/users', methods=['POST'])
@admin_required
def api_admin_create_admin():
    """
    Create Admin User
    ---
    tags:
      - Admin Users
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            username:
              type: string
            password:
              type: string
    responses:
      201:
        description: Admin created
    """
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
        logger.exception("Internal error in api_create_admin")
        return jsonify({"error": "Internal server error"}), 500
        
    return jsonify({"status": "success", "message": "Admin user created successfully"}), 201

@admin_bp.route('/users/<int:user_id>/ban', methods=['PUT'])
@admin_required
def api_admin_toggle_ban(user_id):
    """
    Toggle User Ban
    ---
    tags:
      - Admin Users
    security:
      - Bearer: []
    parameters:
      - name: user_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: User ban toggled
    """
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
            http_requests.post(f"{Config.INSTANCE_MANAGER_URL}/instances/{user_id}/stop_all", headers={"X-API-Key": Config.IM_API_KEY}, timeout=10)
        except Exception:
            pass
            
    return jsonify({"status": "success", "is_banned": new_status})

@admin_bp.route('/users/<int:user_id>/toggle-hide', methods=['PUT'])
@admin_required
def api_admin_toggle_hide(user_id):
    """
    Toggle User Visibility (Hide from scoreboard)
    ---
    tags:
      - Admin Users
    security:
      - Bearer: []
    parameters:
      - name: user_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: User visibility toggled
    """
    conn = get_db()
    try:
        user = conn.execute("SELECT is_hidden, is_admin FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 404
        if user['is_admin']:
            return jsonify({"error": "Cannot hide admin"}), 400
            
        new_status = 0 if user['is_hidden'] else 1
        conn.execute("UPDATE users SET is_hidden = ? WHERE id = ?", (new_status, user_id))
        conn.commit()
        return jsonify({"status": "success", "is_hidden": new_status})
    except sqlite3.OperationalError:
        return jsonify({"error": "Migration not applied yet"}), 500

@admin_bp.route('/challenges', methods=['POST'])
@admin_required
def api_admin_add_challenge():
    """
    Add or Update Challenge
    ---
    tags:
      - Admin Challenges
    security:
      - Bearer: []
    consumes:
      - multipart/form-data
    parameters:
      - in: formData
        name: name
        type: string
        required: true
      - in: formData
        name: description
        type: string
      - in: formData
        name: category
        type: string
      - in: formData
        name: points
        type: integer
      - in: formData
        name: level
        type: string
        description: Challenge difficulty level (e.g., Easy, Medium, Hard, Expert)
    responses:
      200:
        description: Challenge created/updated
    """
    name = request.form.get('name')
    category = request.form.get('category')
    points = request.form.get('points', type=int)
    level = request.form.get('level') or 'Easy'
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
            r = http_requests.post(f"{Config.INSTANCE_MANAGER_URL}/admin/build", data=data, files=files, headers={"X-API-Key": Config.IM_API_KEY}, timeout=300)
            
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
            INSERT INTO challenges (name, description, category, base_points, is_hidden, is_dynamic, is_whitebox, download_url, min_points, decay, level)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET
            description=excluded.description,
            category=excluded.category,
            base_points=excluded.base_points,
            is_dynamic=excluded.is_dynamic,
            is_whitebox=excluded.is_whitebox,
            download_url=excluded.download_url,
            min_points=excluded.min_points,
            decay=excluded.decay,
            level=excluded.level
        ''', (name, description, category, points, 1, is_dynamic, is_whitebox, download_url, min_points, decay, level))
        conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
    return jsonify({"status": "success", "message": "Challenge saved successfully"})

@admin_bp.route('/challenges/<name>', methods=['DELETE'])
@admin_required
def api_admin_delete_challenge(name):
    """
    Delete Challenge
    ---
    tags:
      - Admin Challenges
    security:
      - Bearer: []
    parameters:
      - name: name
        in: path
        type: string
        required: true
    responses:
      200:
        description: Challenge deleted
    """
    try:
        r = http_requests.delete(f"{Config.INSTANCE_MANAGER_URL}/admin/build/{name}", headers={"X-API-Key": Config.IM_API_KEY}, timeout=60)
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
    """
    Toggle Challenge Visibility
    ---
    tags:
      - Admin Challenges
    security:
      - Bearer: []
    parameters:
      - name: name
        in: path
        type: string
        required: true
    responses:
      200:
        description: Visibility toggled
    """
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
    """
    Broadcast Notification
    ---
    tags:
      - Admin Notifications
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            title:
              type: string
            message:
              type: string
    responses:
      200:
        description: Notification broadcasted
    """
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
    """
    Delete User
    ---
    tags:
      - Admin Users
    security:
      - Bearer: []
    parameters:
      - name: user_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: User deleted
    """
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
    """
    Delete Notification
    ---
    tags:
      - Admin Notifications
    security:
      - Bearer: []
    parameters:
      - name: notif_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Notification deleted
    """
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
    """
    Get Game Settings
    ---
    tags:
      - Admin Game Settings
    security:
      - Bearer: []
    responses:
      200:
        description: Game settings
    """
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
    """
    Update Game Settings
    ---
    tags:
      - Admin Game Settings
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            start_time:
              type: string
            end_time:
              type: string
            is_paused:
              type: boolean
            freeze_time:
              type: string
    responses:
      200:
        description: Settings updated
    """
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
                http_requests.post(f"{Config.INSTANCE_MANAGER_URL}/instances/kill_all", headers={"X-API-Key": Config.IM_API_KEY}, timeout=10)
            except Exception as im_e:
                print("Failed to kill instances on pause:", im_e)
                
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
    return jsonify({"status": "success", "message": "Settings updated"})
