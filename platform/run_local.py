import os
import sys

# Override config for local testing
os.environ['FLASK_SECRET'] = 'test_secret_key_for_audit'
os.environ['JWT_SECRET'] = 'test_jwt_secret_for_audit'
os.environ['INSTANCE_MANAGER_URL'] = 'http://localhost:9000'

# Must import config AFTER setting env vars
sys.path.insert(0, os.path.dirname(__file__))

# Patch DB_PATH before anything imports it
import config
config.Config.DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'scoreboard.db')

os.makedirs(os.path.dirname(config.Config.DB_PATH), exist_ok=True)

from core import create_app
from core.db import init_db

app = create_app()
with app.app_context():
    init_db()

if __name__ == '__main__':
    print("Starting CTF Platform on http://localhost:8000")
    app.run(host='0.0.0.0', port=8000, debug=False)
