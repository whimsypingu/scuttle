from typing import Optional
from fastapi import APIRouter, Query, Request, HTTPException, Response
from fastapi.responses import JSONResponse


from backend.api.schemas.playlist_schemas import CreatePlaylistRequest
from backend.core.database.audio_database import AudioDatabase


router = APIRouter(prefix="/playlists")



@router.get("/")
async def get_playlist_content(req: Request):
    """
    Gets all playlist names

    Returns:
        JSONResponse: Playlist names and ids.
    """
    db: AudioDatabase = req.app.state.db
    content = await db.get_all_playlists()

    return JSONResponse(content={"content": content}, status_code=200)


@router.get("/content")
async def get_playlist_content(req: Request, id: Optional[int] = Query(None)):
    """
    Fetches tracks for the corresponding playlist

    Returns:
        JSONResponse: A list of matching tracks from the local SQLite database.
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
    Fetches tracks from the likes database table.

    Returns:
        JSONResponse: A list of matching tracks from the local SQLite database.
    """
    db: AudioDatabase = req.app.state.db
    content = await db.fetch_liked_tracks()

    return JSONResponse(content={"content": content}, status_code=200)

