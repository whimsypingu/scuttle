import traceback #debugging

from fastapi import APIRouter, Request, HTTPException, Response
from fastapi.responses import JSONResponse

from backend.core.lib.utils import is_downloaded
from backend.api.schemas.queue_schemas import *
from backend.core.models.download_job import DownloadJob
import backend.globals as G

router = APIRouter(prefix="/queue")


@router.post("/set-all")
async def queue_set_all_tracks(body: QueueSetAllTracksRequest, req: Request) -> Response:
    """
    Replace the play queue with the provided list of track IDs.

    Will only set tracks for track IDs that are downloaded.

    Args:
        body (QueueSetAllTracksRequest): Request body containing track IDs.
        req (Request): FastAPI request object to access app state.

    Returns:
        JSONResponse: The updated play queue serialized as JSON.

    Raises:
        HTTPException: Returns 500 if any unexpected error occurs.
    """
    ids = [id for id in body.ids if is_downloaded(id)]
    queue_manager = req.app.state.queue_manager

    play_queue = queue_manager.get(G.PLAY_QUEUE_NAME)

    try:
        # clear and set the new play queue
        await play_queue.set_all(ids)

        return Response(status_code=204)

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/set-first")
async def queue_set_first_track(body: QueueSetFirstTrackRequest, req: Request) -> Response:
    """
    Replace or set the first track in the play queue.

    If the track is already downloaded, it is immediately set as the first track.
    Otherwise, it is inserted as the next track to play, and added to the download queue if not present.

    Args:
        body (QueueSetFirstTrackRequest): Request body containing the Track to set first.
        req (Request): FastAPI request object to access app state.

    Returns:
        JSONResponse: The updated play queue serialized as JSON.

    Raises:
        HTTPException: Returns 500 if any unexpected error occurs during processing.
    """
    id = body.id
    job = DownloadJob(id=id, queue_first=True)

    queue_manager = req.app.state.queue_manager

    play_queue = queue_manager.get(G.PLAY_QUEUE_NAME)
    download_queue = queue_manager.get(G.DOWNLOAD_QUEUE_NAME)

    try:
        #queueing logic for replacing first item in queue if available
        if is_downloaded(track_or_id=id):
            await play_queue.set_first(id)
        elif not download_queue.contains(job):
            await download_queue.insert_next(job)
    
        return Response(status_code=204)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    

@router.post("/push")
async def queue_push_track(body: QueuePushTrackRequest, req: Request) -> Response:
    """
    Add a new track to the end of the play queue.

    The track is appended to the play queue. If it is not downloaded, it is also added to the download queue if not already present.

    Args:
        body (QueuePushTrackRequest): Request body containing the Track to push.
        req (Request): FastAPI request object to access app state.

    Returns:
        JSONResponse: The updated play queue serialized as JSON.

    Raises:
        HTTPException: Returns 500 if any unexpected error occurs during processing.
    """
    id = body.id
    job = DownloadJob(id=id, queue_last=True)

    queue_manager = req.app.state.queue_manager
    
    play_queue = queue_manager.get(G.PLAY_QUEUE_NAME)
    download_queue = queue_manager.get(G.DOWNLOAD_QUEUE_NAME)

    try:
        #normal queueing logic
        if is_downloaded(track_or_id=id):
            await play_queue.push(id)
        elif not download_queue.contains(job):
            await download_queue.push(job)
        
        return Response(status_code=204)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    


@router.post("/push-front")
async def queue_push_front(body: QueuePushTrackRequest, req: Request) -> Response:
    """
    Add a new track to the front of the play queue.

    The track is prepended to the play queue. If it is not downloaded, it is also added to the download queue if not already present.

    Args:
        body (QueuePushTrackRequest): Request body containing the Track to push.
        req (Request): FastAPI request object to access app state.

    Returns:
        JSONResponse: The updated play queue serialized as JSON.

    Raises:
        HTTPException: Returns 500 if any unexpected error occurs during processing.
    """
    queue_manager = req.app.state.queue_manager
    play_queue = queue_manager.get(G.PLAY_QUEUE_NAME)
    download_queue = queue_manager.get(G.DOWNLOAD_QUEUE_NAME)

    id = body.id
    job = DownloadJob(id=id, queue_first=True)

    try:
        #push to front
        if is_downloaded(track_or_id=id):
            await play_queue.insert_next(id)
        
        elif not download_queue.contains(job):
            await download_queue.insert_next(job)

        return Response(status_code=204)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    


@router.post("/pop")
async def queue_pop_track(req: Request) -> Response:
    """
    Remove the first track from the play queue (i.e., dequeue the currently playing track).

    Args:
        req (Request): FastAPI request object to access app state.

    Returns:
        JSONResponse: The updated play queue serialized as JSON after popping the first track.

    Raises:
        HTTPException: Returns 500 if any unexpected error occurs during processing.
    """
    queue_manager = req.app.state.queue_manager
    
    play_queue = queue_manager.get(G.PLAY_QUEUE_NAME)

    try:
        await play_queue.pop()
        return Response(status_code=204)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/remove-at")
async def queue_remove_track(body: QueueRemoveTrackRequest, req: Request) -> Response:
    """
    Remove a track at the specified index from the play queue.

    Args:
        body (QueueRemoveTrackRequest): Request body containing the id and index of the track to remove.
        req (Request): FastAPI request object to access app state.

    Returns:
        JSONResponse: The updated play queue serialized as JSON after removal.

    Raises:
        HTTPException: Returns 400 if the index is invalid (out of range).
        HTTPException: Returns 500 if any unexpected error occurs during processing.
    """
    id = body.id
    index = int(body.index) #guaranteed by schema and by js default param

    queue_manager = req.app.state.queue_manager
    play_queue = queue_manager.get(G.PLAY_QUEUE_NAME)

    #handled in remove_at but for debugging purposes
    if index < 0 or index >= play_queue.get_size():
        raise HTTPException(status_code=400, detail="Invalid index")

    try:
        #include id just to make sure the right item is removed, this executes nothing if id doesn't match at index.
        await play_queue.remove_at(id, index)
        return Response(status_code=204)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    


@router.post("/clear")
async def queue_clear_tracks(req: Request) -> Response:
    """
    Remove all tracks after the first if there is any.

    Args:
        req (Request): FastAPI request object to access app state.

    Returns:
        JSONResponse: The updated play queue serialized as JSON after clearing tracks besides the first.

    Raises:
        HTTPException: Returns 500 if any unexpected error occurs during processing.
    """
    queue_manager = req.app.state.queue_manager
    
    play_queue = queue_manager.get(G.PLAY_QUEUE_NAME)

    try:
        await play_queue.clear()
        return Response(status_code=204)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))




@router.get("/content")
async def get_queue_content(req: Request) -> JSONResponse:
    """
    Retrieve the current contents of the play queue.

    Args:
        req (Request): FastAPI request object to access app state.

    Returns:
        JSONResponse: The current play queue serialized as JSON.
    """
    queue_manager = req.app.state.queue_manager
    play_queue = queue_manager.get(G.PLAY_QUEUE_NAME)

    content = play_queue.to_json()
    return JSONResponse(content={"content": content}, status_code=200)
    

#@router.get("/clear")



