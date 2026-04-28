import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import close_db, connect_db
from .routes import auth, crop, notifications, schemes, voice, weather

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="AI Smart Farming Assistant API",
    description="Backend API for the AI-powered farming assistant application",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
        "https://smart-ai-farming.vercel.app",
        "https://smart-ai-farming.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(crop.router, prefix="/api/crop", tags=["Crop Analysis"])
app.include_router(weather.router, prefix="/api/weather", tags=["Weather"])
app.include_router(schemes.router, prefix="/api/schemes", tags=["Government Schemes"])
app.include_router(voice.router, prefix="/api/voice", tags=["Voice Assistant"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}", "type": type(exc).__name__},
    )


@app.get("/", tags=["Health"])
async def root():
    return {"message": "AI Smart Farming Assistant API is running", "docs": "/docs"}


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}


# Vercel serverless handler
from fastapi import Request
from fastapi.responses import JSONResponse

# For Vercel serverless deployment
handler = app
