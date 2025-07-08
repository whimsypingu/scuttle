from fastapi import APIRouter
from fastapi.responses import JSONResponse

from utils.db import search_db
from data_structures import *
from globals import *

router = APIRouter()


@router.get("/tracks")
def get_all_tracks():
    
    #get all db entries
    tracks = search_db("")
    
    return JSONResponse(content=tracks)
