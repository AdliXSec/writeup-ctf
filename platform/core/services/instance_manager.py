import requests as http_requests
from config import Config

def im_provision(team_id):
    """Ask Instance Manager to create containers for a team."""
    try:
        resp = http_requests.post(
            f"{Config.INSTANCE_MANAGER_URL}/provision",
            json={"team_id": team_id},
            headers={"X-API-Key": Config.IM_API_KEY},
            timeout=120,
        )
        return resp.json()
    except Exception as exc:
        return {"error": str(exc)}

def im_get_instances(team_id):
    """Get port mapping for a team from Instance Manager."""
    try:
        resp = http_requests.get(
            f"{Config.INSTANCE_MANAGER_URL}/instances/{team_id}",
            headers={"X-API-Key": Config.IM_API_KEY},
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
            f"{Config.INSTANCE_MANAGER_URL}/all-flags",
            headers={"X-API-Key": Config.IM_API_KEY},
            timeout=10,
        )
        if resp.status_code == 200:
            return resp.json()
        return {}
    except Exception:
        return {}
