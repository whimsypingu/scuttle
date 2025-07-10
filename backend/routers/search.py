from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from typing import Optional

from backend.core.db import search_db, insert_track_db, cache_track_db
from backend.core.yt import search_yt
from backend.data_structures import SearchRequest
import backend.globals as G

router = APIRouter(prefix="/search")


@router.get("/db")
def search_db_tracks(q: Optional[str] = Query(None)):
    """
    Search for tracks in the local database by title or uploader.

    Args:
        q (str, optional): The search query string. Matches against lowercase title or uploader.

    Returns:
        JSONResponse: A list of matching tracks from the local SQLite database.
    """
    #local db search
    db_results = search_db(q)
    db_results_converted = [track.model_dump() for track in db_results]

    return JSONResponse(content=db_results_converted)


@router.post("/full")
def search_full_tracks(body: SearchRequest):
    """
    Perform a full search for tracks, combining local database and YouTube (via yt-dlp).

    Args:
        q (str, optional): The search query string. Matches against local database and performs an online search.

    Returns:
        JSONResponse: A combined list of matching tracks from both local storage and YouTube.
    """
    q = body.q

    #local db search
    db_results = search_db(q)
    if not q:
        return JSONResponse(content=db_results)

    #online yt search
    yt_results = search_yt(q, limit=G.SEARCH_LIMIT_DEFAULT, timeout=G.SEARCH_TIMEOUT_DEFAULT)
    
    #add to tracks and cache table (safe insert, skips if exists in tracks and updates timestamp in cache)
    for track in yt_results:
        insert_track_db(track)
        cache_track_db(track)

    combined_results = db_results + yt_results
    combined_results_converted = [track.model_dump() for track in combined_results]

    return JSONResponse(content=combined_results_converted)




#UNFINISHED

@router.post("/select")
def search_select_track(q: Optional[str] = Query(None)):
    #on short strings do not query yt search
    if not q or len(q.strip()) <= 5:
        return JSONResponse(content={"error": "Query too short, must be longer than 5 characters"}, status_code=400)

    #online yt search
    yt_results = search_yt(q, limit=G.SEARCH_LIMIT_DEFAULT, timeout=G.SEARCH_TIMEOUT_DEFAULT)

