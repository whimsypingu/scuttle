from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse

from backend.routers import queue_router, play_router, download_router, search_router, websocket_router

from backend.data_structures import QueueManager, WebsocketManager
import backend.globals as G

@asynccontextmanager
async def lifespan(app: FastAPI):

    print("Starting...")

    #initialize websocket manager
    websocket_manager = app.state.websocket_manager = WebsocketManager()

    #initialize backend and user facing queues
    queue_manager = app.state.queue_manager = QueueManager()

    queue_manager.create(G.SEARCH_QUEUE_NAME)
    queue_manager.create(G.DOWNLOAD_QUEUE_NAME)
    queue_manager.create(G.PLAY_QUEUE_NAME, websocket_manager)
    
    yield #app runs

    print("Shutting down...")


app = FastAPI(lifespan=lifespan)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(search_router.router)
app.include_router(queue_router.router)
app.include_router(download_router.router)
app.include_router(play_router.router)

app.include_router(websocket_router.router)

#serve index.html
@app.get("/", response_class=HTMLResponse)
def index():
    return FileResponse("static/index.html")

