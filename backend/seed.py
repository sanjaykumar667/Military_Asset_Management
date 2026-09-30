import bcrypt

from app import app
from extensions import db

from models import Role, MilitaryBase, User


with app.app_context():

    # --------------------------------
    # Create Roles
    # --------------------------------

    admin_role = Role.query.filter_by(
        name="Admin"
    ).first()

    if not admin_role:
        admin_role = Role(name="Admin")
        db.session.add(admin_role)

    commander_role = Role.query.filter_by(
        name="Base Commander"
    ).first()

    if not commander_role:
        commander_role = Role(name="Base Commander")
        db.session.add(commander_role)

    logistics_role = Role.query.filter_by(
        name="Logistics Officer"
    ).first()

    if not logistics_role:
        logistics_role = Role(name="Logistics Officer")
        db.session.add(logistics_role)

    db.session.commit()


    # --------------------------------
    # Create Bases
    # --------------------------------

    bangalore = MilitaryBase.query.filter_by(
        name="Bangalore Base"
    ).first()

    if not bangalore:
        bangalore = MilitaryBase(
            name="Bangalore Base",
            location="Bangalore"
        )
        db.session.add(bangalore)

    mumbai = MilitaryBase.query.filter_by(
        name="Mumbai Base"
    ).first()

    if not mumbai:
        mumbai = MilitaryBase(
            name="Mumbai Base",
            location="Mumbai"
        )
        db.session.add(mumbai)

    delhi = MilitaryBase.query.filter_by(
        name="Delhi Base"
    ).first()

    if not delhi:
        delhi = MilitaryBase(
            name="Delhi Base",
            location="Delhi"
        )
        db.session.add(delhi)

    db.session.commit()


    # --------------------------------
    # Create Users
    # --------------------------------

    password = "Admin@123"

    hashed_password = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


    admin = User.query.filter_by(
        email="admin@military.com"
    ).first()

    if not admin:
        admin = User(
            name="System Admin",
            email="admin@military.com",
            password=hashed_password,
            role_id=admin_role.id
        )

        db.session.add(admin)


    commander = User.query.filter_by(
        email="commander@military.com"
    ).first()

    if not commander:
        commander = User(
            name="Bangalore Commander",
            email="commander@military.com",
            password=hashed_password,
            role_id=commander_role.id,
            base_id=bangalore.id
        )

        db.session.add(commander)


    logistics = User.query.filter_by(
        email="logistics@military.com"
    ).first()

    if not logistics:
        logistics = User(
            name="Logistics Officer",
            email="logistics@military.com",
            password=hashed_password,
            role_id=logistics_role.id,
            base_id=bangalore.id
        )

        db.session.add(logistics)


    db.session.commit()

    print("Seed data created successfully.")