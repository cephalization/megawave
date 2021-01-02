import os
from uuid import uuid4
from typing import List, Dict, Union

from megawave.config import fileDirectory

VALID_AUDIO_EXTENSIONS = ["wav", "mp3"]


def hasAudioFileExtension(fileName: str) -> bool:
    for ext in VALID_AUDIO_EXTENSIONS:
        if fileName.endswith(ext):
            return True

    return False


class AudioFile:
    def __init__(self, rootDir: str, fileName: str):
        self.rootDir: str = rootDir
        self.fileName: str = fileName
        self.filePath: str = os.path.join(rootDir, fileName)
        self.fileDir: str = os.path.abspath(rootDir)
        self.id: str = str(uuid4())

    def serialize(self):
        return {
            "name": self.fileName,
            "id": self.id,
            "link": f"/songs/{self.id}",
        }


class AudioLibrary:
    def __init__(self):
        self.library: List[str] = []
        self.libraryDict: Dict[str, AudioFile] = {}

    def getById(self, id: str) -> Union[AudioFile, None]:
        return self.libraryDict.get(id, None)

    def append(self, audioFile: AudioFile) -> None:
        self.library.append(audioFile.id)
        self.libraryDict[audioFile.id] = audioFile

    def entries(self) -> List[AudioFile]:
        output: List[AudioFile] = []
        for entryId in self.library:
            entry = self.getById(entryId)
            if entry is not None:
                output.append(entry)

        return output

    def serialize(self) -> List[Dict[str, str]]:
        output: List[Dict[str, str]] = []
        for entry in self.entries():
            output.append(entry.serialize())

        return output


# Read all files from directory specified in config
audioLibrary = AudioLibrary()
# https://realpython.com/working-with-files-in-python/
try:
    for root, _, files in os.walk(os.path.expanduser(fileDirectory)):
        for name in files:
            if hasAudioFileExtension(name):
                audio = AudioFile(root, name)
                audioLibrary.append(audio)
except OSError as e:
    print(f"Unexpected os error reading audioDirectory {e}")
    pass
except ValueError:
    print("Unexpected value error reading audioDirectory")
    pass
