import os
import traceback

from app.database import SessionLocal
from app.models import Department, User
from app.services.get_password_hash import get_password_hash
from common_seed import seed_cities_departments

SRID = 4326
MIN_PASSWORD_LENGTH = 12


def seed_database() -> None:
    db = SessionLocal()
    try:
        seed_cities_departments(db)

        # The first admin comes from the environment: a password written here
        # would be public. Without it, only the reference data is seeded.
        email = os.environ.get("SEED_ADMIN_EMAIL", "")
        password = os.environ.get("SEED_ADMIN_PASSWORD", "")
        if email and len(password) >= MIN_PASSWORD_LENGTH:
            paris = db.query(Department).filter_by(code="75").first()
            admin = User(
                first_name=os.environ.get("SEED_ADMIN_FIRST_NAME", "Admin"),
                last_name=os.environ.get("SEED_ADMIN_LAST_NAME", ""),
                login=os.environ.get("SEED_ADMIN_LOGIN", email.split("@")[0]),
                email=email,
                role="admin",
                password=get_password_hash(password),
            )
            admin.departments.append(paris)
            db.add(admin)
            print(f"Added admin {email}")
        else:
            print(
                "No admin created: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD "
                f"(at least {MIN_PASSWORD_LENGTH} characters)"
            )

        db.commit()
        print("Database finished seeding!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        print(traceback.format_exc())
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
