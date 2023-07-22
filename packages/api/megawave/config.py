import os

# Parse env
fileDirectory = (os.getenv("MUSIC_LIBRARY_PATH") or "").split(",")

if fileDirectory is None or len(fileDirectory) == 0:
    raise TypeError("Environment variable: MUSIC_LIBRARY_PATH missing from .env")
