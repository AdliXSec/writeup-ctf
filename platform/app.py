import os
from core import create_app
from core.db import init_db
from config import Config

app = create_app()

# Initialize DB on load for Gunicorn
os.makedirs(os.path.dirname(Config.DB_PATH), exist_ok=True)
with app.app_context():
    init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False)
