from fastapi import FastAPI
from app.routes import clearcut, slope, watercourse
from app.database import engine, Base
from app.routes import ecologicalZone

# Create DB tables if not using Alembic (use migrations in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Brigades Coupes Rases")

# Include routes
app.include_router(clearcut.router)
app.include_router(ecologicalZone.router)
app.include_router(slope.router)
app.include_router(watercourse.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
