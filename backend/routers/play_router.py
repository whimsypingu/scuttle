from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from backend.core.audio import stream_audio
import backend.globals as G

router = APIRouter(prefix="/play")

@router.get("")
async def play_track(req: Request) -> StreamingResponse:
    """
    Streams the currently playing track (the head of the play queue).
    """
    queue_manager = req.app.state.queue_manager
    play_queue = queue_manager.get(G.PLAY_QUEUE_NAME)
    download_queue = queue_manager.get(G.DOWNLOAD_QUEUE_NAME)

    return stream_audio(req=req, play_queue=play_queue, download_queue=download_queue) #should peek the play_queue and return a fastapi.StreamingResponse of the peeked song

    


