import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRouter

from megawave import health_router, library_router
from megawave.config import fileDirectory
from megawave.library import audioLibrary


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(audioLibrary.load(fileDirectory))
    yield


app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://web",
    "http://0.0.0.0",
    "https://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter(prefix="/api")
router.include_router(health_router.router)
router.include_router(library_router.router)
app.include_router(router)
