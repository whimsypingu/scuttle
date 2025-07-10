from fastapi import APIRouter

from backend.core.db import insert_track_db, cache_track_db, download_track_db
from backend.core.yt import download_track_yt
from backend.core.audio import audio_exists
from backend.data_structures import Track, DownloadRequest

router = APIRouter(prefix="/download")


@router.post("")
def download_track(body: DownloadRequest):

    #unwrap from downloadrequest -> track
    track = body.track

    if audio_exists(track.youtube_id):
        return {"status": "already_downloaded"}

    #call yt.py download handler
    download_track_yt(track)

    #insert into DB, cache, then log download
    insert_track_db(track)
    cache_track_db(track)
    download_track_db(track)

    return {"status": "downloaded", "title": track.title}

