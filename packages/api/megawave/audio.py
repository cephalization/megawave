import os
from typing import Dict, List, Tuple, Union
from typing_extensions import TypedDict
from mutagen import MutagenError
from mutagen.easyid3 import EasyID3
from mutagen.mp3 import MP3
from mutagen.wave import WAVE

from megawave.id import getId


VALID_AUDIO_EXTENSIONS = ["wav", "mp3"]

AudioFile_Serialized = TypedDict(
    "AudioFile_Serialized",
    {
        "name": str,
        "album": Union[List[str], None],
        "artist": Union[List[str], None],
        "length": Union[int, None],
        "id": str,
        "link": str,
        "meta": str,
        "fileType": str,
    },
)


def hasAudioFileExtension(fileName: str) -> Tuple[bool, Union[str, None]]:
    fileExt = fileName.split(".")[-1]
    if fileExt in VALID_AUDIO_EXTENSIONS:
        return True, fileExt

    return False, None


class AudioFile:
    """
    Representation of an audio file.

    Contains information about a discovered audio file.
    """

    def __init__(self, rootDir: str, fileName: str, fileType: Union[str, None]):
        self.ok = True
        self.rootDir: str = rootDir
        self.fileName: str = fileName
        self.filePath: str = os.path.join(rootDir, fileName)
        self.fileDir: str = os.path.abspath(rootDir)
        self.fileType: str = fileType or ""
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

    def serialize(self) -> Union[AudioFile_Serialized, None]:
        """Convert AudioFile into a representation that can be sent over the
        wire as JSON
        """
        if not self.ok or self.meta is None:
            return None

        return {
            "name": self.meta.get("title", [self.fileName])[0],
            "album": self.meta.get("album", None),
            "artist": self.meta.get("artist", None),
            "length": self.info.length if self.info is not None else None,
            "id": self.id,
            "link": f"/api/songs/{self.id}",
            "meta": self.meta.pprint(),
            "fileType": self.fileType,
        }

    @staticmethod
    def getSafeArtist(audio: AudioFile_Serialized) -> str:
        artist_value = audio.get("artist")

        if artist_value is not None:
            return ", ".join(artist_value) or ""

        return ""


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

    def serialize(self) -> List[AudioFile_Serialized]:
        """Convert AudioLibrary into a representation that can be sent over
        the wire as JSON
        """
        output: List[AudioFile_Serialized] = []
        for entry in self.entries():
            if entry is not None:
                serialized = entry.serialize()
                if serialized is not None:
                    output.append(serialized)

        return output
