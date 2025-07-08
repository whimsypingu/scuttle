import os

DATA_DIR = "data"
DOWNLOAD_DIR = "downloads"

DB_FILENAME = os.path.join(DATA_DIR, "music.db")

DB_TRACKS_TABLENAME = "tracks" #do not make dynamic to avoid sql injection
DB_DOWNLOADS_TABLENAME = "downloads"
DB_CACHE_TABLENAME = "cache"