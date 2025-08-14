import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

from backend.core.worker.download import DownloadWorker
from backend.core.youtube.client import YouTubeClient
from backend.core.database.audio_database import AudioDatabase

from backend.core.events.event_bus import EventBus
from backend.core.events.websocket.manager import WebsocketManager
from backend.core.events.handlers import register_event_handlers

from backend.core.queue.manager import QueueManager
from backend.core.queue.implementations.play_queue import PlayQueue
from backend.core.queue.implementations.download_queue import DownloadQueue

import backend.globals as G

from backend.api.routers import audio_router
from backend.api.routers import queue_router
from backend.api.routers import search_router
from backend.api.routers import websocket_router




@asynccontextmanager
async def lifespan(app: FastAPI):

    print("Starting...")
    
    websocket_manager = WebsocketManager()
    event_bus = EventBus()

    # link the db
    db = AudioDatabase(name=G.AUDIO_DATABASE_NAME, filepath=G.DB_FILE, event_bus=event_bus)
    await db.build()
    await db.view_all()

    print(await db.search(""))

    # ytdlp
    yt = YouTubeClient(name=G.YOUTUBE_CLIENT_NAME, base_dir=G.DOWNLOAD_DIR, event_bus=event_bus)

    # Initialize backend components early if needed for handlers
    play_queue = PlayQueue(name=G.PLAY_QUEUE_NAME, event_bus=event_bus)
    download_queue = DownloadQueue(name=G.DOWNLOAD_QUEUE_NAME, event_bus=event_bus)

    queue_manager = QueueManager()
    queue_manager.add(play_queue)
    queue_manager.add(download_queue)

    # workers
    download_worker = DownloadWorker(download_queue=download_queue, youtube_client=yt, audio_database=db)
    download_task = asyncio.create_task(download_worker.run())

    # Assign to app.state for global access
    app.state.websocket_manager = websocket_manager
    app.state.event_bus = event_bus
    app.state.queue_manager = queue_manager

    app.state.db = db
    app.state.yt = yt


    
    # triggers
    register_event_handlers(event_bus=event_bus, websocket_manager=websocket_manager)

    yield #app runs

    print("Shutting down...")


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or your ngrok URL for production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

app.include_router(audio_router.router)
app.include_router(queue_router.router)
app.include_router(search_router.router)

app.include_router(websocket_router.router)

#serve index.html
@app.get("/", response_class=HTMLResponse)
def index():
    return FileResponse("frontend/index.html")

