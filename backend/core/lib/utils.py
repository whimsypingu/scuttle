import asyncio
from functools import wraps

#turns something async
def run_in_executor(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        loop = asyncio.get_running_loop()
        # run func(*args, **kwargs) in default thread pool
        return await loop.run_in_executor(None, lambda: func(*args, **kwargs))
    return wrapper


from pathlib import Path
from backend.core.models.track import Track
import backend.globals as G

def get_audio_path(track: Track, base_dir: Path = G.DOWNLOAD_DIR, audio_format: str = G.AUDIO_FORMAT) -> Path:
    return base_dir / f"{track.youtube_id}.{audio_format}"

def is_downloaded(track: Track, base_dir: Path = G.DOWNLOAD_DIR, audio_format: str = G.AUDIO_FORMAT) -> bool:
    return get_audio_path(track=track, base_dir=base_dir, audio_format=audio_format).exists()

def get_audio_size(track: Track, base_dir: Path = G.DOWNLOAD_DIR, audio_format: str = G.AUDIO_FORMAT) -> int:
    return get_audio_path(track=track, base_dir=base_dir, audio_format=audio_format).stat().st_size()
