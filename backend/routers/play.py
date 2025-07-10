from pathlib import Path
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from backend.core.audio import get_audio_path, get_audio_size

router = APIRouter(prefix="/play")


@router.get("")
async def play_track(youtube_id: str, req: Request):
    file_path = get_audio_path(youtube_id)

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    file_size = get_audio_size(youtube_id)
    range_header = req.headers.get("range")

    if range_header: 
        #parse the Range header: e.g. bytes=0-1023
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
                chunk_size = 1024 * 1024  #1mb chunks
                while bytes_read < length_bytes:
                    to_read = min(chunk_size, length_bytes - bytes_read)
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
            status_code=206,  #partial Content
            headers=headers,
        )

    else:
        #if no Range header, return full file
        headers = {
            "Content-Length": str(file_size),
            "Accept-Ranges": "bytes",
            "Content-Type": "audio/mpeg",
        }
        def iter_file(path: Path):
            with path.open("rb") as f:
                while chunk := f.read(1024*1024):
                    yield chunk

        return StreamingResponse(iter_file(file_path), headers=headers)
    

