from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from backend.data_structures import QueueRequest

router = APIRouter(prefix="/queue")

@router.post("/{queue_name}/push")
def push_track_to_queue(queue_name: str, body: QueueRequest, req: Request):

    #extract track
    track = body.track

    #access the singleton app.state queues
    queue_manager = req.app.state.queue_manager

    #find the queue and push the track
    track_queue = queue_manager.get_or_create(queue_name)
    track_queue.push(track)

    print(track_queue.to_list())

    return JSONResponse(content={"message": "OK"}, status_code=200)

'''
####
@router.post("/{queue_name}/pop")
def pop_track_from_queue(queue_name: str, track: Track, req: Request):

    #access the singleton app.state queues
    queue_manager = req.app.state.queue_manager

    #find the queue and pop the track
    track_queue = queue_manager.get_or_create(queue_name)
    track_queue.pop()

    return {"message": f"Track popped from queue '{queue_name}'"}
'''

@router.get("/{queue_name}")
def get_queue(queue_name: str, req: Request):

    #access the singleton app.state queues
    queue_manager = req.app.state.queue_manager

    #find the queue
    track_queue = queue_manager.get_or_create(queue_name)
    
    return JSONResponse(content=track_queue.to_list())
