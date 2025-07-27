from pathlib import Path
import subprocess
from typing import List
from backend.core.models.track import Track
import backend.globals as G

def get_audio_path(track: Track) -> Path:
    return G.DOWNLOAD_DIR / f"{track.youtube_id}.{G.AUDIO_FORMAT}"

def is_downloaded(track: Track) -> bool:
    return get_audio_path(track).exists()

def get_audio_size(track: Track) -> int:
    return get_audio_path(track).stat().st_size


def run_subprocess(cmd: List[str], timeout: int) -> subprocess.CompletedProcess:
    """
    Executes a subprocess with the given command and timeout.

    Args:
        cmd (List[str]): The command and arguments to execute.
        timeout (int): Timeout duration in seconds.

    Returns:
        subprocess.CompletedProcess: The result of the subprocess execution.
    """
    return subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True, #log as text not bytes
        check=True, #throw exceptions
        timeout=timeout
    )

