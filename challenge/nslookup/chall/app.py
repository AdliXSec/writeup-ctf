#!/usr/bin/env python3
import os
import re
import subprocess
from flask import Flask, request, render_template_string, send_from_directory, abort

app = Flask(__name__)

FLAG = os.environ.get("FLAG", "LEEXY{54fb3ec7adecdcb1930ef0528366b98e}")

UPLOAD_DIR = "/app/uploads"

BLACKLIST = [";", "&", "|", "$", "(", ")", "{", "}", "<", ">", "\n", "\r", "\\", "'", '"']

INPUT_BLOCKLIST = ["flag", "/etc/passwd", "/etc/shadow"]

INDEX_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>NSLookup Tool</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, sans-serif;
            background: #f0f2f5; display: flex; justify-content: center;
            align-items: center; min-height: 100vh;
        }
        .card {
            background: white; border-radius: 16px; padding: 40px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.1); width: 440px;
        }
        h1 { text-align: center; margin-bottom: 24px; font-size: 1.6em; }
        input[type="text"] {
            width: 100%; padding: 12px 16px; border: 1px solid #ddd;
            border-radius: 8px; font-size: 1em; margin-bottom: 16px;
        }
        button {
            width: 100%; padding: 12px; background: #22c55e; color: white;
            border: none; border-radius: 8px; font-size: 1.1em;
            cursor: pointer; font-weight: bold;
        }
        button:hover { background: #16a34a; }
        .output {
            margin-top: 20px; background: #1e293b; color: #e2e8f0;
            padding: 16px; border-radius: 12px; font-family: monospace;
            font-size: 0.85em; white-space: pre-wrap; word-wrap: break-word;
            max-height: 300px; overflow-y: auto;
        }
        .success { color: #4ade80; }
        .fail { color: #fbbf24; }
        .error { color: #ef4444; margin-top: 10px; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="card">
        <h1>NSLookup Tool</h1>
        <form method="POST" action="/lookup">
            <input type="text" name="domain" placeholder="example.com"
                   value="{{ domain or '' }}" autocomplete="off">
            <button type="submit">Lookup</button>
        </form>
        {% if error %}
        <p class="error">{{ error }}</p>
        {% endif %}
        {% if output %}
        <div class="output">{{ output }}</div>
        {% endif %}
    </div>
</body>
</html>
"""


def sanitize_output(raw_output: str, domain: str) -> str:
    lines = raw_output.strip().split("\n")
    result_parts = []
    
    dns_server = None
    resolved_ips = []
    is_authoritative = False
    in_answer = False
    
    for line in lines:
        line = line.strip()
        
        if line.startswith("Server:"):
            dns_server = line.split(":", 1)[1].strip()
        
        if "Non-authoritative answer" in line:
            in_answer = True
            is_authoritative = False
            continue
        
        if "Authoritative answer" in line or "authoritative answer" in line:
            in_answer = True
            is_authoritative = True
            continue
        
        if in_answer and line.startswith("Address:"):
            ip = line.split(":", 1)[1].strip()
            if re.match(r'^[\d.:a-fA-F]+$', ip):
                resolved_ips.append(ip)
        
        if in_answer and line.startswith("Name:"):
            name = line.split(":", 1)[1].strip()
            result_parts.append(f"Name:    {name}")
    
    output_lines = []
    
    if dns_server:
        output_lines.append(f"DNS Server: {dns_server}")
        output_lines.append("")
    
    if resolved_ips:
        output_lines.append(f"✓ Domain resolved successfully")
        for ip in resolved_ips:
            output_lines.append(f"  Address: {ip}")
    else:
        output_lines.append(f"✗ Could not resolve domain")
        output_lines.append(f"  Status: NXDOMAIN")
    
    return "\n".join(output_lines)


@app.route("/")
def index():
    return render_template_string(INDEX_HTML)


@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    safe_name = os.path.basename(filename)
    filepath = os.path.join(UPLOAD_DIR, safe_name)
    if os.path.isfile(filepath):
        return send_from_directory(UPLOAD_DIR, safe_name)
    abort(404)


@app.route("/lookup", methods=["POST"])
def lookup():
    domain = request.form.get("domain", "").strip()
    if not domain:
        return render_template_string(INDEX_HTML, error="Please enter a domain.")

    if len(domain) > 253:
        return render_template_string(INDEX_HTML, error="Domain name too long.")

    for char in BLACKLIST:
        if char in domain:
            return render_template_string(
                INDEX_HTML,
                domain=domain,
                error=f"Invalid character detected: '{char}'"
            )

    domain_lower = domain.lower()
    for blocked in INPUT_BLOCKLIST:
        if blocked in domain_lower:
            return render_template_string(
                INDEX_HTML,
                domain=domain,
                error="Suspicious input detected."
            )

    try:
        result = subprocess.run(
            f"nslookup {domain}",
            shell=True,              
            capture_output=True,
            text=True,
            timeout=10
        )
        raw_output = result.stdout + result.stderr
        
        clean_output = sanitize_output(raw_output, domain)
        
        return render_template_string(INDEX_HTML, domain=domain, output=clean_output)
    except subprocess.TimeoutExpired:
        return render_template_string(INDEX_HTML, domain=domain, error="Lookup timed out.")
    except Exception as e:
        return render_template_string(INDEX_HTML, domain=domain, error="An internal error occurred.")


if __name__ == "__main__":
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with open("/flag.txt", "w") as f:
        f.write(FLAG)

    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)
