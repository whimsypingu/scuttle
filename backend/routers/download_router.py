from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from backend.core.audio import is_downloaded
from backend.data_structures import DownloadRequest
import backend.globals as G

router = APIRouter(prefix="/download")


@router.post("")
def download_track(body: DownloadRequest, req: Request) -> JSONResponse:
    track = body.track

    queue_manager = req.app.state.queue_manager
    download_queue = queue_manager.get(G.DOWNLOAD_QUEUE_NAME)

    if is_downloaded(track):
        return JSONResponse(content={"message": "Already downloaded"}, status_code=200)

    if download_queue.contains(track):
        return JSONResponse(content={"message": "Already in download queue"}, status_code=200)

    download_queue.push(track)
    return JSONResponse(content={"message": "Queued for download"}, status_code=200)



@router.get("/contents")
def download_contents(req: Request) -> JSONResponse:
    queue_manager = req.app.state.queue_manager
    download_queue = queue_manager.get(G.DOWNLOAD_QUEUE_NAME)

    return JSONResponse(content={"content": download_queue.to_list()}, status_code=200)