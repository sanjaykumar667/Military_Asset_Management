from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from models import MilitaryBase

base_bp = Blueprint("base", __name__)


@base_bp.route("/api/bases", methods=["GET"])
@jwt_required()
def get_bases():

    bases = MilitaryBase.query.order_by(
        MilitaryBase.name
    ).all()

    result = []

    for base in bases:
        result.append({
            "id": base.id,
            "name": base.name,
            "location": base.location
        })

    return jsonify({
        "count": len(result),
        "bases": result
    }), 200