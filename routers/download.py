from fastapi import APIRouter
from fastapi.responses import JSONResponse

from utils.db import insert_track_db, cache_track_db, download_track_db
from utils.yt import download_track_yt
from utils.audio import audio_exists
from data_structures import Track, DownloadRequest

router = APIRouter()


@router.post("/download")
def download_track(req: DownloadRequest):
    track = Track(**req.model_dump())

    if audio_exists(track.youtube_id):
        return {"status": "already_downloaded"}

    #call yt.py download handler
    download_track_yt(track)

    #insert into DB, cache, then log download
    insert_track_db(track)
    cache_track_db(track)
    download_track_db(track)

    return {"status": "downloaded", "title": track.title}

