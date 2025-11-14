from pathlib import Path
from enum import Enum

#singleton names, and also websocket sources
SERVER_NAME = "server"
SEARCH_QUEUE_NAME = "search_queue"
DOWNLOAD_QUEUE_NAME = "download_queue"
PLAY_QUEUE_NAME = "play_queue"

AUDIO_DATABASE_NAME = "audio_database"
YOUTUBE_CLIENT_NAME = "youtube_client"

#
ROOT_DIR = Path(__file__).resolve().parent.parent
DB_FILE = ROOT_DIR / "backend" / "data" / "audio.db"
DOWNLOAD_DIR = ROOT_DIR / "backend" / "data" / "downloads"



#ytdlp extraction query arguments and core audio formatting
AUDIO_FORMAT_FILTER = "bestaudio/best" #"bestaudio[ext=m4a]/bestaudio/best"
AUDIO_FORMAT = "mp3"
AUDIO_QUALITY = 0 #"192K"
USER_AGENT = "Mozilla/5.0"# (Windows NT 10.0; Win64; x64) ..." #"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
STREAM_CHUNK_SIZE = 1024 * 1024 #1MB

AUDIO_EXTENSIONS = ["wav", "opus", "mp3"] #order matters because it will look for best quality first

#ytdlp search and download handling arguments
SEARCH_LIMIT_DEFAULT = 3
SEARCH_TIMEOUT_DEFAULT = 30
DOWNLOAD_TIMEOUT_DEFAULT = 300

MAX_ATTEMPTS = 3
RETRY_DELAY = 2

