from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from models import AuditLog

audit_bp = Blueprint("audit", __name__)


@audit_bp.route("/api/audit-logs", methods=["GET"])
@jwt_required()
def get_audit_logs():

    claims = get_jwt()
    user_role = claims.get("role")

    # Only Admin can view all audit logs
    if user_role != "Admin":
        return jsonify({
            "message": "Access denied. Only Admin can view audit logs."
        }), 403

    logs = AuditLog.query.order_by(
        AuditLog.timestamp.desc()
    ).all()

    result = []

    for log in logs:
        result.append({
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "entity": log.entity,
            "entity_id": log.entity_id,
            "details": log.details,
            "timestamp": log.timestamp.isoformat()
        })

    return jsonify({
        "count": len(result),
        "audit_logs": result
    }), 200