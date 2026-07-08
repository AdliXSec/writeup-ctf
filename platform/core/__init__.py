from flask import Flask

def create_app():
    app = Flask(__name__, template_folder='../templates', static_folder='../static')
    
    from config import Config
    app.config.from_object(Config)
    
    # Register Teardown
    from core.db import close_connection
    app.teardown_appcontext(close_connection)
    
    # Register Blueprints
    from core.api.auth import auth_bp
    from core.api.game import game_bp
    from core.api.admin import admin_bp
    from core.routes.views import views_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(game_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(views_bp)
    
    return app
