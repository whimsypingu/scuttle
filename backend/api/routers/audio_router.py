from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse

from backend.core.audio.stream import stream_audio
from backend.core.lib.utils import is_downloaded

from backend.core.models.download_job import DownloadJob
import backend.globals as G

router = APIRouter(prefix="/audio")


@router.get("/stream/{id}")
async def get_audio_stream(id: str, req: Request, full: bool = False):
    """
    Streams the requested track.
    """
    job = DownloadJob(id=id)

    queue_manager = req.app.state.queue_manager

    download_queue = queue_manager.get(G.DOWNLOAD_QUEUE_NAME)

    if not is_downloaded(track_or_id=id):
        if not download_queue.contains(job):
            await download_queue.push(job)
            
        raise HTTPException(status_code=503, detail="Track is downloading, try again shortly")
    return stream_audio(req=req, track_or_id=id, full=full)
