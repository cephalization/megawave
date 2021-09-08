import os

# Parse env
fileDirectory = os.getenv("MUSIC_LIBRARY_PATH")

if fileDirectory is None:
    raise TypeError("Environment variable: MUSIC_LIBRARY_PATH missing from .env")
