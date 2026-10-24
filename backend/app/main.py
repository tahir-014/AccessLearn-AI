import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import db
from app.routes import lessons, tutor, quizzes

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("accesslearn")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes SQLite database and tables on startup."""
    logger.info("Initializing AccessLearn AI database...")
    db.init_db()
    logger.info(f"Database initialized at: {settings.DATABASE_PATH}")
    logger.info(f"AI Service running in: {'DEMO / MOCK MODE' if settings.is_demo_mode else 'LIVE GEMINI API MODE'}")
    yield
    logger.info("AccessLearn AI API shutdown complete.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Accessible AI-powered learning platform backend",
    lifespan=lifespan
)

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Facilitates seamless local frontend-backend development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again."}
    )

# Include Routers
app.include_router(lessons.router)
app.include_router(tutor.router)
app.include_router(quizzes.router)

@app.get("/api/health")
def health_check():
    """System health check and diagnostic information."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "is_demo_mode": settings.is_demo_mode,
        "model": settings.GEMINI_MODEL,
        "languages_supported": ["en", "te"],
        "upload_limit_mb": settings.MAX_UPLOAD_SIZE_MB
    }
