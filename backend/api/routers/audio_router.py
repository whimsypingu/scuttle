import asyncio
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse

from backend.api.schemas.audio_schemas import ToggleLikeRequest

from backend.core.audio.stream import stream_audio
from backend.core.lib.utils import is_downloaded

from backend.core.models.download_job import DownloadJob
import backend.globals as G

from backend.core.database.audio_database import AudioDatabase


router = APIRouter(prefix="/audio")


@router.get("/stream/{id}")
async def get_audio_stream(id: str, req: Request, full: bool = False):
    """
    Streams the requested track.
    """
    job = DownloadJob(id=id, queue_last=True) #add an ensure_fetched field so it fetches if it required a download

    queue_manager = req.app.state.queue_manager
    db: AudioDatabase = req.app.state.db

    download_queue = queue_manager.get(G.DOWNLOAD_QUEUE_NAME)

    if not await db.is_downloaded(id):
        if not download_queue.contains(job):
            await download_queue.push(job)
        
        raise HTTPException(status_code=503, detail="Track is downloading, try again shortly")
    return stream_audio(req=req, id=id, full=full)


@router.post("/toggle_like")
async def toggle_track_like(body: ToggleLikeRequest, req: Request):
    """
    toggles like
    """
    id = body.id
    
    db: AudioDatabase = req.app.state.db

    await db.toggle_like(id)

    return JSONResponse(content={"status": "toggled"}, status_code=200)
