from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from routers import search, play, tracks

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(search.router)
app.include_router(play.router)
app.include_router(tracks.router)

#serve index.html
@app.get("/", response_class=HTMLResponse)
def index():
    return FileResponse("static/index.html")


