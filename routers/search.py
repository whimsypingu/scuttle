from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from typing import Optional

from utils.db import search_db, cache_track_db
from utils.yt import search_yt
from data_structures import *
from globals import *

router = APIRouter()

@router.get("/search/db")
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
    db_results_converted = [track.to_dict() for track in db_results]

    return JSONResponse(content=db_results_converted)


@router.post("/search/full")
def search_full_tracks(q: Optional[str] = Query(None)):
    """
    Perform a full search for tracks, combining local database and YouTube (via yt-dlp).

    Args:
        q (str, optional): The search query string. Matches against local database and performs an online search.

    Returns:
        JSONResponse: A combined list of matching tracks from both local storage and YouTube.
    """
    #local db search
    db_results = search_db(q)

    #on empty string do not query yt search
    if not q:
        return JSONResponse(content=db_results)

    #online yt search
    yt_results = search_yt(q, limit=3, timeout=60)
    
    #add to tracks and cache table (safe insert, skips if exists in tracks and updates timestamp in cache)
    for track in yt_results:
        cache_track_db(track)

    combined_results = db_results + yt_results
    combined_results_converted = [track.to_dict() for track in combined_results]

    return JSONResponse(content=combined_results_converted)


@router.post("/search/select")
def search_select_track(q: Optional[str] = Query(None)):
    #on short strings do not query yt search
    if not q or len(q.strip()) <= 5:
        return JSONResponse(content={"error": "Query too short, must be longer than 5 characters"}, status_code=400)

    #online yt search
    yt_results = search_yt(q, limit=3, timeout=60)

    