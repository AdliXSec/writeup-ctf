#!/usr/bin/env python3
"""
Fetcher - SSRF Challenge
Kerentanan: Server-Side Request Forgery dengan bypass filter.
Filter memblokir 'localhost' dan '127.0.0.1' tapi bisa dibypass
dengan representasi IP lain seperti 0x7f000001, 017700000001, dll.
"""
import os
import re
import urllib.request
from flask import Flask, request, render_template_string

app = Flask(__name__)

FLAG = os.environ.get("FLAG", "LEEXY{_r_u_the_next_cve_hunter_a8cdaf}")
BLOCKED_HOSTS = ["localhost", "127.0.0.1"]

INDEX_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Fetcher!</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; }
        h1 { color: #4285f4; text-align: center; font-size: 2.5em; }
        label { font-size: 1.1em; }
        input[type="text"] {
            width: 100%; padding: 10px; margin: 10px 0;
            border: 2px solid #ccc; border-radius: 4px; font-size: 1em;
        }
        input[type="text"]:focus { border-color: #4285f4; outline: none; }
        button {
            background-color: #4285f4; color: white; border: none;
            padding: 10px 24px; border-radius: 4px; cursor: pointer; font-size: 1em;
        }
        button:hover { background-color: #3367d6; }
        .response { margin-top: 20px; }
        .response h2 { font-size: 1.3em; }
        .response pre {
            background: #f5f5f5; padding: 15px; border-radius: 4px;
            white-space: pre-wrap; word-wrap: break-word;
        }
        .error { color: #d93025; }
    </style>
</head>
<body>
    <h1>Fetcher!</h1>
    <form method="POST" action="/fetch">
        <label>Enter a URL</label><br>
        <input type="text" name="url" placeholder="https://example.com" value="{{ url or '' }}">
        <br>
        <button type="submit">Fetch</button>
    </form>
    {% if response_content is not none %}
    <div class="response">
        <h2>Response Content:</h2>
        <pre>{{ response_content }}</pre>
    </div>
    {% endif %}
    {% if error %}
    <div class="response">
        <h2 class="error">Error:</h2>
        <pre class="error">{{ error }}</pre>
    </div>
    {% endif %}
</body>
</html>
"""


@app.route("/")
def index():
    return render_template_string(INDEX_HTML)


@app.route("/flag")
def flag_endpoint():
    """Endpoint internal - hanya bisa diakses dari localhost"""
    remote = request.remote_addr
    if remote in ("127.0.0.1", "::1"):
        return FLAG
    return "Access denied. Internal only.", 403


@app.route("/fetch", methods=["POST"])
def fetch():
    url = request.form.get("url", "").strip()
    if not url:
        return render_template_string(INDEX_HTML, error="Please provide a URL.")

    # --- VULNERABLE FILTER ---
    # Hanya cek string literal 'localhost' dan '127.0.0.1'
    # Tidak menghandle representasi IP lain: 0x7f000001, 2130706433,
    # 017700000001, 0177.0.0.1, [::1], dll.
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        hostname = parsed.hostname or ""

        for blocked in BLOCKED_HOSTS:
            if blocked.lower() == hostname.lower():
                return render_template_string(
                    INDEX_HTML,
                    url=url,
                    error=f"Access to '{hostname}' is blocked!"
                )
    except Exception:
        pass

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Fetcher/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            content = resp.read().decode("utf-8", errors="replace")
        return render_template_string(INDEX_HTML, url=url, response_content=content)
    except Exception as e:
        return render_template_string(INDEX_HTML, url=url, error=str(e))


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
