import asyncio
import os
from typing import Dict, List, Literal, Tuple, Union

import mutagen
from mutagen import MutagenError
from mutagen.easyid3 import EasyID3
from mutagen.id3 import ID3
from mutagen.mp3 import MP3
from mutagen.wave import WAVE
from typing_extensions import TypedDict

from megawave.art_cache import ALBUM_ART_CACHE, add_frame_to_cache
from megawave.util import getId

VALID_AUDIO_EXTENSIONS = ["wav", "mp3"]

AudioFile_Serialized = TypedDict(
    "AudioFile_Serialized",
    {
        "name": str,
        "album": Union[List[str], None],
        "artist": Union[List[str], None],
        "art": Union[List[str], None],
        "length": Union[int, None],
        "id": str,
        "link": str,
        "meta": str,
        "fileType": str,
    },
)


def get_audio_file_sort_value(
    audio: AudioFile_Serialized, sort: str
) -> Union[str, int]:
    if sort == "artist":
        return AudioFile.getSafeArtist(audio).lower()

    return ""


def get_media_type(ext: str) -> str:
    if ext == "mp3":
        print("audio/mpeg")
        return "audio/mpeg"
    elif ext == "wav":
        print("audio/wav")
        return "audio/wav"

    return ""


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
        self.art: Union[List[str], None] = None
        self.raw = None
        self.tags = None

        try:
            # load file info
            self.initialize_info()
            # load file meta
            self.initialize_meta()

        except Exception:
            self.ok = False

    def initialize_info(self):
        self.ok = False

        def load():
            if self.fileType == "mp3":
                self.raw = MP3(self.filePath)
            elif self.fileType == "wav":
                self.raw = WAVE(self.filePath)
            self.info = self.raw.info
            self.ok = True
            # we've got all required info, lets try to grab some more complex data
            try:
                self.tags = ID3(self.filePath)
                art_frames = self.tags.getall("APIC")
                art = [add_frame_to_cache(frame) for frame in art_frames]

                if len(art):
                    self.art = art
            except Exception:
                pass

        try:
            load()

        except MutagenError:
            song = mutagen.File(self.filePath, easy=True)
            song.add_tags()
            song.save(self.filePath, v1=2)

            load()
        except ValueError:
            pass

    def initialize_meta(self):
        try:
            self.meta = EasyID3(self.filePath)
        except MutagenError:

            class meta:
                def __init__(self):
                    pass

                def get(self, prop, default):
                    return default

                def pprint(self):
                    return {}

            self.meta = meta()
            pass

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
            "link": f"/api/library/songs/{self.id}",
            "meta": self.meta.pprint(),
            "fileType": self.fileType,
            "art": [ALBUM_ART_CACHE[a]["link"] for a in self.art] if self.art else None,
        }

    @staticmethod
    def matches_filter(
        audio: AudioFile_Serialized, filter_term: str
    ) -> Tuple[bool, Union[str, None]]:
        """
        Returns a union that describes if this song would match filter_term and at what key would it match
        """
        sanitized_filter_term = filter_term.lower()

        if audio is None:
            return False, None

        if sanitized_filter_term in audio["name"].lower():
            return True, "name"

        if audio["artist"] is not None:
            for artist in audio["artist"]:
                if sanitized_filter_term in artist.lower():
                    return True, "artist"

        if audio["album"] is not None:
            for album in audio["album"]:
                if sanitized_filter_term in album.lower():
                    return True, "album"

        return False, None

    @staticmethod
    def getSafeArtist(audio: AudioFile_Serialized) -> str:
        artist_value = audio.get("artist")

        if artist_value is not None:
            return ", ".join(artist_value) or ""

        return ""


AudioLibraryStatus = Literal["loading", "idle", "error"]


class AudioLibrary:
    """
    Collection of AudioFile instances.

    Access them via ID, or as a List of AudioFile instances.
    """

    # loading, idle, error enum
    status: AudioLibraryStatus
    library: List[str]
    libraryDict: Dict[str, AudioFile]

    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        self.library = []
        self.libraryDict = {}
        self.status = "idle"

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

    async def load(self, paths: List[str]) -> None:
        """
        Asynchronously load audio files from a list of paths into this library
        """
        self.reset()
        self.status = "loading"
        for path in paths:
            added = 0
            skipped = 0
            print(f'- - - Loading music library at "{path}" - - - ')
            for root, _, files in os.walk(path):
                for name in files:
                    hasExt, ext = hasAudioFileExtension(name)
                    if hasExt:
                        audio = AudioFile(root, name, ext)
                        # if mutagen cannot parse the audio file within the AudioFile
                        # constructor we do not add the file to the library
                        if audio.ok:
                            self.append(audio)
                            added += 1
                        else:
                            skipped += 1
                # this just yields control back to the event loop so that this function doesn't block
                await asyncio.sleep(0)
            print(f"- - - - Loaded {added} songs from {path} - - - - ")
            print(f"- - - - Skipped {skipped} songs from {path} - - - - ")
        print(f"- - - Loaded {len(self.library)} songs total - - - ")
        print("- - - Done loading music library - - - ")
        self.status = "idle"
