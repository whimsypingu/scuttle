import traceback #debugging

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse

from backend.core.audio.audio import is_downloaded
from backend.data_structures import QueueRequest, PlayNowRequest, QueueRemoveRequest
import backend.globals as G

router = APIRouter(prefix="/queue")

@router.post("")
async def queue_track(body: QueueRequest, req: Request) -> JSONResponse:
    track = body.track

    queue_manager = req.app.state.queue_manager
    play_queue = queue_manager.get(G.PLAY_QUEUE_NAME)
    download_queue = queue_manager.get(G.DOWNLOAD_QUEUE_NAME)

    try:
        #normal queueing logic
        await play_queue.push(track)

        if not is_downloaded(track):
            if not download_queue.contains(track):
                await download_queue.push(track)
    
        return JSONResponse(content={"queueTrackContent": play_queue.to_json()}, status_code=200)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/now")
async def queue_now_track(body: PlayNowRequest, req: Request) -> JSONResponse:
    track = body.track

    queue_manager = req.app.state.queue_manager
    play_queue = queue_manager.get(G.PLAY_QUEUE_NAME)
    download_queue = queue_manager.get(G.DOWNLOAD_QUEUE_NAME)

    try:
        #queueing logic for replacing first item in queue and playing asap
        if is_downloaded(track):
            await play_queue.pop()
            await play_queue.insert_at(0, track)
        else:
            await play_queue.insert_at(1, track)
            if not download_queue.contains(track):
                await download_queue.insert_at(1, track)
    
        return JSONResponse(content={"queueTrackContent": play_queue.to_json()}, status_code=200)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    


@router.post("/remove")
async def queue_remove_track(body: QueueRemoveRequest, req: Request) -> JSONResponse:
    index = int(body.index) #guaranteed by schema and by js default param

    queue_manager = req.app.state.queue_manager
    play_queue = queue_manager.get(G.PLAY_QUEUE_NAME)

    #handled in remove_at but for debugging purposes
    if index < 0 or index >= play_queue.get_size():
        raise HTTPException(status_code=400, detail="Invalid index")

    try:
        if index == 0:
            await play_queue.pop()
        else:
            await play_queue.remove_at(index)

        return JSONResponse(content={"queueTrackContent": play_queue.to_json()}, status_code=200)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    


@router.get("/contents")
def queue_contents(req: Request) -> JSONResponse:
    queue_manager = req.app.state.queue_manager
    play_queue = queue_manager.get(G.PLAY_QUEUE_NAME)

    return JSONResponse(content={"queueTrackContent": play_queue.to_json()}, status_code=200)
    

#@router.get("/clear")



