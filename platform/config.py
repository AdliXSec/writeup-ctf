import os

class Config:
    DB_PATH = '/app/data/scoreboard.db'
    INSTANCE_MANAGER_URL = os.environ.get('INSTANCE_MANAGER_URL', 'http://ctf-instance-manager:9000')

def get_or_create_secret():
    secret_path = '/app/data/secret.key'
    try:
        os.makedirs('/app/data', exist_ok=True)
        if not os.path.exists(secret_path):
            fd = os.open(secret_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.write(fd, os.urandom(32).hex().encode())
            os.close(fd)
    except FileExistsError:
        pass
    with open(secret_path, 'r') as f:
        return f.read().strip()

_persistent_secret = get_or_create_secret()
Config.SECRET_KEY = os.environ.get('FLASK_SECRET', _persistent_secret)
Config.JWT_SECRET = os.environ.get('JWT_SECRET', _persistent_secret)
