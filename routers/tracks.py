from fastapi import APIRouter
from fastapi.responses import JSONResponse

from utils.db import search_db

router = APIRouter()


@router.get("/tracks")
def get_all_tracks():
    
    #get all db entries
    tracks = search_db("")
    tracks_converted = [track.model_dump() for track in tracks]
    
    return JSONResponse(content=tracks_converted)
