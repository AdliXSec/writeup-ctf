#!/usr/bin/env python3
"""
Nslookup - Command Injection Challenge
Kerentanan: Aplikasi menjalankan nslookup via shell=True dengan blacklist
karakter yang tidak lengkap. Backtick (`) TIDAK diblokir, sehingga
memungkinkan command injection.
"""
import os
import subprocess
from flask import Flask, request, render_template_string

app = Flask(__name__)

FLAG = os.environ.get("FLAG", "foresty{54fb3ec7adecdcb1930ef0528366b98e}")

# Blacklist karakter - SENGAJA tidak lengkap (tidak ada backtick `)
BLACKLIST = [";", "&", "|", "$", "(", ")", "{", "}", "<", ">", "\n", "\r", "\\", "'", '"']

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
            box-shadow: 0 4px 24px rgba(0,0,0,0.1); width: 400px;
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


@app.route("/")
def index():
    return render_template_string(INDEX_HTML)


@app.route("/lookup", methods=["POST"])
def lookup():
    domain = request.form.get("domain", "").strip()
    if not domain:
        return render_template_string(INDEX_HTML, error="Please enter a domain.")

    # --- VULNERABLE BLACKLIST ---
    # Backtick (`) TIDAK ada dalam blacklist!
    for char in BLACKLIST:
        if char in domain:
            return render_template_string(
                INDEX_HTML,
                domain=domain,
                error=f"Invalid character detected: '{char}'"
            )

    try:
        # --- VULNERABLE: shell=True ---
        # Backtick memungkinkan command substitution di shell
        # Contoh: `whoami`.example.com → shell akan eksekusi `whoami` dulu
        result = subprocess.run(
            f"nslookup {domain}",
            shell=True,               # ← KERENTANAN UTAMA
            capture_output=True,
            text=True,
            timeout=10
        )
        output = result.stdout + result.stderr
        return render_template_string(INDEX_HTML, domain=domain, output=output)
    except subprocess.TimeoutExpired:
        return render_template_string(INDEX_HTML, domain=domain, error="Lookup timed out.")
    except Exception as e:
        return render_template_string(INDEX_HTML, domain=domain, error=str(e))


if __name__ == "__main__":
    # Tulis flag ke file
    with open("/tmp/flag.txt", "w") as f:
        f.write(FLAG)

    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)
