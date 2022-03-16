import base64
from typing import Dict, TypedDict

from mutagen import id3

from megawave.util import getId

Album_Art_Cache_Entry = TypedDict(
    "Album_Art_Cache_Entry",
    {
        # raw image byte string
        "bytes": str,
        # base64 data string
        "data": str,
        # mime type / content type of the image
        "mime": str,
    },
)

Album_Art_Cache = TypedDict(
    "Album_Art_Cache", {"link": str, "art": Album_Art_Cache_Entry}
)

ALBUM_ART_BYTE_ID_CACHE: Dict[str, str] = {}

ALBUM_ART_CACHE: Dict[str, Album_Art_Cache] = {}


def add_frame_to_cache(frame: id3.APIC) -> str:
    img_bytes = frame.data
    byte_id = ALBUM_ART_BYTE_ID_CACHE.get(img_bytes, None)

    if byte_id is None:
        byte_id = getId()
        ALBUM_ART_BYTE_ID_CACHE[img_bytes] = byte_id

    if byte_id not in ALBUM_ART_CACHE:
        ALBUM_ART_CACHE[byte_id] = {
            "link": f"/api/library/art/{byte_id}",
            "art": {
                "bytes": img_bytes,
                "data": f"data:image/png;base64,{base64.b64encode(img_bytes).decode('ascii')}",
                "mime": frame.mime,
            },
        }

    return byte_id
