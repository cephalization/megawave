import os

BYTES_PER_RESPONSE = 325160

# techniques implemented based on:
# https://github.com/tiangolo/fastapi/issues/1240


def chunk_generator_from_stream(filepath, chunk_size, start, size):
    with open(filepath, mode="rb") as stream:
        bytes_read = 0

        stream.seek(start)

        while bytes_read < size:
            bytes_to_read = min(chunk_size, size - bytes_read)
            yield stream.read(bytes_to_read)
            bytes_read = bytes_read + bytes_to_read


def get_file_chunk_generator(filepath: str, byte_range: str):
    """Return a generator that reads a chunk of bytes from a file and the corresponding HTTP Content-Range header.
    byte_range should be of the form '0-10'
    """
    total_size = os.path.getsize(filepath)

    start_byte_requested = int(byte_range.split("=")[-1][:-1])
    end_byte_planned = min(start_byte_requested + BYTES_PER_RESPONSE, total_size) - 1

    chunk_generator = chunk_generator_from_stream(
        filepath,
        chunk_size=50000,
        start=start_byte_requested,
        size=BYTES_PER_RESPONSE,
    )

    content_range_header = (
        f"bytes {start_byte_requested}-{end_byte_planned}/{total_size}"
    )

    return chunk_generator, content_range_header
