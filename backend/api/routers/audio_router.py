from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse

from backend.core.audio.streaming import stream_audio
from backend.core.audio.utils import is_downloaded

import backend.globals as G

router = APIRouter(prefix="/audio")

@router.get("/stream/current")
async def get_current_audio_stream(req: Request) -> StreamingResponse:
    """
    Streams the currently playing track (the head of the play queue).
    """
    queue_manager = req.app.state.queue_manager

    play_queue = queue_manager.get(G.PLAY_QUEUE_NAME)
    download_queue = queue_manager.get(G.DOWNLOAD_QUEUE_NAME)

    current_track = play_queue.peek()
    
    #check queue is not empty
    if not current_track:
        raise HTTPException(status_code=204, detail="No tracks to play")
    
    #check track is ready
    if not is_downloaded(current_track):
        if not download_queue.contains(current_track):
            pass
            #await download_queue.push(current_track) IMPLEMENT THIS
        raise HTTPException(status_code=503, detail="Track is downloading, try again shortly")

    return stream_audio(req=req, track=current_track) #should peek the play_queue and return a fastapi.StreamingResponse of the peeked song

    


