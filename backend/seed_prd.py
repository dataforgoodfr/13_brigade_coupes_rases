import traceback

from app.database import SessionLocal
from app.models import Department, User
from app.services.user_auth import get_password_hash
from common_seed import seed_cities_departments

SRID = 4326


def seed_database():
    db = SessionLocal()
    try:
        seed_cities_departments(db)
        paris = db.query(Department).filter_by(code="75").first()
        admin = User(
            firstname="Crysta",
            lastname="Faerie",
            login="CrystaFaerie",
            email="admin@example.com",
            role="admin",
            password=get_password_hash("admin"),
        )

        admin.departments.append(paris)
        users = [
            admin,
        ]
        db.add_all(users)
        db.flush()

        print(f"Added {len(users)} users to the database")
        print("Database finished seeding!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        print(traceback.format_exc())
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
