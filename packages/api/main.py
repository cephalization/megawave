import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from megawave import library_router
from megawave.files import initialize_library

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(library_router.router)

app.on_event("startup")(initialize_library)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
