import os
from pathlib import Path
from typing import List, Dict, Union
from megawave.id import getId
import mutagen
from mutagen.easyid3 import EasyID3

from megawave.config import fileDirectory

VALID_AUDIO_EXTENSIONS = ["wav", "mp3"]


def hasAudioFileExtension(fileName: str) -> bool:
    for ext in VALID_AUDIO_EXTENSIONS:
        if fileName.endswith(ext):
            return True

    return False


class AudioFile:
    """
    Representation of an audio file.

    Contains information about a discovered audio file.
    """

    def __init__(self, rootDir: str, fileName: str):
        self.ok = True
        self.rootDir: str = rootDir
        self.fileName: str = fileName
        self.filePath: str = os.path.join(rootDir, fileName)
        self.fileDir: str = os.path.abspath(rootDir)
        self.id: str = getId()
        self.meta = None

        try:
            self.meta = EasyID3(self.filePath)
            if self.meta is None:
                raise ValueError
        except mutagen.MutagenError:
            self.ok = False
        except ValueError:
            self.ok = False

    def serialize(self):
        """Convert AudioFile into a representation that can be sent over the
        wire as JSON
        """
        if not self.ok or self.meta is None:
            return None

        return {
            "name": self.meta.get("title", [self.fileName])[0],
            "album": self.meta.get("album", None),
            "artist": self.meta.get("artist", None),
            "id": self.id,
            "link": f"/api/songs/{self.id}",
            "meta": self.meta.pprint(),
        }


class AudioLibrary:
    """
    Collection of AudioFile instances.

    Access them via ID, or as a List of AudioFile instances.
    """

    def __init__(self):
        self.library: List[str] = []
        self.libraryDict: Dict[str, AudioFile] = {}

    def getById(self, id: str) -> Union[AudioFile, None]:
        entry = self.libraryDict.get(id, None)

        if entry is None or entry.ok:
            return entry

        return None

    def append(self, audioFile: AudioFile) -> None:
        self.library.append(audioFile.id)
        self.libraryDict[audioFile.id] = audioFile

    def entries(self) -> List[AudioFile]:
        output: List[AudioFile] = []
        for entryId in self.library:
            entry = self.getById(entryId)
            if entry is not None and entry.ok:
                output.append(entry)

        return output

    def serialize(self) -> List[Dict[str, str]]:
        """Convert AudioLibrary into a representation that can be sent over
        the wire as JSON
        """
        output: List[Dict[str, str]] = []
        for entry in self.entries():
            if entry is not None:
                output.append(entry.serialize())

        return output


# Read all files from directory specified in config
audioLibrary = AudioLibrary()

# https://realpython.com/working-with-files-in-python/
print(f'- - - Loading music library at "{fileDirectory}" - - - ')
added = 0
skipped = 0
try:
    for root, _, files in os.walk(Path(fileDirectory).absolute()):
        for name in files:
            if hasAudioFileExtension(name):
                audio = AudioFile(root, name)
                # if mutagen cannot parse the audio file within the AudioFile
                # constructor we do not add the file to the library
                if audio.ok:
                    audioLibrary.append(audio)
                    # print(f'* "{name}"')
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
