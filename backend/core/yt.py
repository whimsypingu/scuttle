import subprocess
import json
import time
import logging
from typing import List
from pathlib import Path

from backend.core.filter import select_best_track
from backend.core.audio import get_audio_path, get_audio_size
from backend.exceptions import NoSearchResultsError, DownloadFailedError, SearchFailedError
from backend.data_structures import Track
import backend.globals as G

logger = logging.getLogger(__name__)


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


def download_track_yt(track: Track, timeout: int=G.DOWNLOAD_TIMEOUT_DEFAULT, max_attempts: int=G.MAX_ATTEMPTS, retry_delay: int=G.RETRY_DELAY) -> None:
    """
    Downloads a YouTube audio track as an MP3 using yt-dlp.

    Args:
        track (Track): A Track object containing the YouTube video ID.
        timeout (int): Maximum time in seconds to wait for the download.

    Returns:
        None if download was successful, raises exception on failure.

    Raises:
        subprocess.CalledProcessError: When the yt-dlp subprocess exits with an error status.
        subprocess.TimeoutExpired: When the subprocess exceeds the specified timeout.
    """
    #prepares cmd line arguments
    youtube_id = track.youtube_id
    output_path = get_audio_path(youtube_id)

    temp_path = Path(G.DOWNLOAD_DIR) / f"{youtube_id}.%(ext)s"

    #cmd line download
    cmd = [
        "yt-dlp",
        "-x", #audio only
        "-f", G.AUDIO_FORMAT_FILTER, #defeat SABR fragmentation potentially
        "--audio-format", G.AUDIO_FORMAT,
        "--audio-quality", G.AUDIO_QUALITY,
        "--user-agent", G.USER_AGENT,
        "--quiet",
        "--no-playlist",
        "-o", str(temp_path), #ytdlp requires temporary format
        G.YOUTUBE_VIDEO_URL.format(youtube_id)
    ]

    #retry on failure
    for attempt in range(1, max_attempts + 1):
        try:
            start_time = time.time()
            run_subprocess(cmd, timeout)
            elapsed_time = time.time() - start_time

            #ensure downloaded properly
            if not output_path.exists() or get_audio_size(youtube_id) == 0:
                raise DownloadFailedError(f"ytdlp succeeded but output file missing or empty: {output_path}")
            
            logger.info(f"Downloaded {youtube_id} in {elapsed_time:.2f}s at {output_path}")
            return None
        
        #catch error
        except subprocess.CalledProcessError as e:
            logger.error(f"Download failed for {youtube_id}: {e}")
            if attempt < max_attempts:
                logger.warning(f"Download failed for {youtube_id} attempt number {attempt}. Retrying...")
                time.sleep(retry_delay)
            else:
                raise DownloadFailedError(f"Download failed for {youtube_id}") from e
        
        #timeout error
        except subprocess.TimeoutExpired as e:
            logger.error(f"Download timed out for {youtube_id}: {e}")
            raise DownloadFailedError(f"Download timed out for {youtube_id}") from e
    

def search_yt(q: str, limit: int=G.SEARCH_LIMIT_DEFAULT, timeout: int=G.SEARCH_TIMEOUT_DEFAULT, max_attempts: int=G.MAX_ATTEMPTS, retry_delay: int=G.RETRY_DELAY) -> List[Track]:
    """
    Performs a YouTube search using yt-dlp and returns a list of matching tracks.

    Args:
        q (str): Search query string.
        limit (int): Number of search results to return.
        timeout (int): Timeout in seconds for the search subprocess.

    Returns:
        List[Track]: A list of Track objects.

    Raises:
        subprocess.CalledProcessError: When the yt-dlp subprocess exits with an error status.
        subprocess.TimeoutExpired: When the subprocess exceeds the specified timeout.
    """
    #cmd line search
    cmd = [
        "yt-dlp",
        "--format", G.AUDIO_FORMAT_FILTER, #defeat SABR fragmentation streaming from yt, GitHub issue 12482
        f"ytsearch{limit}:{q}",
        "--user-agent", G.USER_AGENT,
        "--dump-json",
        "--skip-download"
    ]

    print(f"Running command: {' '.join(cmd)}")

    #retry on failure
    for attempt in range(1, max_attempts + 1):
        try:
            start_time = time.time()    
            result = run_subprocess(cmd, timeout)
            elapsed_time = time.time() - start_time

            #parse stdout
            yt_results = []
            raw_lines = result.stdout.strip().split('\n')

            if not raw_lines or all(not line.strip() for line in raw_lines):
                logger.warning(f"No output received from yt-dlp for query: '{q}'")
                return []

            for line in raw_lines:
                try:
                    data = json.loads(line)
                    yt_results.append(
                        Track(
                            youtube_id=data.get("id"),
                            title=data.get("title", "Unknown Title"),
                            uploader=data.get("uploader", "Unknown Uploader"),
                            duration=data.get("duration", 0),
                        )
                    )
                except json.JSONDecodeError as je:
                    logger.warning(f"JSON decode error on line: {line}\nError: {je}")

            logger.info(f"yt-dlp search for {limit} results on '{q}' took {elapsed_time:.2f} seconds.")
            return yt_results

        #catch error
        except subprocess.CalledProcessError as e:    
            logger.error(f"Search failed for {q}: {e.stderr}")
            if attempt < max_attempts:
                logger.warning(f"Search failed for {q} attempt number {attempt}. Retrying...")
                time.sleep(retry_delay)
            else:
                raise SearchFailedError(f"Search failed for {q}") from e
            
        #timeout error
        except subprocess.TimeoutExpired as e:
            logger.error(f"Search timed out for {q}: {e}")
            raise SearchFailedError(f"Search timed out for {q}") from e


def best_result_yt(q: str, limit: int=G.SEARCH_LIMIT_DEFAULT, timeout: int=G.SEARCH_TIMEOUT_DEFAULT, max_attempts: int=G.MAX_ATTEMPTS, retry_delay: int=G.RETRY_DELAY) -> Track:
    """
    Performs a YouTube search and returns the best matching result.

    Args:
        q (str): Search query.
        limit (int): Number of candidates to consider from yt-dlp.
        timeout (int): Timeout (in seconds) for the yt-dlp subprocess.

    Returns:
        Track: The most relevant track selected from the search results.

    Raises:
        NoSearchResultsError: If no results are returned from the youtube search.
    """
    yt_results = search_yt(q, limit=limit, timeout=timeout, max_attempts=max_attempts, retry_delay=retry_delay)

    if not yt_results:
        raise NoSearchResultsError(f"No yt results found for query: '{q}'")

    return select_best_track(q, yt_results)

