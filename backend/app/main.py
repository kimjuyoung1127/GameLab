"""FastAPI 앱 초기화, CORS 설정, 라우터 등록, 정적 파일 마운트."""
import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

from app.core.config import settings
from app.api.upload.router import router as upload_router
from app.api.jobs.router import router as jobs_router
from app.api.overview.router import router as overview_router
from app.api.sessions.router import router as sessions_router
from app.api.labeling.router import router as labeling_router
from app.api.leaderboard.router import router as leaderboard_router
from app.api.achievements.router import router as achievements_router

app = FastAPI(
    title="Smart Spectro-Tagging API",
    version="0.1.0",
    description="Backend API for Smart Spectro-Tagging & Anomaly Detection",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(upload_router)
app.include_router(jobs_router)
app.include_router(overview_router)
app.include_router(sessions_router)
app.include_router(labeling_router)
app.include_router(leaderboard_router)
app.include_router(achievements_router)

os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/health")
async def health():
    return {"status": "ok"}
