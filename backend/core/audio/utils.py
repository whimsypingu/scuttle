from pathlib import Path
from backend.data_structures import Track
import backend.globals as G

def get_audio_path(track: Track) -> Path:
    return G.DOWNLOAD_DIR / f"{track.youtube_id}.{G.AUDIO_FORMAT}"

def is_downloaded(track: Track) -> bool:
    return get_audio_path(track).exists()

def get_audio_size(track: Track) -> int:
    return get_audio_path(track).stat().st_size