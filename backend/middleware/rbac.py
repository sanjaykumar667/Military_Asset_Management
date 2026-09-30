from functools import wraps

from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt


def role_required(*allowed_roles):

    def decorator(function):

        @wraps(function)
        def wrapper(*args, **kwargs):

            # Check whether JWT is present and valid
            verify_jwt_in_request()

            # Get information stored inside JWT
            claims = get_jwt()

            user_role = claims.get("role")

            # Check user's role
            if user_role not in allowed_roles:
                return jsonify({
                    "message": "Access denied",
                    "required_roles": list(allowed_roles),
                    "your_role": user_role
                }), 403

            return function(*args, **kwargs)

        return wrapper

    return decorator