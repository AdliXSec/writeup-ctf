from flask import Flask
from flask_cors import CORS
from flasgger import Swagger

def create_app():
    app = Flask(__name__, static_folder='../static')
    CORS(app, supports_credentials=True)
    
    from config import Config
    app.config.from_object(Config)
    
    # Configure Swagger UI
    app.config['SWAGGER'] = {
        'title': 'CTF Platform API',
        'uiversion': 3
    }
    
    swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": 'apispec',
                "route": '/apispec.json',
                "rule_filter": lambda rule: True,
                "model_filter": lambda tag: True,
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/docs"
    }
    
    # Swagger security definition (Bearer token)
    swagger_template = {
        "swagger": "2.0",
        "info": {
            "title": "CTF Platform API",
            "description": "Headless API for the Leexy CTF Engine.",
            "version": "1.0.0"
        },
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": 'JWT Authorization header using the Bearer scheme. Example: "Bearer {token}"'
            }
        },
        "security": [{"Bearer": []}]
    }
    Swagger(app, config=swagger_config, template=swagger_template)
    
    # Register Teardown
    from core.db import close_connection
    app.teardown_appcontext(close_connection)
    
    # Register Blueprints
    from core.api.auth import auth_bp
    from core.api.game import game_bp
    from core.api.admin import admin_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(game_bp)
    app.register_blueprint(admin_bp)
    
    return app
