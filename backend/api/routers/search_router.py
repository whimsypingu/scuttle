import traceback #debugging

from fastapi import APIRouter, HTTPException, Request, Query, Response
from fastapi.responses import JSONResponse
from typing import Optional

from backend.api.schemas.search_schemas import *
from backend.core.lib.utils import is_downloaded
from backend.core.models.download_job import DownloadJob
import backend.globals as G

from backend.core.database.audio_database import AudioDatabase
from backend.core.youtube.client import YouTubeClient

router = APIRouter(prefix="/search")


@router.get("/")
async def search(req: Request, q: Optional[str] = Query(None)):
    """
    Search for tracks in the local database by title or artist.

    Args:
        q (str, optional): The search query string. Matches against lowercase title or artist.

    Returns:
        JSONResponse: A list of matching tracks from the local SQLite database.
    """
    #local db search
    db: AudioDatabase = req.app.state.db
    content = await db.search(q)

    return JSONResponse(content={"content": content}, status_code=200)



@router.get("/deep")
async def deep_search(req: Request, q: Optional[str] = Query(None)):
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

    if not q or len(q) == 0:
        return Response(status_code=200)

    yt: YouTubeClient = req.app.state.yt
    db: AudioDatabase = req.app.state.db #put into db?

    results = await yt.robust_search(q)

    for track in results:
        print("ATTEMPTING LOG TRACK:", track)
        await db.log_track(track)

    content = [track.to_json() for track in results]
    return JSONResponse(content={"content": content}, status_code=200)



@router.get("/download")
async def download_search(req: Request, q: str):
    """
    Get best search and automatically begin download

    Args:
        q (str, optional): The search query string

    Returns:
        JSONResponse: Track
    """
    if not q or not q.strip():
        return JSONResponse(content={"status": "empty query"}, status_code=400)

    queue_manager = req.app.state.queue_manager

    download_queue = queue_manager.get(G.DOWNLOAD_QUEUE_NAME)

    job = DownloadJob(query=q)
    await download_queue.push(job)

    return JSONResponse(content={"status": "queued"}, status_code=200)



