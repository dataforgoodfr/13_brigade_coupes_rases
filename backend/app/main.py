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


def start_server(
    host: str, port: int, reload: bool, proxy_headers: bool, forwarded_allow_ips: str
):
    import uvicorn

    uvicorn.run(app, host, port, reload, proxy_headers, forwarded_allow_ips)


if __name__ == "__main__":
    start_server()
