from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from extensions import db
from models import Purchase, Asset, MilitaryBase, User, AuditLog

purchase_bp = Blueprint("purchases", __name__)


# GET ALL PURCHASES
@purchase_bp.route("/api/purchases", methods=["GET"])
@jwt_required()
def get_purchases():

    claims = get_jwt()
    user_role = claims.get("role")
    user_id = int(get_jwt_identity())

    user = User.query.get(user_id)

    query = Purchase.query

    # Base Commander can see only purchases from their base
    if user_role == "Base Commander":
        query = query.filter_by(base_id=user.base_id)

    purchases = query.order_by(Purchase.purchase_date.desc()).all()

    result = []

    for purchase in purchases:

        asset = Asset.query.get(purchase.asset_id)
        base = MilitaryBase.query.get(purchase.base_id)

        result.append({
            "id": purchase.id,
            "asset_id": purchase.asset_id,
            "asset_name": asset.name if asset else None,
            "base_id": purchase.base_id,
            "base_name": base.name if base else None,
            "quantity": purchase.quantity,
            "purchase_date": purchase.purchase_date.isoformat(),
            "created_by": purchase.created_by
        })

    return jsonify({
        "count": len(result),
        "purchases": result
    }), 200


# CREATE PURCHASE
@purchase_bp.route("/api/purchases", methods=["POST"])
@jwt_required()
def create_purchase():

    claims = get_jwt()
    user_role = claims.get("role")
    user_id = int(get_jwt_identity())

    # Only Admin and Logistics Officer can create purchases
    if user_role not in ["Admin", "Logistics Officer"]:
        return jsonify({
            "message": "Access denied",
            "required_roles": ["Admin", "Logistics Officer"],
            "your_role": user_role
        }), 403

    data = request.get_json()

    asset_id = data.get("asset_id")
    base_id = data.get("base_id")
    quantity = data.get("quantity")

    # Validate required fields
    if not asset_id or not base_id or quantity is None:
        return jsonify({
            "message": "asset_id, base_id and quantity are required"
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

    # Make sure the asset belongs to this base
    if asset.base_id != base_id:
        return jsonify({
            "message": "Asset does not belong to the selected base"
        }), 400

    # Increase available quantity
    asset.quantity += quantity

    # Create purchase record
    purchase = Purchase(
        asset_id=asset_id,
        base_id=base_id,
        quantity=quantity,
        created_by=user_id
    )

    db.session.add(purchase)
    db.session.flush()

    # Create audit log
    audit = AuditLog(
        user_id=user_id,
        action="CREATE",
        entity="Purchase",
        entity_id=purchase.id,
        details=(
            f"Purchased {quantity} units of '{asset.name}' "
            f"for {base.name}"
        )
    )

    db.session.add(audit)

    db.session.commit()

    return jsonify({
        "message": "Purchase recorded successfully",
        "purchase": {
            "id": purchase.id,
            "asset_id": asset.id,
            "asset_name": asset.name,
            "base_id": base.id,
            "base_name": base.name,
            "quantity_purchased": quantity,
            "new_asset_quantity": asset.quantity
        }
    }), 201