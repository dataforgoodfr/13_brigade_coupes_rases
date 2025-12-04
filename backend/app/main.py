from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import (
    clear_cuts,
    clear_cuts_map,
    clear_cuts_reports,
    departments,
    ecological_zonings,
    filters,
    images,
    me,
    referential,
    rules,
    token,
    users,
)

app = FastAPI(
    title="Brigades Coupes Rases", swagger_ui_parameters={"operationsSorter": "method"}
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["ETag", "Location"],
)

# Include routes
app.include_router(clear_cuts_reports.router)
app.include_router(departments.router)
app.include_router(token.router)
app.include_router(clear_cuts_map.router)
app.include_router(users.router)
app.include_router(filters.router)
app.include_router(images.router)
app.include_router(me.router)
app.include_router(clear_cuts.router)
app.include_router(ecological_zonings.router)
app.include_router(referential.router)
app.include_router(rules.router)


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
        port=args.port if args.port else int(settings.PORT),
        reload=args.reload,
        proxy_headers=args.proxy_headers,
        forwarded_allow_ips=args.forwarded_allow_ips,
    )
