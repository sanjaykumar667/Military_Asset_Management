from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from extensions import db
from models import Assignment, Asset, MilitaryBase, User, AuditLog

assignment_bp = Blueprint("assignments", __name__)


# GET ALL ASSIGNMENTS
@assignment_bp.route("/api/assignments", methods=["GET"])
@jwt_required()
def get_assignments():

    claims = get_jwt()
    user_role = claims.get("role")
    user_id = int(get_jwt_identity())

    user = User.query.get(user_id)

    query = Assignment.query

    # Base Commander sees assignments from their own base
    if user_role == "Base Commander":
        query = query.filter_by(base_id=user.base_id)

    assignments = query.order_by(
        Assignment.assigned_date.desc()
    ).all()

    result = []

    for assignment in assignments:

        asset = Asset.query.get(assignment.asset_id)
        base = MilitaryBase.query.get(assignment.base_id)

        result.append({
            "id": assignment.id,
            "asset_id": assignment.asset_id,
            "asset_name": asset.name if asset else None,
            "personnel_name": assignment.personnel_name,
            "quantity": assignment.quantity,
            "base_id": assignment.base_id,
            "base_name": base.name if base else None,
            "assigned_date": assignment.assigned_date.isoformat(),
            "created_by": assignment.created_by
        })

    return jsonify({
        "count": len(result),
        "assignments": result
    }), 200


# CREATE ASSIGNMENT
@assignment_bp.route("/api/assignments", methods=["POST"])
@jwt_required()
def create_assignment():

    claims = get_jwt()
    user_role = claims.get("role")
    user_id = int(get_jwt_identity())

    # Admin and Logistics Officer can create assignments
    if user_role not in ["Admin", "Logistics Officer"]:
        return jsonify({
            "message": "Access denied",
            "required_roles": ["Admin", "Logistics Officer"],
            "your_role": user_role
        }), 403

    data = request.get_json()

    asset_id = data.get("asset_id")
    personnel_name = data.get("personnel_name")
    quantity = data.get("quantity")
    base_id = data.get("base_id")

    # Validate required fields
    if (
        not asset_id
        or not personnel_name
        or quantity is None
        or not base_id
    ):
        return jsonify({
            "message": (
                "asset_id, personnel_name, "
                "quantity and base_id are required"
            )
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

    # Check base
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

    # Check available stock
    if asset.quantity < quantity:
        return jsonify({
            "message": "Insufficient asset quantity",
            "available_quantity": asset.quantity,
            "requested_quantity": quantity
        }), 400

    # Reduce available quantity
    asset.quantity -= quantity

    # Create assignment
    assignment = Assignment(
        asset_id=asset_id,
        personnel_name=personnel_name,
        quantity=quantity,
        base_id=base_id,
        created_by=user_id
    )

    db.session.add(assignment)
    db.session.flush()

    # Create audit log
    audit = AuditLog(
        user_id=user_id,
        action="CREATE",
        entity="Assignment",
        entity_id=assignment.id,
        details=(
            f"Assigned {quantity} units of "
            f"'{asset.name}' to {personnel_name} "
            f"at {base.name}"
        )
    )

    db.session.add(audit)

    db.session.commit()

    return jsonify({
        "message": "Assignment recorded successfully",
        "assignment": {
            "id": assignment.id,
            "asset_name": asset.name,
            "personnel_name": personnel_name,
            "quantity_assigned": quantity,
            "base_name": base.name,
            "remaining_quantity": asset.quantity
        }
    }), 201