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
from typing import Union

#handles both Track and Track.id
def get_audio_path(track_or_id: Union[str, Track], base_dir: Path = G.DOWNLOAD_DIR, audio_format: str = G.AUDIO_FORMAT) -> Path:
    id = track_or_id.id if isinstance(track_or_id, Track) else track_or_id
    return base_dir / f"{id}.{audio_format}"

def is_downloaded(track_or_id: Union[str, Track], base_dir: Path = G.DOWNLOAD_DIR, audio_format: str = G.AUDIO_FORMAT) -> bool:
    return get_audio_path(track_or_id, base_dir, audio_format).exists()

def get_audio_size(track_or_id: Union[str, Track], base_dir: Path = G.DOWNLOAD_DIR, audio_format: str = G.AUDIO_FORMAT) -> int:
    return get_audio_path(track_or_id, base_dir, audio_format).stat().st_size
