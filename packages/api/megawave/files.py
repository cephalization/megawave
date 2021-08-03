import os
from pathlib import Path
from megawave.audio import AudioFile, AudioLibrary, hasAudioFileExtension

from megawave.config import fileDirectory

# Initialize a new audio library to store tracks in
audioLibrary = AudioLibrary()


def initialize_library():
    # https://realpython.com/working-with-files-in-python/
    print(f'- - - Loading music library at "{fileDirectory}" - - - ')
    added = 0
    skipped = 0
    try:
        # Read all files from directory specified in config
        for root, _, files in os.walk(Path(fileDirectory).absolute()):
            for name in files:
                hasExt, ext = hasAudioFileExtension(name)
                if hasExt:
                    audio = AudioFile(root, name, ext)
                    # if mutagen cannot parse the audio file within the AudioFile
                    # constructor we do not add the file to the library
                    if audio.ok:
                        audioLibrary.append(audio)
                        added += 1
                    else:
                        print(f'*SKIPPED* "{name}"')
                        skipped += 1
        print("- - - Done loading music library - - - ")
        print(f"{added} songs added to library")
        print(f"{skipped} songs could not be read")
    except OSError as e:
        print(f"Unexpected os error reading audioDirectory {e}")
        pass
    except ValueError:
        print("Unexpected value error reading audioDirectory")
        pass
