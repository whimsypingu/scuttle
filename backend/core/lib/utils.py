import traceback


from pathlib import Path
from backend.core.models.track import Track
import backend.globals as G
from typing import Union

#handles both Track and Track.id
def get_audio_path(
    id: str, 
    base_dir: Path = None, 
    audio_format: str = None
) -> Path:

    if base_dir is None:
        base_dir = G.DOWNLOAD_DIR

    #if asked for specific format, use it
    if audio_format:
        return base_dir / f"{id}.{audio_format}"

    #otherwise detect automatically
    for ext in G.AUDIO_EXTENSIONS:
        candidate = base_dir / f"{id}.{ext}"
        if candidate.exists():
            return candidate

    #fallback to mp3
    return base_dir / f"{id}.mp3"
        
def is_downloaded(
    id: str, 
    base_dir: Path = None, 
    audio_format: str = None
) -> bool:
    return get_audio_path(id, base_dir, audio_format).exists()

def get_audio_size(
    id: str, 
    base_dir: Path = None, 
    audio_format: str = None
) -> int:
    return get_audio_path(id, base_dir, audio_format).stat().st_size


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


import unicodedata
import re

_substitutions = {
    "$": "s",
    "&": "and",
    "*": "vzyxv", #random unlikely string
    "'": "",
}
_whitespace_pattern = re.compile(r"\s+")
_punct_pattern = re.compile(r"[^\w\s]+")

def normalize_for_search(text: str) -> str:
    if not text:
        return ""

    #unicode cleanup
    text = unicodedata.normalize("NFKD", text)
    text = "".join([c for c in text if not unicodedata.combining(c)])
    text = text.lower()

    for key, val in _substitutions.items():
        text = text.replace(key, val)

    #final cleanup
    text = _punct_pattern.sub(" ", text) # Replace punct with space to avoid merging words
    text = _whitespace_pattern.sub(" ", text)
    return text.strip()



#bigrammed sorensen-dice set comparison
def get_bigrams(text):
    return set(text[i:i+2] for i in range(len(text)-1))

def dice_coefficient(a, b):
    set_a = get_bigrams(a)
    set_b = get_bigrams(b)
    
    intersection = len(set_a & set_b)
    union = len(set_a) + len(set_b)
    
    if union == 0: return 0
    return (2.0 * intersection) / union

