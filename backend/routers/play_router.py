from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse

from backend.core.audio.audio import is_downloaded, stream_audio
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

    track = play_queue.peek()
    
    #check queue is not empty
    if not track:
        raise HTTPException(status_code=204, detail="No tracks to play")
    
    #check track is ready
    if not is_downloaded(track):
        if not download_queue.contains(track):
            await download_queue.push(track)
        raise HTTPException(status_code=503, detail="Track is downloading, try again shortly")

    return stream_audio(req=req, track=track) #should peek the play_queue and return a fastapi.StreamingResponse of the peeked song

    


