import asyncio
from functools import wraps
import traceback


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
def get_audio_path(
    track_or_id: Union[str, Track], 
    base_dir: Path = None, 
    audio_format: str = None
) -> Path:

    if base_dir is None:
        base_dir = G.DOWNLOAD_DIR
        
    print(">>> CALLING get_audio_path <<<")
    print("incoming audio_format:", audio_format)
    traceback.print_stack(limit=4)

    id = track_or_id.id if isinstance(track_or_id, Track) else track_or_id

    #if asked for specific format, use it
    if audio_format:
        return base_dir / f"{id}.{audio_format}"

    #otherwise detect automatically
    for ext in G.AUDIO_EXTENSIONS:
        candidate = base_dir / f"{id}.{ext}"
        if candidate.exists():
            print(candidate)
            return candidate

    #fallback to mp3
    return base_dir / f"{id}.mp3"
        
def is_downloaded(
    track_or_id: Union[str, Track], 
    base_dir: Path = None, 
    audio_format: str = None
) -> bool:
    return get_audio_path(track_or_id, base_dir, audio_format).exists()

def get_audio_size(
    track_or_id: Union[str, Track], 
    base_dir: Path = None, 
    audio_format: str = None
) -> int:
    return get_audio_path(track_or_id, base_dir, audio_format).stat().st_size


#recursively search for first occurrence of a key in a nested dict json
def find_key(obj, key):
    if isinstance(obj, dict):
        if key in obj:
            return obj[key]
        for v in obj.values():
            result = find_key(v, key)
            if result is not None:
                return result
    elif isinstance(obj, list):
        for item in obj:
            result = find_key(item, key)
            if result is not None:
                return result
    return None