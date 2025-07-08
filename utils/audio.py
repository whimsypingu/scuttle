from pathlib import Path
import globals as G

def get_audio_path(youtube_id: str) -> Path:
    return G.DOWNLOAD_DIR / f"{youtube_id}.{G.AUDIO_FORMAT}"

def audio_exists(youtube_id: str) -> bool:
    return get_audio_path(youtube_id).exists()

def get_audio_size(youtube_id: str) -> int:
    return get_audio_path(youtube_id).stat().st_size
