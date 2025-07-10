from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse

from backend.routers import search, play, download, queue

from backend.data_structures import QueueManager
import backend.globals as G

@asynccontextmanager
async def lifespan(app: FastAPI):

    print("Starting...")

    #initialize backend and user facing queues
    queue_manager = app.state.queue_manager = QueueManager()

    queue_manager.get_or_create(G.DOWNLOAD_QUEUE)
    queue_manager.get_or_create(G.TRACK_QUEUE)
    
    yield #app runs

    print("Shutting down...")


app = FastAPI(lifespan=lifespan)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(search.router)
app.include_router(play.router)
app.include_router(download.router)
app.include_router(queue.router)

#serve index.html
@app.get("/", response_class=HTMLResponse)
def index():
    return FileResponse("static/index.html")

