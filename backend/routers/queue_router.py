from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from backend.core.audio import is_downloaded
from backend.data_structures import QueueRequest
import backend.globals as G

router = APIRouter(prefix="/queue")

@router.post("")
def queue_track(body: QueueRequest, req: Request) -> JSONResponse:
    track = body.track
    #index = body.index #for now, ignore
    play = body.play

    queue_manager = req.app.state.queue_manager
    play_queue = queue_manager.get(G.PLAY_QUEUE_NAME)
    download_queue = queue_manager.get(G.DOWNLOAD_QUEUE_NAME)

    #force this track to head (replace current or queue next)
    if play:
        if is_downloaded(track):
            play_queue.pop()
            play_queue.insert_at(0, track)
        else:
            play_queue.insert_at(1, track)
            if not download_queue.contains(track):
                download_queue.insert_at(1, track)
    else:
        #normal queueing logic
        play_queue.push(track)

        if not is_downloaded(track):
            if not download_queue.contains(track):
                download_queue.push(track)

    return JSONResponse(content={"queueTrackContent": play_queue.to_list()}, status_code=200)


@router.get("/contents")
def queue_contents(req: Request) -> JSONResponse:
    queue_manager = req.app.state.queue_manager
    play_queue = queue_manager.get(G.PLAY_QUEUE_NAME)

    return JSONResponse(content={"queueTrackContent": play_queue.to_list()}, status_code=200)
    

#@router.get("/clear")



