from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from extensions import db
from models import Asset, MilitaryBase, User, AuditLog

asset_bp = Blueprint("assets", __name__)


# GET ALL ASSETS
@asset_bp.route("/api/assets", methods=["GET"])
@jwt_required()
def get_assets():

    claims = get_jwt()
    user_role = claims.get("role")
    user_id = int(get_jwt_identity())

    user = User.query.get(user_id)

    query = Asset.query

    # Base Commander can see only assets belonging to their base
    if user_role == "Base Commander":
        query = query.filter_by(base_id=user.base_id)

    assets = query.all()

    result = []

    for asset in assets:
        base = MilitaryBase.query.get(asset.base_id)

        result.append({
            "id": asset.id,
            "name": asset.name,
            "asset_type": asset.asset_type,
            "quantity": asset.quantity,
            "base_id": asset.base_id,
            "base_name": base.name if base else None,
            "created_at": asset.created_at.isoformat()
        })

    return jsonify({
        "count": len(result),
        "assets": result
    }), 200


# CREATE NEW ASSET
@asset_bp.route("/api/assets", methods=["POST"])
@jwt_required()
def create_asset():

    claims = get_jwt()
    user_role = claims.get("role")
    user_id = int(get_jwt_identity())

    # Only Admin and Logistics Officer can create assets
    if user_role not in ["Admin", "Logistics Officer"]:
        return jsonify({
            "message": "Access denied",
            "required_roles": ["Admin", "Logistics Officer"],
            "your_role": user_role
        }), 403

    data = request.get_json()

    name = data.get("name")
    asset_type = data.get("asset_type")
    quantity = data.get("quantity")
    base_id = data.get("base_id")

    # Validate required fields
    if not name or not asset_type or quantity is None or not base_id:
        return jsonify({
            "message": "name, asset_type, quantity and base_id are required"
        }), 400

    # Validate quantity
    if not isinstance(quantity, int) or quantity <= 0:
        return jsonify({
            "message": "quantity must be a positive integer"
        }), 400

    # Check whether the base exists
    base = MilitaryBase.query.get(base_id)

    if not base:
        return jsonify({
            "message": "Military base not found"
        }), 404

    # Create asset
    asset = Asset(
        name=name,
        asset_type=asset_type,
        quantity=quantity,
        base_id=base_id
    )

    db.session.add(asset)
    db.session.flush()

    # Create audit log
    audit = AuditLog(
        user_id=user_id,
        action="CREATE",
        entity="Asset",
        entity_id=asset.id,
        details=f"Created asset '{name}' with quantity {quantity} at {base.name}"
    )

    db.session.add(audit)
    db.session.commit()

    return jsonify({
        "message": "Asset created successfully",
        "asset": {
            "id": asset.id,
            "name": asset.name,
            "asset_type": asset.asset_type,
            "quantity": asset.quantity,
            "base_id": asset.base_id,
            "base_name": base.name
        }
    }), 201