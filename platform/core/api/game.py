import os
import sqlite3
import requests as http_requests
from flask import Blueprint, request, jsonify, g, make_response

from config import Config
from core.db import get_db
from core.decorators import jwt_required
from core.services.instance_manager import im_provision, im_get_instances, im_get_all_flags
from core.utils.scoring import get_challenge_scores

game_bp = Blueprint('game_api', __name__, url_prefix='/api/v2')

def check_game_active():
    conn = get_db()
    settings = conn.execute("SELECT start_time, end_time, is_paused FROM game_settings WHERE id = 1").fetchone()
    if settings:
        import datetime
        now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        if settings['start_time'] and now < settings['start_time']:
            return jsonify({"error": "CTF hasn't started yet"}), 403
        if settings['end_time'] and now > settings['end_time']:
            return jsonify({"error": "CTF has ended"}), 403
        if settings['is_paused']:
            return jsonify({"error": "CTF is manually paused"}), 403
    return None

@game_bp.route('/game/instances/start', methods=['POST'])
@jwt_required
def api_instance_start():
    err = check_game_active()
    if err: return err
    
    data = request.get_json(silent=True) or {}
    chal_name = data.get("challenge")
    
    # Check if team is provisioned
    im_provision(g.user['id'])
    
    resp = http_requests.post(
        f"{Config.INSTANCE_MANAGER_URL}/instances/start",
        json={"team_id": g.user['id'], "challenge": chal_name},
        timeout=120
    )
    return make_response(resp.content, resp.status_code)

@game_bp.route('/game/instances/stop', methods=['POST'])
@jwt_required
def api_instance_stop():
    data = request.get_json(silent=True) or {}
    chal_name = data.get("challenge")
    resp = http_requests.post(
        f"{Config.INSTANCE_MANAGER_URL}/instances/stop",
        json={"team_id": g.user['id'], "challenge": chal_name},
        timeout=10
    )
    return make_response(resp.content, resp.status_code)

@game_bp.route('/game/instances/extend', methods=['POST'])
@jwt_required
def api_instance_extend():
    err = check_game_active()
    if err: return err
    data = request.get_json(silent=True) or {}
    chal_name = data.get("challenge")
    resp = http_requests.post(
        f"{Config.INSTANCE_MANAGER_URL}/instances/extend",
        json={"team_id": g.user['id'], "challenge": chal_name},
        timeout=10
    )
    return make_response(resp.content, resp.status_code)

@game_bp.route('/game/instances/reset', methods=['POST'])
@jwt_required
def api_instance_reset():
    err = check_game_active()
    if err: return err
    data = request.get_json(silent=True) or {}
    chal_name = data.get("challenge")
    http_requests.post(
        f"{Config.INSTANCE_MANAGER_URL}/instances/stop",
        json={"team_id": g.user['id'], "challenge": chal_name},
        timeout=10
    )
    resp = http_requests.post(
        f"{Config.INSTANCE_MANAGER_URL}/instances/start",
        json={"team_id": g.user['id'], "challenge": chal_name},
        timeout=120
    )
    return make_response(resp.content, resp.status_code)

