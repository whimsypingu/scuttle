import os
import subprocess
import json
import time
from typing import List

from data_structures import *
from globals import *

os.makedirs(DOWNLOAD_DIR, exist_ok=True)


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


def download_track(track: Track, timeout: int=300) -> bool:
    """
    Downloads a YouTube audio track as an MP3 using yt-dlp.

    Args:
        track (Track): A Track object containing the YouTube video ID.
        timeout (int): Maximum time in seconds to wait for the download.

    Returns:
        bool: True if download was successful, False otherwise.

    Raises:
        subprocess.CalledProcessError: When the yt-dlp subprocess exits with an error status.
        subprocess.TimeoutExpired: When the subprocess exceeds the specified timeout.
    """
    try:
        start_time = time.time()
    
        youtube_id = track.youtube_id
        output_path = os.path.join(DOWNLOAD_DIR, f'{youtube_id}.mp3')

        #cmd line download
        cmd = [
            "yt-dlp",
            "-x", #audio only
            "--audio-format", "mp3",
            "--audio-quality", "192K",
            "--quiet",
            "--no-playlist",
            "-o", os.path.join(DOWNLOAD_DIR, f"{youtube_id}.%(ext)s"), #ytdlp requires temporary format
            f"https://www.youtube.com/watch?v={youtube_id}"
        ]

        result = run_subprocess(cmd, timeout)

        elapsed_time = time.time() - start_time

        #ensure downloaded properly
        if os.path.exists(output_path):
            print(f"Downloaded {youtube_id} in {elapsed_time:.2f}s at {output_path}")
            return True

        else:
            print(f"Download attempted but file not found: {output_path}")
            return False
    
    #catch error
    except subprocess.CalledProcessError as e:
        print(f"Download failed for {youtube_id}: {e}")
        return False
    
    #timeout error
    except subprocess.TimeoutExpired:
        print(f"Download timed out for {youtube_id}")
        return False
    

def search_yt(q: str, limit: int=3, timeout: int=30) -> List[Track]:
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
    try:
        start_time = time.time()

        #cmd line search
        cmd = [
            "yt-dlp",
            f"ytsearch{limit}:{q}",
            "--dump-json",
            "--skip-download"
        ]

        result = run_subprocess(cmd, timeout)

        #parse stdout
        yt_results = []
        for line in result.stdout.strip().split('\n'):

            try:
                data = json.loads(line)
                yt_results.append(
                    Track(
                        data.get("id"),
                        data.get("title", "Unknown Title"),
                        data.get("uploader", "Unknown Uploader"),
                        data.get("duration", 0),
                        #source=SourceType.YOUTUBE
                    )
                )
            except json.JSONDecodeError as je:
                print(f"JSON decode error on line: {line}\nError: {je}")
        
        elapsed_time = time.time() - start_time

        print(f"yt-dlp search for {limit} results on '{q}' took {elapsed_time:.2f} seconds.")
        return yt_results

    #catch error
    except subprocess.CalledProcessError as e:
        print(f"Search failed for {q}: {e}")
        return []
    
    #timeout error
    except subprocess.TimeoutExpired:
        print(f"Search timed out for {q}")
        return []
