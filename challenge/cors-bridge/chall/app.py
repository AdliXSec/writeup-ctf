import os
import subprocess
from flask import Flask, request, jsonify, render_template_string, make_response

app = Flask(__name__)
FLAG = os.environ.get('FLAG', 'LEEXY{fake_local_flag}')
ADMIN_COOKIE = "secret_admin_token_1337"

INDEX_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Admin Panel</title>
    <style>
        body { font-family: monospace; background: #111; color: #eee; padding: 20px; }
        input, button { padding: 8px; margin-top: 10px; background: #222; color: #fff; border: 1px solid #444; }
        #flag-container { margin-top: 20px; padding: 15px; border: 1px solid #333; background: #1a1a1a; }
    </style>
</head>
<body>
    <h1>CORS Bridge Admin Portal</h1>
    <p>Welcome to the admin portal. Only the admin can view the flag.</p>
    <div id="flag-container">
        Loading...
    </div>
    <hr>
    <h3>Report a link to Admin</h3>
    <form action="/report" method="POST">
        <input type="url" name="url" placeholder="http://attacker.com" required style="width: 300px;">
        <button type="submit">Report</button>
    </form>
    
    <script>
        fetch('/api/flag', {credentials: 'include'})
            .then(r => r.json())
            .then(data => {
                if(data.flag) {
                    document.getElementById('flag-container').innerText = "FLAG: " + data.flag;
                } else {
                    document.getElementById('flag-container').innerText = "Access Denied: You are not admin.";
                }
            })
            .catch(e => {
                document.getElementById('flag-container').innerText = "Error loading data.";
                console.error(e);
            });
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(INDEX_HTML)

@app.route('/api/flag', methods=['GET', 'OPTIONS'])
def api_flag():
    # VULNERABILITY: Blindly reflect Origin and allow credentials
    origin = request.headers.get('Origin', '*')
    
    # Handle preflight
    if request.method == 'OPTIONS':
        resp = make_response()
        resp.headers['Access-Control-Allow-Origin'] = origin
        resp.headers['Access-Control-Allow-Credentials'] = 'true'
        resp.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        resp.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return resp
        
    session = request.cookies.get('session')
    if session == ADMIN_COOKIE:
        resp = jsonify({"success": True, "flag": FLAG})
    else:
        resp = jsonify({"success": False, "error": "Unauthorized"})
        
    resp.headers['Access-Control-Allow-Origin'] = origin
    resp.headers['Access-Control-Allow-Credentials'] = 'true'
    return resp

@app.route('/report', methods=['POST'])
def report():
    url = request.form.get('url')
    if not url or not url.startswith('http'):
        return "Invalid URL", 400
        
    try:
        # Spawn the bot asynchronously
        subprocess.Popen(["python3", "bot.py", url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return "Admin will visit your URL shortly... <a href='/'>Back</a>"
    except Exception as e:
        return f"Error spawning bot: {e}", 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
