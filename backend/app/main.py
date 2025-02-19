from fastapi import FastAPI
from app.routes import clearcut, ecologicalZone, slope, watercourse
from app.database import engine, Base

# Create DB tables if not using Alembic (use migrations in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Brigades Coupes Rases")

# Include routes
app.include_router(clearcut.router)
app.include_router(ecologicalZone.router)
app.include_router(slope.router)
app.include_router(watercourse.router)


def start_server():
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    start_server()
