from pathlib import Path

#logic
DOWNLOAD_QUEUE = "download_queue"
TRACK_QUEUE = "track_queue"

#database
DATA_DIR = Path("data")
DB_FILE = DATA_DIR / "music.db"

DB_TRACKS_TABLENAME = "tracks" #do not make dynamic to avoid sql injection
DB_DOWNLOADS_TABLENAME = "downloads"
DB_CACHE_TABLENAME = "cache"

YOUTUBE_VIDEO_URL = "https://www.youtube.com/watch?v={}"

#ytdlp extraction query arguments
AUDIO_FORMAT_FILTER = "bestaudio[ext=m4a]/bestaudio/best"
AUDIO_FORMAT = "mp3"
AUDIO_QUALITY = "192K"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"

#ytdlp search and download handling arguments
SEARCH_LIMIT_DEFAULT = 3
SEARCH_TIMEOUT_DEFAULT = 30
DOWNLOAD_TIMEOUT_DEFAULT = 300

MAX_ATTEMPTS = 3
RETRY_DELAY = 2

#files
DOWNLOAD_DIR = Path("downloads")
