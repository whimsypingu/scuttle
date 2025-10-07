import traceback
from typing import Optional
from fastapi import APIRouter, Query, Request, HTTPException, Response
from fastapi.responses import JSONResponse


from backend.api.schemas.playlist_schemas import CreatePlaylistRequest, DeleteTrackRequest, EditTrackRequest
from backend.core.database.audio_database import AudioDatabase
from backend.core.models.download_job import DownloadJob
from backend.core.playlists.manager import PlaylistExtractorManager

import backend.globals as G



router = APIRouter(prefix="/playlists")



@router.get("/")
async def get_playlists(req: Request):
    """
    Gets all playlist names

    Returns:
        JSONResponse: Playlist names and ids.
    """
    db: AudioDatabase = req.app.state.db
    content = await db.get_all_playlists()

    print("GET PLAYLISTS CONTENT:", content)

    return JSONResponse(content={"content": content}, status_code=200)


@router.get("/content")
async def get_playlist_content(req: Request, id: Optional[int] = Query(None)):
    """
    Fetches track ids for the corresponding playlist

    Returns:
        JSONResponse: A list of matching track ids from the local SQLite database.
    """
    db: AudioDatabase = req.app.state.db
    content = await db.get_playlist_content(id)

    print("ID:", id, "CONTENT:", content)

    return JSONResponse(content={"content": content}, status_code=200)



@router.post("/create")
async def create_playlist(body: CreatePlaylistRequest, req: Request) -> Response:
    """
    Creates a new playlist in the database.
    If 'import_url' is provided, performs additional processing.

    Args:
        body (CreatePlaylistRequest): Request body containing temp_id, name, and optional import_url.
        req (Request): FastAPI request object to access app state.

    Returns:
        JSONResponse: Status creation

    Raises:
        HTTPException: Returns 400 if name is blank.
        HTTPException: 500 for unexpected errors.
    """
    temp_id = body.temp_id
    name = body.name.strip() if body.name else ""
    url = body.import_url.strip() if body.import_url else None

    if not name:
        raise HTTPException(status_code=400, detail="Playlist name cannot be empty")

    db: AudioDatabase = req.app.state.db
    playlist_ext_manager: PlaylistExtractorManager = req.app.state.playlist_ext_manager

    queue_manager = req.app.state.queue_manager
    download_queue = queue_manager.get(G.DOWNLOAD_QUEUE_NAME)

    try:
        #make playlist and hold onto id to add songs into it if import required
        content = await db.create_playlist(name=name, temp_id=temp_id) #database handles id conflicts

        #handle importing
        if url:
            extracted_tracks = playlist_ext_manager.fetch_data(url) #should return [] in worst case
            playlist_id = content.get("id")

            for track in extracted_tracks:
                job = DownloadJob(
                    query=track.get("download_query"), 
                    metadata=track.get("metadata"),
                    updates=[
                        {
                            "id": playlist_id,
                            "checked": True
                        }
                    ]
                )
                await download_queue.push(job)

        return JSONResponse(content={"status": "created"}, status_code=200)
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    



@router.get("/likes")
async def get_likes(req: Request):
    """
    Fetches track ids from the likes database table.

    Returns:
        JSONResponse: A list of matching track ids from the local SQLite database.
    """
    db: AudioDatabase = req.app.state.db
    content = await db.fetch_liked_tracks()

    return JSONResponse(content={"content": content}, status_code=200)



@router.post("/edit-track")
async def edit_track(body: EditTrackRequest, req: Request) -> Response:
    """
    Edits track data in the database

    Args:
        body (EditTrackRequest): Request body containing the track id, custom title, custom artist, and playlists it should be in
        req (Request): FastAPI request object to access app state.

    Returns:
        status
    """
    track_id = body.id
    title = body.title
    artist = body.artist
    playlist_updates = [pl.model_dump() for pl in body.playlists] #build the right data structure from PlaylistSelections
    
    db: AudioDatabase = req.app.state.db

    await db.update_track_playlists(track_id=track_id, playlist_updates=playlist_updates)
    await db.set_custom_metadata(track_id, title, artist)

    return JSONResponse(content={"status": "updated"}, status_code=200)



@router.post("/delete-track")
async def delete_track(body: DeleteTrackRequest, req: Request) -> Response:
    """
    Deletes track in the database

    Args:
        body (DeleteTrackRequest): Request body containing track id to delete
        req (Request): FastAPI request object to access app state.

    Returns:
        status
    """
    track_id = body.id

    db: AudioDatabase = req.app.state.db

    await db.delete_track(track_id)

    return JSONResponse(content={"status": "deleted"}, status_code=200)
