from fastapi import FastAPI
from app.routes import items
from app.database import engine, Base

# Create DB tables if not using Alembic (use migrations in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Brigades Coupes Rases")

# Include routes
app.include_router(items.router)


@app.get("/")
async def home():
    return {"message": "Hello, World!"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
