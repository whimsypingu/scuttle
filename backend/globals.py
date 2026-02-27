from pathlib import Path
from enum import Enum

#singleton names, and also websocket sources
SERVER_NAME = "server"
SEARCH_QUEUE_NAME = "search_queue"
DOWNLOAD_QUEUE_NAME = "download_queue"
PLAY_QUEUE_NAME = "play_queue"
ENRICH_QUEUE_NAME = "enrich_queue"

AUDIO_DATABASE_NAME = "audio_database"
YOUTUBE_CLIENT_NAME = "youtube_client"

MUSICBRAINZ_CLIENT_NAME = "musicbrainz_client"

#
ROOT_DIR = Path(__file__).resolve().parent.parent
DB_FILE = ROOT_DIR / "backend" / "data" / "audio.db"
DOWNLOAD_DIR = ROOT_DIR / "backend" / "data" / "downloads"


UNIT_SEP = "\x1f"

STREAM_CHUNK_SIZE = 1024 * 1024 #1MB

AUDIO_EXTENSIONS = ["wav", "webm", "opus", "mp3"] #order matters because it will look for best quality first

