import asyncio
import os
from typing import Dict, List, Literal, Optional, Tuple, Union

import mutagen
from mutagen._file import StreamInfo
from mutagen._util import MutagenError
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
        "track": Union[Dict[str, int], None],
    },
)


def get_audio_file_sort_value(
    audio: AudioFile_Serialized, sort: str
) -> Union[str, int]:
    if sort == "artist":
        artist = audio.get("artist")
        return AudioFile.getSafeArtist(audio).lower() if artist else "zzzzz"
    elif sort == "album":
        album = audio.get("album")
        return album[0].lower() if album else "zzzzz"
    elif sort == "name":
        name = audio.get("name")
        return name.lower() if name else "zzzzz"

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
        self.info: Optional[StreamInfo] = None
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
                self.info = self.raw.info
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

        # Get track number from metadata
        track_raw = self.meta.get("tracknumber", [None])[0]
        track_info = None
        if track_raw:
            try:
                # Handle both "X" and "X/Y" formats
                track_str = track_raw.split("/")[0].strip()
                if track_str.isdigit():
                    track_info = {"no": int(track_str)}
            except (ValueError, IndexError, AttributeError):
                print(f"Failed to parse track number: {track_raw}")
                pass

        # Get album info, ensuring we don't return empty lists
        album = self.meta.get("album", None)
        if album is not None and not album:  # Convert empty list to None
            album = None

        return {
            "name": self.meta.get("title", [self.fileName])[0],
            "album": album,
            "artist": self.meta.get("artist", None),
            "length": self.info.length if self.info is not None else None,
            "id": self.id,
            "link": f"/api/library/songs/{self.id}",
            "meta": self.meta.pprint(),
            "fileType": self.fileType,
            "art": [ALBUM_ART_CACHE[a]["link"] for a in self.art] if self.art else None,
            "track": track_info,
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
    _current_load_task: Optional[asyncio.Task]
    _cancel_requested: bool

    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        self.library = []
        self.libraryDict = {}
        self.status = "idle"
        self._current_load_task = None
        self._cancel_requested = False

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

    def cancel_load(self) -> None:
        """Cancel the current load operation if one is in progress"""
        if self._current_load_task and not self._current_load_task.done():
            self._cancel_requested = True

    async def _process_file_batch(
        self, files_to_process: List[Tuple[str, str, str]]
    ) -> Tuple[int, int]:
        """Process a batch of files and return (added, skipped) counts"""
        added = 0
        skipped = 0

        for root, name, ext in files_to_process:
            if self._cancel_requested:
                return added, skipped

            audio = AudioFile(root, name, ext)
            if audio.ok:
                self.append(audio)
                added += 1
            else:
                skipped += 1

        return added, skipped

    async def load(self, paths: List[str]) -> None:
        """
        Asynchronously load audio files from a list of paths into this library.
        Can be cancelled by calling cancel_load().
        """
        # Cancel any existing load operation
        self.cancel_load()

        # Reset state for new load
        self.reset()
        self._cancel_requested = False
        self.status = "loading"

        total_added = 0
        total_skipped = 0
        BATCH_SIZE = 50  # Process files in batches of 50

        async def load_operation():
            nonlocal total_added, total_skipped

            try:
                for path in paths:
                    if self._cancel_requested:
                        break

                    print(f'- - - Loading music library at "{path}" - - - ')
                    current_batch: List[Tuple[str, str, str]] = []

                    for root, _, files in os.walk(path):
                        for name in files:
                            if self._cancel_requested:
                                break

                            hasExt, ext = hasAudioFileExtension(name)
                            if hasExt:
                                current_batch.append((root, name, ext))

                                if len(current_batch) >= BATCH_SIZE:
                                    added, skipped = await self._process_file_batch(
                                        current_batch
                                    )
                                    total_added += added
                                    total_skipped += skipped
                                    current_batch = []
                                    await asyncio.sleep(
                                        0
                                    )  # Yield to event loop after each batch

                    # Process remaining files in the last batch
                    if current_batch and not self._cancel_requested:
                        added, skipped = await self._process_file_batch(current_batch)
                        total_added += added
                        total_skipped += skipped

                    print(f"- - - - Loaded {total_added} songs from {path} - - - - ")
                    print(f"- - - - Skipped {total_skipped} songs from {path} - - - - ")

                print(f"- - - Loaded {len(self.library)} songs total - - - ")
                print("- - - Done loading music library - - - ")

            except Exception as e:
                print(f"Error loading library: {str(e)}")
                self.status = "error"
                return

            finally:
                if self._cancel_requested:
                    print("Library load cancelled")
                self._cancel_requested = False
                self.status = "idle"

        # Start the load operation as a task
        self._current_load_task = asyncio.create_task(load_operation())
        await self._current_load_task  # Wait for completion
