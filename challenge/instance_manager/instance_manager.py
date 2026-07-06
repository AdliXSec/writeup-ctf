#!/usr/bin/env python3
"""
CTF Instance Manager — On-Demand PicoCTF Style

Each team can run up to 3 challenge containers simultaneously.
Containers have a lifetime of 10 minutes and can be extended by 5 minutes.
Expired containers are automatically reaped.
Port scheme: 10000 + (team_id * 100) + challenge_offset
"""
import os
import secrets
import sqlite3
import logging
import time
import threading
from datetime import datetime, timezone, timedelta
from contextlib import contextmanager

from flask import Flask, request, jsonify
import docker

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
app = Flask(__name__)
DATA_DIR = os.environ.get("DATA_DIR", "/data")
DB_PATH = os.path.join(DATA_DIR, "instances.db")
PORT_BASE = 10000
PORT_BLOCK = 100
MAX_TEAMS = 100
NETWORK_NAME = "ctf-instances"

DEFAULT_DURATION = timedelta(minutes=10)
EXTEND_DURATION = timedelta(minutes=5)
MAX_CONCURRENT_INSTANCES = 3

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("instance-manager")

# ---------------------------------------------------------------------------
# Challenge Definitions
# ---------------------------------------------------------------------------
CHALLENGES = [
    {
        "name": "fetcher",
        "image": "ctf-fetcher",
        "internal_port": 5000,
        "offset": 0,
        "flag_desc": "_r_u_the_next_cve_hunter",
        "tmpfs": {"/tmp": ""},
        "command": None,
        "env_extra": {},
    },
    {
        "name": "nslookup",
        "image": "ctf-nslookup",
        "internal_port": 5001,
        "offset": 1,
        "flag_desc": "nslookup_command_injection",
        "tmpfs": {"/tmp": "", "/app/uploads": ""},
        "command": None,
        "env_extra": {},
    },
    {
        "name": "gag-wiki",
        "image": "ctf-gagwiki",
        "internal_port": 5002,
        "offset": 2,
        "flag_desc": "sqli_admin_bypass",
        "tmpfs": {"/tmp": ""},
        "command": None,
        "env_extra": {},
    },
    {
        "name": "svg-viewer",
        "image": "ctf-svgviewer",
        "internal_port": 80,
        "offset": 3,
        "flag_desc": "xxe_file_read_svg",
        "tmpfs": {"/tmp": "", "/run": "", "/var/www/html/uploads": ""},
        "command": ["/bin/sh", "-c", "echo $FLAG > /flag.txt && apache2-foreground"],
        "env_extra": {},
    },
    {
        "name": "passforge",
        "image": "ctf-passforge",
        "internal_port": 8120,
        "offset": 4,
        "flag_desc": "passforge_hash_extension",
        "proof_desc": "passforge_unlock",
        "tmpfs": {"/tmp": "", "/opt/ad/state": ""},
        "command": [
            "/bin/sh", "-c",
            "echo $FLAG > /flag.txt && echo $PROOF > /proof.txt && python service.py",
        ],
        "env_extra": {},
    },
    {
        "name": "papermaker",
        "image": "ctf-papermaker",
        "internal_port": 8130,
        "offset": 5,
        "flag_desc": "papermaker_yaml_deserialization_rce",
        "tmpfs": {"/tmp": "", "/app/tmp": "", "/app/log": "", "/app/storage": ""},
        "command": [
            "/bin/sh", "-c",
            "echo $FLAG > /flag.txt && mkdir -p tmp/pids && bundle exec rake db:setup && bundle exec rackup --host 0.0.0.0 -p 8130",
        ],
        "env_extra": {},
    },
    {
        "name": "betorganizer",
        "image": "ctf-betorganizer",
        "internal_port": 8140,
        "offset": 6,
        "flag_desc": "betorganizer_toctou_ssti",
        "tmpfs": {"/tmp": "", "/opt/ad/state": ""},
        "command": ["/bin/sh", "-c", "echo $FLAG > /flag.txt && ./betorganizer"],
        "env_extra": {},
    },
    {
        "name": "archivedesk",
        "image": "ctf-archivedesk",
        "internal_port": 8150,
        "offset": 7,
        "flag_desc": "archivedesk_weak_crypto_idor",
        "tmpfs": {
            "/tmp": "",
            "/run": "",
            "/opt/ad/state": "exec,mode=0755",
            "/etc/ssh/sshd_config.d": "",
        },
        "command": None,
        "env_extra": {"PORT": "8150"},
    },
    {
        "name": "action-packed",
        "image": "ctf-action-packed",
        "internal_port": 8160,
        "offset": 8,
        "flag_desc": "action_packed_broken_access_control",
        "tmpfs": {"/tmp": ""},
        "command": None,
        "env_extra": {},
    },
    {
        "name": "silent-oracle",
        "image": "ctf-silent-oracle",
        "internal_port": 8170,
        "offset": 9,
        "flag_desc": "silent_oracle_graphql_sqli",
        "tmpfs": {"/tmp": ""},
        "command": None,
        "env_extra": {},
    },
    {
        "name": "neon-reactor",
        "image": "ctf-neon-reactor",
        "internal_port": 80,
        "offset": 10,
        "flag_desc": "neon_reactor_magic_hash_mass_assignment",
        "tmpfs": {"/tmp": "", "/run": ""},
        "command": None,
        "env_extra": {},
    },
    {
        "name": "optix-archiver",
        "image": "ctf-optix-archiver",
        "internal_port": 8190,
        "offset": 11,
        "flag_desc": "optix_archiver_imagetragick_lfi",
        "tmpfs": {"/tmp": "", "/run": "", "/var/www/html/uploads": ""},
        "command": ["/bin/sh", "-c", "echo $FLAG > /flag.txt && apache2-foreground"],
        "env_extra": {},
    },
]
CHALLENGE_MAP = {c["name"]: c for c in CHALLENGES}

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------
def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS instances (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id     INTEGER NOT NULL,
            challenge   TEXT    NOT NULL,
            container_id TEXT,
            host_port   INTEGER NOT NULL,
            flag_value  TEXT    NOT NULL,
            proof_value TEXT,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at  DATETIME NOT NULL,
            last_extended_at DATETIME,
            UNIQUE(team_id, challenge)
        );
    """)
    conn.close()


def utcnow():
    return datetime.now(timezone.utc)

def str_to_dt(dt_str):
    return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))

def dt_to_str(dt):
    return dt.isoformat()


# ---------------------------------------------------------------------------
# Docker helpers
# ---------------------------------------------------------------------------
def get_docker():
    return docker.from_env()


def calc_port(team_id, offset):
    return PORT_BASE + (team_id * PORT_BLOCK) + offset


def container_name(challenge_name, team_id):
    return f"ctf-{challenge_name}-team{team_id}"


def generate_flag(desc, rand):
    return "LEEXY{" + desc + "_" + rand + "}"


def generate_proof(desc, rand):
    return "PROOF{" + desc + "_" + rand + "}"


def ensure_network(client):
    try:
        client.networks.get(NETWORK_NAME)
    except docker.errors.NotFound:
        client.networks.create(NETWORK_NAME, driver="bridge")
        log.info("Created Docker network: %s", NETWORK_NAME)


def start_challenge_instance(team_id, challenge_name):
    """Start a specific challenge instance for a team."""
    chal = CHALLENGE_MAP.get(challenge_name)
    if not chal:
        return False, "Challenge not found"

    client = get_docker()
    ensure_network(client)
    conn = get_db()

    # Check concurrent limit
    active_cnt = conn.execute(
        "SELECT COUNT(*) as cnt FROM instances WHERE team_id = ?", (team_id,)
    ).fetchone()["cnt"]
    
    # Check if this specific challenge is already running
    existing = conn.execute(
        "SELECT * FROM instances WHERE team_id = ? AND challenge = ?", (team_id, challenge_name)
    ).fetchone()

    if existing:
        conn.close()
        return False, "Challenge is already running"

    if active_cnt >= MAX_CONCURRENT_INSTANCES:
        conn.close()
        return False, f"Maximum concurrent instances ({MAX_CONCURRENT_INSTANCES}) reached. Stop another instance first."

    # Generate unique flags
    rand = secrets.token_hex(6)
    flag = generate_flag(chal["flag_desc"], rand)
    proof = None
    if "proof_desc" in chal:
        proof = generate_proof(chal["proof_desc"], secrets.token_hex(6))

    # Setup container
    host_port = calc_port(team_id, chal["offset"])
    name = container_name(chal["name"], team_id)

    try:
        old = client.containers.get(name)
        old.remove(force=True)
    except docker.errors.NotFound:
        pass

    env = {"FLAG": flag}
    env.update(chal.get("env_extra", {}))
    if proof:
        env["PROOF"] = proof

    port_binding = {f"{chal['internal_port']}/tcp": ("0.0.0.0", host_port)}
    kwargs = dict(
        image=chal["image"],
        name=name,
        detach=True,
        read_only=True,
        tmpfs=chal["tmpfs"],
        ports=port_binding,
        environment=env,
        restart_policy={"Name": "unless-stopped"},
    )
    if chal.get("command"):
        kwargs["command"] = chal["command"]

    try:
        container = client.containers.run(**kwargs)
        log.info("Started %s on port %d (container %s)", name, host_port, container.short_id)
        
        expires_at = utcnow() + DEFAULT_DURATION
        
        conn.execute(
            "INSERT INTO instances (team_id, challenge, container_id, host_port, flag_value, proof_value, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (team_id, challenge_name, container.id, host_port, flag, proof, dt_to_str(expires_at)),
        )
        conn.commit()
        conn.close()
        return True, {"port": host_port, "expires_at": dt_to_str(expires_at)}
    except Exception as exc:
        log.error("Failed to create %s for team %d: %s", challenge_name, team_id, exc)
        conn.close()
        return False, str(exc)


def stop_challenge_instance(team_id, challenge_name):
    """Stop and destroy a specific challenge instance."""
    conn = get_db()
    row = conn.execute(
        "SELECT container_id FROM instances WHERE team_id = ? AND challenge = ?", (team_id, challenge_name)
    ).fetchone()
    
    if not row:
        conn.close()
        return False, "Instance not found"

    client = get_docker()
    try:
        c = client.containers.get(row["container_id"])
        c.remove(force=True)
    except docker.errors.NotFound:
        pass
    except Exception as exc:
        log.error("Failed to remove container %s: %s", row["container_id"], exc)

    conn.execute("DELETE FROM instances WHERE team_id = ? AND challenge = ?", (team_id, challenge_name))
    conn.commit()
    conn.close()
    return True, "Instance destroyed"


def extend_challenge_instance(team_id, challenge_name):
    """Extend the expiration time of an instance."""
    conn = get_db()
    row = conn.execute(
        "SELECT expires_at, last_extended_at FROM instances WHERE team_id = ? AND challenge = ?", (team_id, challenge_name)
    ).fetchone()
    
    if not row:
        conn.close()
        return False, "Instance not found"

    now = utcnow()
    if row["last_extended_at"]:
        last_ext = str_to_dt(row["last_extended_at"])
        cooldown_end = last_ext + timedelta(minutes=3)
        if now < cooldown_end:
            conn.close()
            remaining = int((cooldown_end - now).total_seconds())
            return False, f"Tunggu {remaining} detik sebelum menambah waktu lagi"

    current_expires = str_to_dt(row["expires_at"])
    new_expires = current_expires + EXTEND_DURATION
        
    conn.execute(
        "UPDATE instances SET expires_at = ?, last_extended_at = ? WHERE team_id = ? AND challenge = ?",
        (dt_to_str(new_expires), dt_to_str(now), team_id, challenge_name)
    )
    conn.commit()
    conn.close()
    return True, {"expires_at": dt_to_str(new_expires)}


# ---------------------------------------------------------------------------
# Background Reaper
# ---------------------------------------------------------------------------
def reaper_task():
    while True:
        try:
            conn = get_db()
            now_str = dt_to_str(utcnow())
            expired = conn.execute(
                "SELECT team_id, challenge FROM instances WHERE expires_at < ?", (now_str,)
            ).fetchall()
            conn.close()
            
            for row in expired:
                tid = row["team_id"]
                chal = row["challenge"]
                log.info("Reaping expired instance: Team %d, Challenge %s", tid, chal)
                stop_challenge_instance(tid, chal)
        except Exception as e:
            log.error("Reaper error: %s", e)
        time.sleep(10)

def start_reaper():
    t = threading.Thread(target=reaper_task, daemon=True)
    t.start()


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "challenges": len(CHALLENGES), "max_teams": MAX_TEAMS})


@app.route("/instances/start", methods=["POST"])
def api_start_instance():
    data = request.get_json(silent=True) or {}
    team_id = data.get("team_id")
    challenge = data.get("challenge")
    
    if not team_id or not challenge:
        return jsonify({"error": "team_id and challenge required"}), 400

    ok, result = start_challenge_instance(team_id, challenge)
    if not ok:
        return jsonify({"error": result}), 400
    return jsonify({"status": "started", "data": result}), 201


@app.route("/instances/stop", methods=["POST"])
def api_stop_instance():
    data = request.get_json(silent=True) or {}
    team_id = data.get("team_id")
    challenge = data.get("challenge")
    
    if not team_id or not challenge:
        return jsonify({"error": "team_id and challenge required"}), 400

    ok, result = stop_challenge_instance(team_id, challenge)
    if not ok:
        return jsonify({"error": result}), 404
    return jsonify({"status": "stopped"}), 200


@app.route("/instances/extend", methods=["POST"])
def api_extend_instance():
    data = request.get_json(silent=True) or {}
    team_id = data.get("team_id")
    challenge = data.get("challenge")
    
    if not team_id or not challenge:
        return jsonify({"error": "team_id and challenge required"}), 400

    ok, result = extend_challenge_instance(team_id, challenge)
    if not ok:
        return jsonify({"error": result}), 404
    return jsonify({"status": "extended", "data": result}), 200


@app.route("/instances/<int:team_id>", methods=["GET"])
def api_get_instances(team_id):
    conn = get_db()
    rows = conn.execute(
        "SELECT challenge, host_port, expires_at FROM instances WHERE team_id = ?",
        (team_id,),
    ).fetchall()
    conn.close()

    res = {}
    for r in rows:
        res[r["challenge"]] = {
            "port": r["host_port"],
            "expires_at": r["expires_at"]
        }
    return jsonify({"team_id": team_id, "instances": res})


@app.route("/instances", methods=["GET"])
def api_get_all_instances():
    """Admin endpoint to list all running instances across all teams."""
    conn = get_db()
    rows = conn.execute(
        "SELECT team_id, challenge, host_port, expires_at FROM instances"
    ).fetchall()
    conn.close()
    
    res = []
    for r in rows:
        res.append({
            "team_id": r["team_id"],
            "challenge": r["challenge"],
            "port": r["host_port"],
            "expires_at": r["expires_at"]
        })
    return jsonify({"instances": res})


@app.route("/all-flags", methods=["GET"])
def api_all_flags():
    """Return all flags keyed by team_id (used by platform for submit validation)."""
    conn = get_db()
    rows = conn.execute("SELECT team_id, challenge, flag_value FROM instances").fetchall()
    conn.close()

    result = {}
    for row in rows:
        tid = str(row["team_id"])
        if tid not in result:
            result[tid] = {}
        result[tid][row["challenge"]] = row["flag_value"]
    return jsonify(result)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
init_db()
start_reaper()

if __name__ == "__main__":
    log.info("Instance Manager starting on port 9000")
    app.run(host="0.0.0.0", port=9000, debug=False)
