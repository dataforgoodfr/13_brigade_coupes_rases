from fastapi import FastAPI
from app.config import settings
from app.routes import clearcuts, departments, users, referential, clearcuts_map
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Brigades Coupes Rases", swagger_ui_parameters={"operationsSorter": "method"}
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(clearcuts.router)
app.include_router(departments.router)
app.include_router(clearcuts_map.router)
app.include_router(users.router)
app.include_router(referential.router)


def start_server(
    host: str, port: int, reload: bool, proxy_headers: bool, forwarded_allow_ips: str
):
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload,
        proxy_headers=proxy_headers,
        forwarded_allow_ips=forwarded_allow_ips,
    )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--host", type=str)
    parser.add_argument("--port", type=int)
    parser.add_argument("--reload", action="store_true")
    parser.add_argument("--proxy-headers", action="store_true")
    parser.add_argument("--forwarded-allow-ips", type=str)
    args = parser.parse_args()

    start_server(
        host=args.host,
        port=args.port,
        reload=args.reload,
        proxy_headers=args.proxy_headers,
        forwarded_allow_ips=args.forwarded_allow_ips,
    )
