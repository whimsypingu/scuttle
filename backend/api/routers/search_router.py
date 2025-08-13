import traceback #debugging

from fastapi import APIRouter, Request, Query
from fastapi.responses import JSONResponse
from typing import Optional

from backend.api.schemas.search_schemas import *
import backend.globals as G

router = APIRouter(prefix="/search")


@router.get("/")
async def search(req: Request, q: Optional[str] = Query(None)):
    """
    Search for tracks in the local database by title or uploader.

    Args:
        q (str, optional): The search query string. Matches against lowercase title or uploader.

    Returns:
        JSONResponse: A list of matching tracks from the local SQLite database.
    """
    #local db search
    db = req.app.state.db
    content = await db.search(q)

    return JSONResponse(content={"content": content}, status_code=200)



@router.get("/deep")
async def search(req: Request, q: Optional[str] = Query(None)):
    """
    Search for tracks via ytdlp

    Args:
        q (str, optional): The search query string.

    Returns:
        JSONResponse: A list of matching track.
    """
    #local db search
    #queue_manager = req.app.state.queue_manager
    #search_queue = queue_manager.get(G.DOWNLOAD_QUEUE_NAME)

    #search_queue.push()

    yt = req.app.state.yt
    results = await yt.search(q)

    content = [track.to_json() for track in results]
    return JSONResponse(content={"content": content}, status_code=200)