@game_bp.route('/challenges', methods=['GET'])
@jwt_required
def api_challenges():
    conn = get_db()
    settings = conn.execute("SELECT start_time FROM game_settings WHERE id = 1").fetchone()
    if settings and settings['start_time']:
        import datetime
        now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        if now < settings['start_time']:
            return jsonify({"error": "Game has not started yet"}), 403

    team_id = g.user['id']
    instances = im_get_instances(team_id) or {}
    
    scores = get_challenge_scores(conn)
    
    try:
        if g.user['is_admin']:
            rows = conn.execute('SELECT id, name, description, category, base_points, is_hidden, is_dynamic FROM challenges').fetchall()
        else:
            rows = conn.execute('SELECT id, name, description, category, base_points, is_hidden, is_dynamic FROM challenges WHERE is_hidden = 0').fetchall()
    except sqlite3.OperationalError:
        if g.user['is_admin']:
            rows = conn.execute('SELECT id, name, description, category, base_points, is_hidden, 0 as is_dynamic FROM challenges').fetchall()
        else:
            rows = conn.execute('SELECT id, name, description, category, base_points, is_hidden, 0 as is_dynamic FROM challenges WHERE is_hidden = 0').fetchall()
    
    host = os.environ.get('CTF_HOST', 'localhost')
    chal_list = []
    
    for row in rows:
        name = row['name']
        chal_info = {
            "id": row['id'],
            "name": name,
            "category": row['category'],
            "description": row['description'],
            "points": scores.get(name, row['base_points']),
            "is_dynamic": bool(row['is_dynamic']),
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

@game_bp.route('/game/status', methods=['GET'])
@jwt_required
def api_game_status():
    conn = get_db()
    settings = conn.execute("SELECT start_time, end_time, is_paused, freeze_time FROM game_settings WHERE id = 1").fetchone()
    
    import datetime
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    
    started = True
    ended = False
    accepting = True
    
    if settings:
        if settings['start_time'] and now < settings['start_time']:
            started = False
            accepting = False
        if settings['end_time'] and now > settings['end_time']:
            ended = True
            accepting = False
        if settings['is_paused']:
            accepting = False

    return jsonify({
        "match": {
            "state": "ended" if ended else ("running" if started else "pending"),
            "started_at": settings['start_time'] if settings else None,
            "end_time": settings['end_time'] if settings else None,
            "accepting_submissions": accepting,
            "is_frozen": True if (settings and settings['freeze_time']) else False
        },
        "mode": "dynamic_instancing",
        "scheduler": {
            "state": "running",
        },
    })

@game_bp.route('/scoreboard', methods=['GET'])
@jwt_required
def api_scoreboard():
    conn = get_db()
    scores = get_challenge_scores(conn)
    
    users = conn.execute('SELECT id, username FROM users WHERE is_admin = 0 AND is_banned = 0').fetchall()
    settings = conn.execute("SELECT freeze_time FROM game_settings WHERE id = 1").fetchone()
    
    if settings and settings['freeze_time']:
        solves = conn.execute('SELECT user_id, challenge_id, blood_tier FROM solves WHERE solved_at <= ?', (settings['freeze_time'],)).fetchall()
    else:
        solves = conn.execute('SELECT user_id, challenge_id, blood_tier FROM solves').fetchall()
    
    user_scores = {u['id']: {"username": u['username'], "score": 0} for u in users}
    
    for solve in solves:
        uid = solve['user_id']
        chal_id = solve['challenge_id']
        b_tier = solve['blood_tier']
        
        if uid in user_scores:
            user_scores[uid]["score"] += scores.get(chal_id, 0)
            if b_tier == 1:
                user_scores[uid]["score"] += 50
            elif b_tier == 2:
                user_scores[uid]["score"] += 30
            elif b_tier == 3:
                user_scores[uid]["score"] += 10
            
    sorted_users = sorted(user_scores.values(), key=lambda x: x["score"], reverse=True)
    
    scoreboard = []
    rank = 1
    for user_info in sorted_users:
        if user_info["score"] >= 0:
            scoreboard.append({
                "rank": rank,
                "team": user_info['username'],
                "attack": 0,
                "defense": 0,
                "sla": 0,
                "total": user_info['score'],
                "delta": "+0"
            })
            rank += 1
            
    return jsonify(scoreboard)

@game_bp.route('/attacks', methods=['GET'])
@jwt_required
def api_attacks():
    conn = get_db()
    settings = conn.execute("SELECT freeze_time FROM game_settings WHERE id = 1").fetchone()
    if settings and settings['freeze_time']:
        query = '''
            SELECT s.id, u.username, s.challenge_id, s.solved_at
            FROM solves s 
            JOIN users u ON s.user_id = u.id 
            WHERE u.is_admin = 0 AND u.is_banned = 0 AND s.solved_at <= ?
            ORDER BY s.solved_at DESC LIMIT 50
        '''
        rows = conn.execute(query, (settings['freeze_time'],)).fetchall()
    else:
        query = '''
            SELECT s.id, u.username, s.challenge_id, s.solved_at
            FROM solves s 
            JOIN users u ON s.user_id = u.id 
            WHERE u.is_admin = 0 AND u.is_banned = 0
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

@game_bp.route('/submit', methods=['POST'])
@jwt_required
def api_submit():
    data = request.get_json(silent=True)
    if not isinstance(data, list):
        return jsonify({"type": "about:blank", "title": "Bad Request", "status": 400, "detail": "Expected array of flags"}), 400
        
    conn = get_db()
    settings = conn.execute("SELECT start_time, end_time, is_paused FROM game_settings WHERE id = 1").fetchone()
    
    if settings:
        import datetime
        now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        if settings['start_time'] and now < settings['start_time']:
            return jsonify({"type": "about:blank", "title": "Forbidden", "status": 403, "detail": "CTF hasn't started yet"}), 403
        if settings['end_time'] and now > settings['end_time']:
            return jsonify({"type": "about:blank", "title": "Forbidden", "status": 403, "detail": "CTF has ended"}), 403
        if settings['is_paused']:
            return jsonify({"type": "about:blank", "title": "Forbidden", "status": 403, "detail": "CTF is manually paused"}), 403
    
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
    
    for req in data:
        if isinstance(req, dict):
            flag_val = req.get('flag')
            provided_chal_id = req.get('challenge_id')
        else:
            flag_val = str(req)
            provided_chal_id = None
            
        if not flag_val:
            results.append({"challenge_id": "unknown", "status": "rejected", "message": "No flag provided"})
            rejected += 1
            continue
        
        if flag_val in flag_lookup:
            owner_team_id, real_chal_name = flag_lookup[flag_val]
            
            # Check if team owns this flag. If they provided a chal_id, make sure it matches too.
            chal_match = (provided_chal_id == real_chal_name) if provided_chal_id else True
            
            if owner_team_id == submitter_team_id and chal_match:
                # Check for blood tier
                solve_count = conn.execute("SELECT COUNT(*) FROM solves WHERE challenge_id = ?", (real_chal_name,)).fetchone()[0]
                blood_tier = (solve_count + 1) if solve_count < 3 else 0
                
                try:
                    conn.execute(
                        'INSERT INTO solves (user_id, challenge_id, flag_value, is_first_blood, blood_tier) VALUES (?, ?, ?, ?, ?)',
                        (submitter_team_id, real_chal_name, flag_val, 1 if blood_tier == 1 else 0, blood_tier)
                    )
                    conn.commit()
                    
                    if blood_tier > 0:
                        # Broadcast notification
                        team_name = g.user['username']
                        if blood_tier == 1:
                            notif_title = f"🩸 First Blood: {real_chal_name.upper()}!"
                            bonus = 50
                            tier_name = "FIRST BLOOD"
                        elif blood_tier == 2:
                            notif_title = f"🥈 Second Blood: {real_chal_name.upper()}!"
                            bonus = 30
                            tier_name = "SECOND BLOOD"
                        elif blood_tier == 3:
                            notif_title = f"🥉 Third Blood: {real_chal_name.upper()}!"
                            bonus = 10
                            tier_name = "THIRD BLOOD"
                            
                        notif_msg = f"Tim {team_name} berhasil merebut {tier_name} pada tantangan {real_chal_name.upper()} dan mendapatkan {bonus} poin ekstra!"
                        conn.execute("INSERT INTO notifications (title, message) VALUES (?, ?)", (notif_title, notif_msg))
                        conn.commit()
                        
                        results.append({"challenge_id": real_chal_name, "status": "accepted", "message": f"Flag correct! {tier_name} (+{bonus} pts)!"})
                    else:
                        results.append({"challenge_id": real_chal_name, "status": "accepted", "message": "Flag correct!"})
                    accepted += 1
                except sqlite3.IntegrityError:
                    results.append({"challenge_id": real_chal_name, "status": "duplicate", "message": "You already solved this."})
                    rejected += 1
            else:
                results.append({"challenge_id": provided_chal_id or "unknown", "status": "rejected", "message": "Invalid flag for this challenge/team"})
                rejected += 1
        else:
            results.append({"challenge_id": provided_chal_id or "unknown", "status": "rejected", "message": "Invalid flag format"})
            rejected += 1
            
    return jsonify({
        "accepted": accepted,
        "rejected": rejected,
        "results": results
    })

@game_bp.route('/notifications', methods=['GET'])
@jwt_required
def api_notifications():
    conn = get_db()
    rows = conn.execute("SELECT id, title, message, created_at FROM notifications ORDER BY created_at DESC").fetchall()
    
    res = []
    for r in rows:
        res.append({
            "id": r["id"],
            "title": r["title"],
            "message": r["message"],
            "created_at": r["created_at"]
        })
    return jsonify(res)
