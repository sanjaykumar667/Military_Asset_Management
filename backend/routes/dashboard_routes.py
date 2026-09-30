from datetime import datetime, time

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from sqlalchemy import func, or_

from extensions import db
from models import (
    Asset,
    Purchase,
    Transfer,
    Assignment,
    Expenditure,
    User
)

dashboard_bp = Blueprint("dashboard", __name__)


def parse_date(value, field_name):
    """Convert YYYY-MM-DD text into a datetime."""
    if not value:
        return None

    try:
        return datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        raise ValueError(
            f"{field_name} must be in YYYY-MM-DD format"
        )


@dashboard_bp.route("/api/dashboard", methods=["GET"])
@jwt_required()
def dashboard():

    claims = get_jwt()
    user_role = claims.get("role")
    user_id = int(get_jwt_identity())

    user = User.query.get(user_id)

    # --------------------------------
    # READ FILTERS
    # --------------------------------

    base_id = request.args.get("base_id", type=int)
    asset_type = request.args.get("asset_type")

    start_date_text = request.args.get("start_date")
    end_date_text = request.args.get("end_date")

    try:
        start_date = parse_date(start_date_text, "start_date")
        end_date = parse_date(end_date_text, "end_date")
    except ValueError as error:
        return jsonify({
            "message": str(error)
        }), 400

    # End date should include the entire day
    end_datetime = None

    if end_date:
        end_datetime = datetime.combine(
            end_date.date(),
            time.max
        )

    # --------------------------------
    # ROLE RESTRICTION
    # --------------------------------

    # Base Commander can only see
    # their own base.
    if user_role == "Base Commander":
        base_id = user.base_id

    # --------------------------------
    # BUILD ASSET FILTER
    # --------------------------------

    asset_query = Asset.query

    if base_id:
        asset_query = asset_query.filter(
            Asset.base_id == base_id
        )

    if asset_type:
        asset_query = asset_query.filter(
            Asset.asset_type == asset_type
        )

    assets = asset_query.all()

    # --------------------------------
    # CURRENT CLOSING BALANCE
    # --------------------------------

    closing_balance = sum(
        int(asset.quantity)
        for asset in assets
    )

    # --------------------------------
    # PURCHASES
    # --------------------------------

    purchase_query = db.session.query(
        func.coalesce(
            func.sum(Purchase.quantity),
            0
        )
    ).join(
        Asset,
        Purchase.asset_id == Asset.id
    )

    if base_id:
        purchase_query = purchase_query.filter(
            Purchase.base_id == base_id
        )

    if asset_type:
        purchase_query = purchase_query.filter(
            Asset.asset_type == asset_type
        )

    if start_date:
        purchase_query = purchase_query.filter(
            Purchase.purchase_date >= start_date
        )

    if end_datetime:
        purchase_query = purchase_query.filter(
            Purchase.purchase_date <= end_datetime
        )

    total_purchases = int(
        purchase_query.scalar() or 0
    )

    # --------------------------------
    # TRANSFERS IN
    # --------------------------------

    transfer_in_query = db.session.query(
        func.coalesce(
            func.sum(Transfer.quantity),
            0
        )
    ).join(
        Asset,
        Transfer.asset_id == Asset.id
    )

    if base_id:
        transfer_in_query = transfer_in_query.filter(
            Transfer.to_base_id == base_id
        )

    if asset_type:
        transfer_in_query = transfer_in_query.filter(
            Asset.asset_type == asset_type
        )

    if start_date:
        transfer_in_query = transfer_in_query.filter(
            Transfer.transfer_date >= start_date
        )

    if end_datetime:
        transfer_in_query = transfer_in_query.filter(
            Transfer.transfer_date <= end_datetime
        )

    transfers_in = int(
        transfer_in_query.scalar() or 0
    )

    # --------------------------------
    # TRANSFERS OUT
    # --------------------------------

    transfer_out_query = db.session.query(
        func.coalesce(
            func.sum(Transfer.quantity),
            0
        )
    ).join(
        Asset,
        Transfer.asset_id == Asset.id
    )

    if base_id:
        transfer_out_query = transfer_out_query.filter(
            Transfer.from_base_id == base_id
        )

    if asset_type:
        transfer_out_query = transfer_out_query.filter(
            Asset.asset_type == asset_type
        )

    if start_date:
        transfer_out_query = transfer_out_query.filter(
            Transfer.transfer_date >= start_date
        )

    if end_datetime:
        transfer_out_query = transfer_out_query.filter(
            Transfer.transfer_date <= end_datetime
        )

    transfers_out = int(
        transfer_out_query.scalar() or 0
    )

    # --------------------------------
    # ASSIGNMENTS
    # --------------------------------

    assignment_query = db.session.query(
        func.coalesce(
            func.sum(Assignment.quantity),
            0
        )
    ).join(
        Asset,
        Assignment.asset_id == Asset.id
    )

    if base_id:
        assignment_query = assignment_query.filter(
            Assignment.base_id == base_id
        )

    if asset_type:
        assignment_query = assignment_query.filter(
            Asset.asset_type == asset_type
        )

    if start_date:
        assignment_query = assignment_query.filter(
            Assignment.assigned_date >= start_date
        )

    if end_datetime:
        assignment_query = assignment_query.filter(
            Assignment.assigned_date <= end_datetime
        )

    total_assigned = int(
        assignment_query.scalar() or 0
    )

    # --------------------------------
    # EXPENDITURES
    # --------------------------------

    expenditure_query = db.session.query(
        func.coalesce(
            func.sum(Expenditure.quantity),
            0
        )
    ).join(
        Asset,
        Expenditure.asset_id == Asset.id
    )

    if base_id:
        expenditure_query = expenditure_query.filter(
            Expenditure.base_id == base_id
        )

    if asset_type:
        expenditure_query = expenditure_query.filter(
            Asset.asset_type == asset_type
        )

    if start_date:
        expenditure_query = expenditure_query.filter(
            Expenditure.expenditure_date >= start_date
        )

    if end_datetime:
        expenditure_query = expenditure_query.filter(
            Expenditure.expenditure_date <= end_datetime
        )

    total_expended = int(
        expenditure_query.scalar() or 0
    )

    # --------------------------------
    # NET MOVEMENT
    # --------------------------------

    net_movement = (
        total_purchases
        + transfers_in
        - transfers_out
        - total_assigned
        - total_expended
    )

    # --------------------------------
    # OPENING BALANCE
    # --------------------------------

    opening_balance = (
        int(closing_balance)
        - int(net_movement)
    )

    # --------------------------------
    # RESPONSE
    # --------------------------------

    return jsonify({
        "filters": {
            "base_id": base_id,
            "asset_type": asset_type,
            "start_date": start_date_text,
            "end_date": end_date_text
        },
        "opening_balance": int(opening_balance),
        "closing_balance": int(closing_balance),
        "net_movement": int(net_movement),
        "assigned_assets": int(total_assigned),
        "expended_assets": int(total_expended),

        "movement_details": {
            "purchases": int(total_purchases),
            "transfers_in": int(transfers_in),
            "transfers_out": int(transfers_out),
            "assignments": int(total_assigned),
            "expenditures": int(total_expended)
        }
    }), 200