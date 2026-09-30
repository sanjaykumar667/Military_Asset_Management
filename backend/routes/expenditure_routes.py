from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from extensions import db
from models import Expenditure, Asset, MilitaryBase, User, AuditLog

expenditure_bp = Blueprint("expenditures", __name__)


# GET ALL EXPENDITURES
@expenditure_bp.route("/api/expenditures", methods=["GET"])
@jwt_required()
def get_expenditures():

    claims = get_jwt()
    user_role = claims.get("role")
    user_id = int(get_jwt_identity())

    user = User.query.get(user_id)

    query = Expenditure.query

    # Base Commander sees expenditures from their own base
    if user_role == "Base Commander":
        query = query.filter_by(base_id=user.base_id)

    expenditures = query.order_by(
        Expenditure.expenditure_date.desc()
    ).all()

    result = []

    for expenditure in expenditures:

        asset = Asset.query.get(expenditure.asset_id)
        base = MilitaryBase.query.get(expenditure.base_id)

        result.append({
            "id": expenditure.id,
            "asset_id": expenditure.asset_id,
            "asset_name": asset.name if asset else None,
            "quantity": expenditure.quantity,
            "base_id": expenditure.base_id,
            "base_name": base.name if base else None,
            "expenditure_date": expenditure.expenditure_date.isoformat(),
            "created_by": expenditure.created_by
        })

    return jsonify({
        "count": len(result),
        "expenditures": result
    }), 200


# CREATE EXPENDITURE
@expenditure_bp.route("/api/expenditures", methods=["POST"])
@jwt_required()
def create_expenditure():

    claims = get_jwt()
    user_role = claims.get("role")
    user_id = int(get_jwt_identity())

    # Only Admin and Logistics Officer can create expenditures
    if user_role not in ["Admin", "Logistics Officer"]:
        return jsonify({
            "message": "Access denied",
            "required_roles": ["Admin", "Logistics Officer"],
            "your_role": user_role
        }), 403

    data = request.get_json()

    asset_id = data.get("asset_id")
    quantity = data.get("quantity")
    base_id = data.get("base_id")

    # Validate required fields
    if not asset_id or quantity is None or not base_id:
        return jsonify({
            "message": "asset_id, quantity and base_id are required"
        }), 400

    # Validate quantity
    if not isinstance(quantity, int) or quantity <= 0:
        return jsonify({
            "message": "quantity must be a positive integer"
        }), 400

    # Find asset
    asset = Asset.query.get(asset_id)

    if not asset:
        return jsonify({
            "message": "Asset not found"
        }), 404

    # Find base
    base = MilitaryBase.query.get(base_id)

    if not base:
        return jsonify({
            "message": "Military base not found"
        }), 404

    # Make sure asset belongs to selected base
    if asset.base_id != base_id:
        return jsonify({
            "message": "Asset does not belong to the selected base"
        }), 400

    # Check available quantity
    if asset.quantity < quantity:
        return jsonify({
            "message": "Insufficient asset quantity",
            "available_quantity": asset.quantity,
            "requested_quantity": quantity
        }), 400

    # Reduce stock
    asset.quantity -= quantity

    # Create expenditure record
    expenditure = Expenditure(
        asset_id=asset_id,
        quantity=quantity,
        base_id=base_id,
        created_by=user_id
    )

    db.session.add(expenditure)
    db.session.flush()

    # Create audit log
    audit = AuditLog(
        user_id=user_id,
        action="CREATE",
        entity="Expenditure",
        entity_id=expenditure.id,
        details=(
            f"Expended {quantity} units of "
            f"'{asset.name}' at {base.name}"
        )
    )

    db.session.add(audit)

    db.session.commit()

    return jsonify({
        "message": "Expenditure recorded successfully",
        "expenditure": {
            "id": expenditure.id,
            "asset_name": asset.name,
            "quantity_expended": quantity,
            "base_name": base.name,
            "remaining_quantity": asset.quantity
        }
    }), 201