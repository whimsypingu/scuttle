from pathlib import Path
from fastapi import Request, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from typing import Union

from backend.core.lib.utils import is_downloaded, get_audio_path, get_audio_size
from backend.core.models.track import Track
import backend.globals as G

import mimetypes


def stream_audio(req: Request, id: str) -> FileResponse:
    #checks for status
    if not id:
        raise HTTPException(status_code=404, detail="No track id provided.")
    
    if not is_downloaded(id=id):
        raise HTTPException(status_code=404, detail="Track not downloaded.")

    file_path = get_audio_path(id=id)

    #according to gemini, the anyio call in fileresponse is actually faster than the one in streamingresponse
    #https://github.com/Kludex/starlette/blob/main/starlette/responses.py#L293
    #no need to reinvent the wheel anyway, fileresponse already handles all the range requests and shit.
    return FileResponse(
        path=file_path,
        content_disposition_type="inline"
    )


#keep this version in case i add some kind of transcoding in the future
'''
def stream_audio(req: Request, id: str, full: False) -> StreamingResponse:
    #checks for status
    if not id:
        raise HTTPException(status_code=404, detail="No track id provided.")
    
    if not is_downloaded(id=id):
        raise HTTPException(status_code=404, detail="Track not downloaded.")

    file_path = get_audio_path(id=id)
    file_size = get_audio_size(id=id)

    #support different filetypes (audio/mpeg for mp3, audio/wav for wav, etc)
    mime, _ = mimetypes.guess_type(str(file_path))
    content_type = mime or "application/octet-stream"

    range_header = req.headers.get("range")
    if range_header and not full:
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
            "Content-Type": content_type,
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
            "Content-Type": content_type,
        }

        return StreamingResponse(
            iter_file(file_path), 
            status_code=200, 
            headers=headers
        )
'''