from typing import Optional
from fastapi import APIRouter, Query, Request, HTTPException, Response
from fastapi.responses import JSONResponse


from backend.api.schemas.playlist_schemas import CreatePlaylistRequest, EditTrackRequest
from backend.core.database.audio_database import AudioDatabase


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

    Args:
        body (QueuePushTrackRequest): Request body containing the Track to push.
        req (Request): FastAPI request object to access app state.

    Returns:
        JSONResponse: The updated play queue serialized as JSON.

    Raises:
        HTTPException: Returns 500 if any unexpected error occurs during processing.
    """
    temp_id = body.temp_id
    name = body.name

    db: AudioDatabase = req.app.state.db

    await db.create_playlist(name=name, temp_id=temp_id)

    return JSONResponse(content={"status": "created"}, status_code=200)




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
    Creates a new playlist in the database.

    Args:
        body (QueuePushTrackRequest): Request body containing the track id, custom title, custom artist, and playlists it should be in
        req (Request): FastAPI request object to access app state.

    Returns:
        status
    """
    track_id = body.id
    title = body.title
    artist = body.artist
    playlist_updates = [pl.model_dump() for pl in body.playlists] #build the right data structure from PlaylistSelections
    
    db: AudioDatabase = req.app.state.db

    print(f"UPDATED METADATA: TITLE: {title}, ARTIST: {artist}")

    await db.update_track_playlists(track_id=track_id, playlist_updates=playlist_updates)

    await db.set_custom_metadata(track_id, title, artist)

    return JSONResponse(content={"status": "updated"}, status_code=200)


