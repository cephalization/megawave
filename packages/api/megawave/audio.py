import os
from typing import Dict, List, Tuple, Union
from mutagen import MutagenError
from mutagen.easyid3 import EasyID3
from mutagen.mp3 import MP3
from mutagen.wave import WAVE

from megawave.id import getId


VALID_AUDIO_EXTENSIONS = ["wav", "mp3"]


def hasAudioFileExtension(fileName: str) -> Union[Tuple[bool, str], bool]:
    fileExt = fileName.split(".")[-1]
    if fileExt in VALID_AUDIO_EXTENSIONS:
        return True, fileExt

    return False, None


class AudioFile:
    """
    Representation of an audio file.

    Contains information about a discovered audio file.
    """

    def __init__(self, rootDir: str, fileName: str, fileType: str):
        self.ok = True
        self.rootDir: str = rootDir
        self.fileName: str = fileName
        self.filePath: str = os.path.join(rootDir, fileName)
        self.fileDir: str = os.path.abspath(rootDir)
        self.fileType: str = fileType
        self.id: str = getId()
        self.meta = None
        self.info = None

        try:
            if self.fileType == "mp3":
                self.info = MP3(self.filePath).info
            elif self.fileType == "wav":
                self.info = WAVE(self.filePath).info

            self.meta = EasyID3(self.filePath)

            if self.meta is None:
                raise ValueError
        except MutagenError:
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
            "length": self.info.length,
            "id": self.id,
            "link": f"/api/songs/{self.id}",
            "meta": self.meta.pprint(),
            "fileType": self.fileType,
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
