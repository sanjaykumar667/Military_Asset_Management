from flask import Flask
from flask_cors import CORS
from extensions import db, jwt
from middleware.rbac import role_required

from config import Config
app = Flask(__name__)

app.config.from_object(Config)#load configuration

CORS(app) #ALLOW REACT FRONTEND TO ACCESS FLASK BACKEND
db.init_app(app) #initialize database
jwt.init_app(app) #initialize JWT manager

# Import database models
from models import (
    Role,
    MilitaryBase,
    User,
    Asset,
    Purchase,
    Transfer,
    Assignment,
    Expenditure,
    AuditLog
)

from routes.auth_routes import auth_bp

app.register_blueprint(auth_bp)

from routes.asset_routes import asset_bp
app.register_blueprint(asset_bp)

from routes.purchase_routes import purchase_bp
app.register_blueprint(purchase_bp)

from routes.transfer_routes import transfer_bp
app.register_blueprint(transfer_bp)

from routes.assignment_routes import assignment_bp
app.register_blueprint(assignment_bp)

from routes.expenditure_routes import expenditure_bp
app.register_blueprint(expenditure_bp)

from routes.dashboard_routes import dashboard_bp
from routes.audit_routes import audit_bp
from routes.base_routes import base_bp

app.register_blueprint(dashboard_bp)
app.register_blueprint(audit_bp)
app.register_blueprint(base_bp)


@app.route('/')
def home():
    return {
        "message" : "Military Asset Management API is running"
    }

@app.route("/api/admin/test", methods=["GET"])
@role_required("Admin")
def admin_test():

    return {
        "message": "Welcome Admin! You have access to this endpoint."
    }

# Create database tables
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)