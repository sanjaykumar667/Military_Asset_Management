from flask import Blueprint, request
from flask_jwt_extended import create_access_token
import bcrypt

from extensions import db
from models import User, Role


auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return {
            "message": "Email and password are required"
        }, 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return {
            "message": "Invalid email or password"
        }, 401

    password_valid = bcrypt.checkpw(
        password.encode("utf-8"),
        user.password.encode("utf-8")
    )

    if not password_valid:
        return {
            "message": "Invalid email or password"
        }, 401

    role = Role.query.get(user.role_id)

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": role.name
        }
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": role.name,
            "base_id": user.base_id
        }
    }, 200