from flask import Blueprint, render_template

views_bp = Blueprint('views', __name__)

@views_bp.route('/')
def index():
    return render_template('index.html')

@views_bp.route('/register')
def register():
    return render_template('register.html')

@views_bp.route('/login')
def login():
    return render_template('login.html')

@views_bp.route('/submit')
def submit():
    return render_template('submit.html')

@views_bp.route('/profile')
def profile():
    return render_template('profile.html')

@views_bp.route('/challenges')
def challenges():
    return render_template('challenges.html')

@views_bp.route('/status')
def status():
    return render_template('status.html')

@views_bp.route('/attacks')
def attacks():
    return render_template('attacks.html')

@views_bp.route('/admin')
def admin():
    return render_template('admin/dashboard.html')

@views_bp.route('/admin/login')
def admin_login():
    return render_template('admin/login.html')
