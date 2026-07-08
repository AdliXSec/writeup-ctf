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

@game_bp.route('/game/instances/start', methods=['POST'])
@jwt_required
def api_instance_start():
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
    team_id = g.user['id']
    instances = im_get_instances(team_id) or {}
    
    conn = get_db()
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

@game_bp.route('/scoreboard', methods=['GET'])
@jwt_required
def api_scoreboard():
    conn = get_db()
    scores = get_challenge_scores(conn)
    
    users = conn.execute('SELECT id, username FROM users WHERE is_admin = 0').fetchall()
    solves = conn.execute('SELECT user_id, challenge_id FROM solves').fetchall()
    
    user_scores = {u['id']: {"username": u['username'], "score": 0} for u in users}
    
    for solve in solves:
        uid = solve['user_id']
        chal_id = solve['challenge_id']
        if uid in user_scores:
            user_scores[uid]["score"] += scores.get(chal_id, 0)
            
    sorted_users = sorted(user_scores.values(), key=lambda x: x["score"], reverse=True)
    
    scoreboard = []
    rank = 1
    for user_info in sorted_users:
        if user_info["score"] > 0:
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

@game_bp.route('/submit', methods=['POST'])
@jwt_required
def api_submit():
    data = request.get_json(silent=True)
    if not isinstance(data, list):
        return jsonify({"type": "about:blank", "title": "Bad Request", "status": 400, "detail": "Expected array of flags"}), 400
    
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
        chal_id = req.get('challenge_id')
        flag_val = req.get('flag')
        
        if flag_val in flag_lookup:
            owner_team_id, real_chal_name = flag_lookup[flag_val]
            
            if owner_team_id == submitter_team_id and real_chal_name == chal_id:
                try:
                    conn.execute(
                        'INSERT INTO solves (user_id, challenge_id, flag_value) VALUES (?, ?, ?)',
                        (submitter_team_id, chal_id, flag_val)
                    )
                    conn.commit()
                    results.append({"challenge_id": chal_id, "status": "accepted", "message": "Flag correct!"})
                    accepted += 1
                except sqlite3.IntegrityError:
                    results.append({"challenge_id": chal_id, "status": "already_solved", "message": "You already solved this."})
                    rejected += 1
            else:
                results.append({"challenge_id": chal_id, "status": "rejected", "message": "Invalid flag for this challenge/team"})
                rejected += 1
        else:
            results.append({"challenge_id": chal_id, "status": "rejected", "message": "Invalid flag format"})
            rejected += 1
            
    return jsonify({
        "accepted": accepted,
        "rejected": rejected,
        "results": results
    })
