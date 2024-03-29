import os
from typing import Tuple

MAX_BYTES_PER_RESPONSE = 100000
MAX_CHUNK_SIZE = 50000

# techniques implemented based on:
# https://github.com/tiangolo/fastapi/issues/1240


def chunk_generator_from_stream(filepath, start, size):
    with open(filepath, mode="rb") as stream:
        bytes_read = 0

        stream.seek(start)

        while bytes_read < size:
            bytes_to_read = min(MAX_CHUNK_SIZE, size - bytes_read)
            yield stream.read(bytes_to_read)
            bytes_read = bytes_read + bytes_to_read


def get_byte_range_bounds(byte_range_str: str, total_size: int) -> Tuple[int, int]:
    """Return the start and end byte of a byte range string."""
    byte_range_str = byte_range_str.replace("bytes=", "")
    segments = byte_range_str.split("-")
    start_byte = int(segments[0])
    # chrome does not send end_byte but safari does
    # we need to handle this case and generate an end_byte if not provided
    end_byte = min(
        int(segments[-1]) if segments[-1] else start_byte + MAX_CHUNK_SIZE,
        total_size,
    )

    return start_byte, end_byte


def get_file_chunk_generator(filepath: str, byte_range: str):
    """Return a generator that reads a chunk of bytes from a file and the corresponding HTTP Content-Range header.
    byte_range should be of the form 'bytes=0-10'
    """
    total_size = os.path.getsize(filepath)
    start_byte_requested, end_byte_requested = get_byte_range_bounds(
        byte_range, total_size
    )

    # generate appropriate byte range; we don't want to send more than requested or more than our server max
    end_byte_planned = min(
        end_byte_requested,
        min(start_byte_requested + MAX_BYTES_PER_RESPONSE, total_size) - 1,
    )

    chunk_generator = chunk_generator_from_stream(
        filepath,
        start=start_byte_requested,
        size=end_byte_planned,
    )

    content_range_header = (
        f"bytes {start_byte_requested}-{end_byte_planned}/{total_size}"
    )

    return chunk_generator, content_range_header
