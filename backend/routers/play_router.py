from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from backend.core.audio import is_downloaded, stream_audio
from backend.data_structures import PlayRequest
import backend.globals as G

router = APIRouter(prefix="/play")

@router.post("")
async def play_track(body: PlayRequest, req: Request) -> StreamingResponse:
    track = body.track
    
    queue_manager = req.app.state.queue_manager
    play_queue = queue_manager.get(G.PLAY_QUEUE_NAME)
    download_queue = queue_manager.get(G.DOWNLOAD_QUEUE_NAME)

    play_queue.insert_at(1, track) #next track to be played

    if is_downloaded(track): #song is ready to play right now
        if play_queue.get_size() > 1: #song was just appended to the next song so skip the current one
            play_queue.pop()

    else:
        if not download_queue.contains(track): #song should be downloaded while current song plays
            download_queue.insert_at(1, track)

    return stream_audio(req=req, play_queue=play_queue, download_queue=download_queue) #should peek the play_queue and return a fastapi.StreamingResponse of the peeked song

    


