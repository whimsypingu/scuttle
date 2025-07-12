from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse

from backend.core.audio import is_downloaded
from backend.data_structures import QueueRequest
import backend.globals as G

router = APIRouter(prefix="/queue")

@router.post("")
async def queue_track(body: QueueRequest, req: Request) -> JSONResponse:
    track = body.track
    #index = body.index #for now, ignore
    play = body.play

    queue_manager = req.app.state.queue_manager
    play_queue = queue_manager.get(G.PLAY_QUEUE_NAME)
    download_queue = queue_manager.get(G.DOWNLOAD_QUEUE_NAME)

    try:
        #force this track to head (replace current or queue next)
        if play:
            if is_downloaded(track):
                await play_queue.pop()
                await play_queue.insert_at(0, track)
            else:
                await play_queue.insert_at(1, track)
                if not download_queue.contains(track):
                    await download_queue.insert_at(1, track)
        else:
            #normal queueing logic
            await play_queue.push(track)

            if not is_downloaded(track):
                if not download_queue.contains(track):
                    await download_queue.push(track)
    
        return JSONResponse(content={"queueTrackContent": play_queue.to_json()}, status_code=200)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/contents")
def queue_contents(req: Request) -> JSONResponse:
    queue_manager = req.app.state.queue_manager
    play_queue = queue_manager.get(G.PLAY_QUEUE_NAME)

    return JSONResponse(content={"queueTrackContent": play_queue.to_json()}, status_code=200)
    

#@router.get("/clear")



