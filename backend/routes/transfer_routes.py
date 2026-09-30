from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from extensions import db
from models import Transfer, Asset, MilitaryBase, User, AuditLog

transfer_bp = Blueprint("transfers", __name__)


# GET ALL TRANSFERS
@transfer_bp.route("/api/transfers", methods=["GET"])
@jwt_required()
def get_transfers():

    claims = get_jwt()
    user_role = claims.get("role")
    user_id = int(get_jwt_identity())

    user = User.query.get(user_id)

    query = Transfer.query

    # Base Commander sees transfers involving their own base
    if user_role == "Base Commander":
        query = query.filter(
            (Transfer.from_base_id == user.base_id) |
            (Transfer.to_base_id == user.base_id)
        )

    transfers = query.order_by(
        Transfer.transfer_date.desc()
    ).all()

    result = []

    for transfer in transfers:

        asset = Asset.query.get(transfer.asset_id)
        from_base = MilitaryBase.query.get(transfer.from_base_id)
        to_base = MilitaryBase.query.get(transfer.to_base_id)

        result.append({
            "id": transfer.id,
            "asset_id": transfer.asset_id,
            "asset_name": asset.name if asset else None,
            "from_base_id": transfer.from_base_id,
            "from_base_name": from_base.name if from_base else None,
            "to_base_id": transfer.to_base_id,
            "to_base_name": to_base.name if to_base else None,
            "quantity": transfer.quantity,
            "transfer_date": transfer.transfer_date.isoformat(),
            "created_by": transfer.created_by
        })

    return jsonify({
        "count": len(result),
        "transfers": result
    }), 200


# CREATE TRANSFER
@transfer_bp.route("/api/transfers", methods=["POST"])
@jwt_required()
def create_transfer():

    claims = get_jwt()
    user_role = claims.get("role")
    user_id = int(get_jwt_identity())

    # Only Admin and Logistics Officer can create transfers
    if user_role not in ["Admin", "Logistics Officer"]:
        return jsonify({
            "message": "Access denied",
            "required_roles": ["Admin", "Logistics Officer"],
            "your_role": user_role
        }), 403

    data = request.get_json()

    asset_id = data.get("asset_id")
    from_base_id = data.get("from_base_id")
    to_base_id = data.get("to_base_id")
    quantity = data.get("quantity")

    # Validate required fields
    if (
        not asset_id
        or not from_base_id
        or not to_base_id
        or quantity is None
    ):
        return jsonify({
            "message": (
                "asset_id, from_base_id, "
                "to_base_id and quantity are required"
            )
        }), 400

    # Validate quantity
    if not isinstance(quantity, int) or quantity <= 0:
        return jsonify({
            "message": "quantity must be a positive integer"
        }), 400

    # Source and destination cannot be the same
    if from_base_id == to_base_id:
        return jsonify({
            "message": "Source and destination bases must be different"
        }), 400

    # Find source asset
    source_asset = Asset.query.get(asset_id)

    if not source_asset:
        return jsonify({
            "message": "Asset not found"
        }), 404

    # Make sure asset belongs to source base
    if source_asset.base_id != from_base_id:
        return jsonify({
            "message": "Asset does not belong to the source base"
        }), 400

    # Check source base
    from_base = MilitaryBase.query.get(from_base_id)

    if not from_base:
        return jsonify({
            "message": "Source base not found"
        }), 404

    # Check destination base
    to_base = MilitaryBase.query.get(to_base_id)

    if not to_base:
        return jsonify({
            "message": "Destination base not found"
        }), 404

    # Check available quantity
    if source_asset.quantity < quantity:
        return jsonify({
            "message": "Insufficient asset quantity",
            "available_quantity": source_asset.quantity,
            "requested_quantity": quantity
        }), 400

    # Reduce source stock
    source_asset.quantity -= quantity

    # Find same asset type at destination
    destination_asset = Asset.query.filter_by(
        name=source_asset.name,
        asset_type=source_asset.asset_type,
        base_id=to_base_id
    ).first()

    # If destination doesn't have this asset yet, create it
    if destination_asset:
        destination_asset.quantity += quantity
    else:
        destination_asset = Asset(
            name=source_asset.name,
            asset_type=source_asset.asset_type,
            quantity=quantity,
            base_id=to_base_id
        )

        db.session.add(destination_asset)
        db.session.flush()

    # Create transfer record
    transfer = Transfer(
        asset_id=source_asset.id,
        from_base_id=from_base_id,
        to_base_id=to_base_id,
        quantity=quantity,
        created_by=user_id
    )

    db.session.add(transfer)
    db.session.flush()

    # Create audit log
    audit = AuditLog(
        user_id=user_id,
        action="CREATE",
        entity="Transfer",
        entity_id=transfer.id,
        details=(
            f"Transferred {quantity} units of "
            f"'{source_asset.name}' from "
            f"{from_base.name} to {to_base.name}"
        )
    )

    db.session.add(audit)

    db.session.commit()

    return jsonify({
        "message": "Transfer recorded successfully",
        "transfer": {
            "id": transfer.id,
            "asset_name": source_asset.name,
            "quantity_transferred": quantity,
            "from_base": from_base.name,
            "to_base": to_base.name,
            "source_remaining_quantity": source_asset.quantity,
            "destination_quantity": destination_asset.quantity
        }
    }), 201