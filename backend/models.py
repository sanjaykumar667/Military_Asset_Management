from extensions import db
from datetime import datetime


# ==========================================
# ROLE TABLE
# ==========================================

class Role(db.Model):
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )


# ==========================================
# BASE TABLE
# ==========================================

class MilitaryBase(db.Model):
    __tablename__ = "bases"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(100),
        nullable=False
    )

    location = db.Column(
        db.String(150),
        nullable=False
    )


# ==========================================
# USER TABLE
# ==========================================

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(100),
        nullable=False
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False
    )

    password = db.Column(
        db.String(255),
        nullable=False
    )

    role_id = db.Column(
        db.Integer,
        db.ForeignKey("roles.id"),
        nullable=False
    )

    base_id = db.Column(
        db.Integer,
        db.ForeignKey("bases.id"),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


# ==========================================
# ASSET TABLE
# ==========================================

class Asset(db.Model):
    __tablename__ = "assets"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(100),
        nullable=False
    )

    asset_type = db.Column(
        db.String(50),
        nullable=False
    )

    quantity = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    base_id = db.Column(
        db.Integer,
        db.ForeignKey("bases.id"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


# ==========================================
# PURCHASE TABLE
# ==========================================

class Purchase(db.Model):
    __tablename__ = "purchases"

    id = db.Column(db.Integer, primary_key=True)

    asset_id = db.Column(
        db.Integer,
        db.ForeignKey("assets.id"),
        nullable=False
    )

    base_id = db.Column(
        db.Integer,
        db.ForeignKey("bases.id"),
        nullable=False
    )

    quantity = db.Column(
        db.Integer,
        nullable=False
    )

    purchase_date = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    created_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )


# ==========================================
# TRANSFER TABLE
# ==========================================

class Transfer(db.Model):
    __tablename__ = "transfers"

    id = db.Column(db.Integer, primary_key=True)

    asset_id = db.Column(
        db.Integer,
        db.ForeignKey("assets.id"),
        nullable=False
    )

    from_base_id = db.Column(
        db.Integer,
        db.ForeignKey("bases.id"),
        nullable=False
    )

    to_base_id = db.Column(
        db.Integer,
        db.ForeignKey("bases.id"),
        nullable=False
    )

    quantity = db.Column(
        db.Integer,
        nullable=False
    )

    transfer_date = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    created_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )


# ==========================================
# ASSIGNMENT TABLE
# ==========================================

class Assignment(db.Model):
    __tablename__ = "assignments"

    id = db.Column(db.Integer, primary_key=True)

    asset_id = db.Column(
        db.Integer,
        db.ForeignKey("assets.id"),
        nullable=False
    )

    personnel_name = db.Column(
        db.String(100),
        nullable=False
    )

    quantity = db.Column(
        db.Integer,
        nullable=False
    )

    base_id = db.Column(
        db.Integer,
        db.ForeignKey("bases.id"),
        nullable=False
    )

    assigned_date = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    created_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )


# ==========================================
# EXPENDITURE TABLE
# ==========================================

class Expenditure(db.Model):
    __tablename__ = "expenditures"

    id = db.Column(db.Integer, primary_key=True)

    asset_id = db.Column(
        db.Integer,
        db.ForeignKey("assets.id"),
        nullable=False
    )

    quantity = db.Column(
        db.Integer,
        nullable=False
    )

    base_id = db.Column(
        db.Integer,
        db.ForeignKey("bases.id"),
        nullable=False
    )

    expenditure_date = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    created_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )


# ==========================================
# AUDIT LOG TABLE
# ==========================================

class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True
    )

    action = db.Column(
        db.String(100),
        nullable=False
    )

    entity = db.Column(
        db.String(100),
        nullable=False
    )

    entity_id = db.Column(
        db.Integer,
        nullable=True
    )

    details = db.Column(
        db.Text,
        nullable=True
    )

    timestamp = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )