from pathlib import Path
from fastapi import Request, HTTPException
from fastapi.responses import StreamingResponse

from backend.data_structures import Track, TrackQueue
import backend.globals as G


def get_audio_path(track: Track) -> Path:
    return G.DOWNLOAD_DIR / f"{track.youtube_id}.{G.AUDIO_FORMAT}"

def is_downloaded(track: Track) -> bool:
    return get_audio_path(track).exists()

def get_audio_size(track: Track) -> int:
    return get_audio_path(track).stat().st_size


def stream_audio(req: Request, play_queue: TrackQueue, download_queue: TrackQueue) -> StreamingResponse:
    #automatically attempts to stream the first song in the play_queue
    track = play_queue.peek()
    if not track or not is_downloaded(track):
        raise HTTPException(status_code=404, detail="No downloadable track ready to stream.")

    file_path = get_audio_path(track)
    file_size = get_audio_size(track)

    range_header = req.headers.get("range")
    if range_header:
        #parse range heade: ex. bytes=0-1023
        range_value = range_header.strip().lower()
        if not range_value.startswith("bytes="):
            raise HTTPException(status_code=400, detail="Invalid Range header")

        range_value = range_value[len("bytes="):]
        start_str, end_str = range_value.split("-")

        try:
            start = int(start_str)
            end = int(end_str) if end_str else file_size - 1
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid Range values")

        if start >= file_size or end >= file_size:
            raise HTTPException(status_code=416, detail="Range not satisfiable")

        length = end - start + 1

        #streaming in chunks
        def iter_file_range(path: Path, start_byte: int, length_bytes: int):
            with path.open("rb") as f:
                f.seek(start_byte)
                bytes_read = 0
                while bytes_read < length_bytes:
                    to_read = min(G.STREAM_CHUNK_SIZE, length_bytes - bytes_read)
                    data = f.read(to_read)
                    if not data:
                        break
                    bytes_read += len(data)
                    yield data

        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(length),
            "Content-Type": "audio/mpeg",
        }

        return StreamingResponse(
            iter_file_range(file_path, start, length),
            status_code=206,
            headers=headers,
        )

    else:
        #if no range header, return full file
        def iter_file(path: Path):
            with path.open("rb") as f:
                while chunk := f.read(G.STREAM_CHUNK_SIZE):
                    yield chunk

        headers = {
            "Content-Length": str(file_size),
            "Accept-Ranges": "bytes",
            "Content-Type": "audio/mpeg",
        }

        return StreamingResponse(iter_file(file_path), headers=headers)
