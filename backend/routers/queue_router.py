from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from backend.core.audio import is_downloaded
from backend.data_structures import QueueRequest
import backend.globals as G

router = APIRouter(prefix="/queue")

@router.post("")
def queue_track(body: QueueRequest, req: Request) -> JSONResponse:
    track = body.track

    queue_manager = req.app.state.queue_manager
    play_queue = queue_manager.get(G.PLAY_QUEUE_NAME)
    download_queue = queue_manager.get(G.DOWNLOAD_QUEUE_NAME)

    play_queue.push(track) #last track to be played

    if not is_downloaded(track) and not download_queue.contains(track): #readies for download in background
        download_queue.insert_at(track)

    return JSONResponse(content={"content": play_queue.to_list()}, status_code=200)


@router.get("/contents")
def queue_contents(req: Request) -> JSONResponse:
    queue_manager = req.app.state.queue_manager
    play_queue = queue_manager.get(G.PLAY_QUEUE_NAME)

    return JSONResponse(content={"content": play_queue.to_list()}, status_code=200)
    

#@router.get("/clear")



