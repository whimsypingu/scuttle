
import re
import json
import os
import subprocess
from pathlib import Path
from typing import Optional


class AudioProcessor:
    def __init__(
        self,
        ffmpeg_bin: Optional[str] = None,
        ffprobe_bin: Optional[str] = None,
    ):
        #handle binaries from tools/ to use yt-dlp
        self.ffmpeg_bin = ffmpeg_bin or os.getenv("FFMPEG_BIN_PATH")
        self.ffprobe_bin = ffprobe_bin or os.getenv("FFPROBE_BIN_PATH")

    #private utilities
    def _execute(self, cmd: list, capture: bool = False):
        """Internal helper to run subprocesses with the correct encoding/errors."""
        try:
            return subprocess.run(
                cmd, 
                check=True, 
                capture_output=capture, 
                text=True, 
                encoding="utf-8", 
                errors="replace"
            )
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"AudioProcessor command failed: {e.stderr}")


    def _get_temp_path(self, path: Path) -> Path:
        """
        Generate a temporary file path for processing.

        Args:
            input_path (Path): Original file path.

        Returns:
            Path: Temporary file path with '.tmp' inserted before the original extension.
                Example: 'haiku.mp3' -> 'haiku.tmp.mp3'
        """
        return path.with_name(f"{path.stem}.tmp{path.suffix}")


    def _replace_file(self, original: Path, temp: Path):
        """
        Replace the original file with a processed temporary file.

        Args:
            input_path (Path): Original file path.
            temp_path (Path): Path to processed temporary file.

        Notes:
            - Deletes the original file.
            - Renames the temp file to the original path.
        """
        if original.exists(): original.unlink()
        temp.rename(original)


    def get_duration(self, file_path: Path) -> float:
        """
        Get the duration of an audio file in seconds using ffprobe.

        Parameters
        ----------
        file_path : Path
            Path to the audio file.

        Returns
        -------
        float
            Duration of the file in seconds.
        """
        cmd = [
            self.ffprobe_bin, 
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(file_path)
        ]
        result = self._execute(cmd, capture=True)
        return float(result.stdout.strip())


    def trim_silence(self, input_path: Path):
        """
        Remove silence from the beginning and end of an audio file using FFmpeg.

        Args:
            input_path (Path): Path to the audio file to process.

        Returns:
            Path: Path to the processed audio file (original file replaced).

        Notes:
            - Uses the 'silenceremove' FFmpeg filter in forward and reverse directions.
            - Creates a temporary file for processing to avoid overwriting original prematurely.
        """
        temp_path = self._get_temp_path(input_path)
        cmd = [
            self.ffmpeg_bin, "-y", 
            "-i", str(input_path), 
            "-af", 
            (
                "silenceremove=start_periods=1:start_duration=0.02:start_threshold=-50dB:detection=peak,"
                "areverse,"
                "silenceremove=start_periods=1:start_duration=0.02:start_threshold=-50dB:detection=peak,"
                "areverse"
            ),
            str(temp_path)
        ]
        self._execute(cmd)
        self._replace_file(input_path, temp_path)
        return input_path


    def apply_loudnorm(self, input_path: Path, target_i=-16):
        """
        Apply two-pass loudness normalization to an audio file using FFmpeg's loudnorm filter.

        Args:
            input_path (Path): Path to the audio file to normalize.

        Returns:
            Path: Path to the processed audio file (original file replaced).

        Notes:
            - First pass analyzes the file and prints loudness stats to JSON (captured from stderr).
            - Second pass applies loudnorm filter with measured stats.
            - Creates a temporary file for processing and replaces the original after completion.
            - Targets: Integrated Loudness (I=-16 LUFS), True Peak (TP=-1.5 dB), Loudness Range (LRA=11 LU).
        """
        #perform two pass loudnorm
        #https://k.ylo.ph/2016/04/04/loudnorm.html
        temp_path = self._get_temp_path(input_path)
        
        cmd_analyze = [
            self.ffmpeg_bin, 
            "-i", str(input_path),
            "-af", 
            f"loudnorm=I={target_i}:TP=-1.5:LRA=11:print_format=json",
            "-f", "null", "-"
        ]
        result = self._execute(cmd_analyze, capture=True)
        
        #https://stackoverflow.com/questions/71791529/ffmpeg-loudnorm-reading-json-data
        #bruh you have to extract from stderr
        match = re.search(r"\{[\s\S]*\}", result.stderr)
        if not match: 
            raise RuntimeError("Loudnorm analysis failed")
        
        stats = json.loads(match.group())

        #build filter for second pass using extracted stats
        loudnorm_filter = (
            f"loudnorm=I=-16:TP=-1.5:LRA=11:"
            f"measured_I={stats['input_i']}:"
            f"measured_TP={stats['input_tp']}:"
            f"measured_LRA={stats['input_lra']}:"
            f"measured_thresh={stats['input_thresh']}:"
            f"offset={stats['target_offset']}"
        )
        cmd_apply = [
            self.ffmpeg_bin, "-y", 
            "-i", str(input_path), 
            "-af", 
            loudnorm_filter, 
            str(temp_path)
        ]
        self._execute(cmd_apply)
        self._replace_file(input_path, temp_path)
        return input_path


    def compress(self, input_path: Path, format="opus", bitrate="192k"):
        """
        Convert a WAV (or other uncompressed) file into a compressed target format (MP3, Opus, etc.)
        Uses a temporary file for safety and replaces the original if needed.

        In blind tests opus seems to be the best audio file type: 
        https://hydrogenaudio.org/index.php/topic,117489.0.html

        Parameters
        ----------
        input_path : Path
            Path to the input audio file (WAV recommended).
        target_format : str
            Target audio format (e.g., 'mp3', 'opus').
        bitrate : str
            Target bitrate for lossy formats (e.g., '256k', '192k').

        Returns
        -------
        Path
            Path to the final compressed file.

        Notes:
            - I'm pretty sure it's a good idea to set bitrate according to codec, opus -> 192k, libmp3lame -> 256k
        """
        target_path = input_path.with_suffix(f".{format}")
        codec = "libopus" if format in ("opus", "webm") else "libmp3lame"
        
        cmd = [
            self.ffmpeg_bin, "-y", 
            "-i", str(input_path),
            "-c:a", codec, 
            "-b:a", bitrate, 
            str(target_path)
        ]
        self._execute(cmd)
        input_path.unlink()
        return target_path


'''
def get_temp_path(input_path: Path) -> Path:
    """
    Generate a temporary file path for processing.

    Args:
        input_path (Path): Original file path.

    Returns:
        Path: Temporary file path with '.tmp' inserted before the original extension.
              Example: 'haiku.mp3' -> 'haiku.tmp.mp3'
    """
    stem = input_path.stem  #filename without last suffix
    return input_path.with_name(stem + ".tmp" + input_path.suffix)


def replace_file_safely(input_path: Path, temp_path: Path):
    """
    Replace the original file with a processed temporary file.

    Args:
        input_path (Path): Original file path.
        temp_path (Path): Path to processed temporary file.

    Notes:
        - Deletes the original file.
        - Renames the temp file to the original path.
    """
    input_path.unlink()                 #remove original
    temp_path.rename(input_path)        #move temp to original


def trim_silence(input_path: Path):
    """
    Remove silence from the beginning and end of an audio file using FFmpeg.

    Args:
        input_path (Path): Path to the audio file to process.

    Returns:
        Path: Path to the processed audio file (original file replaced).

    Notes:
        - Uses the 'silenceremove' FFmpeg filter in forward and reverse directions.
        - Creates a temporary file for processing to avoid overwriting original prematurely.
    """
    temp_path = get_temp_path(input_path)
    cmd = [
        "ffmpeg", "-y",
        "-i", str(input_path),
        "-af",
        (
            "silenceremove=start_periods=1:start_duration=0.02:start_threshold=-50dB:detection=peak,"
            "areverse,"
            "silenceremove=start_periods=1:start_duration=0.02:start_threshold=-50dB:detection=peak,"
            "areverse"
        ),
        str(temp_path)
    ]
    subprocess.run(cmd, check=True)

    #delete tmp file
    replace_file_safely(input_path, temp_path)

    return input_path


def apply_loudnorm(input_path: Path):
    """
    Apply two-pass loudness normalization to an audio file using FFmpeg's loudnorm filter.

    Args:
        input_path (Path): Path to the audio file to normalize.

    Returns:
        Path: Path to the processed audio file (original file replaced).

    Notes:
        - First pass analyzes the file and prints loudness stats to JSON (captured from stderr).
        - Second pass applies loudnorm filter with measured stats.
        - Creates a temporary file for processing and replaces the original after completion.
        - Targets: Integrated Loudness (I=-16 LUFS), True Peak (TP=-1.5 dB), Loudness Range (LRA=11 LU).
    """
    #perform two pass loudnorm
    #https://k.ylo.ph/2016/04/04/loudnorm.html
    temp_path = get_temp_path(input_path)
    cmd = [
        "ffmpeg",
        "-i", str(input_path),
        "-af",
        "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json",
        "-f", "null", "-"
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)

    #https://stackoverflow.com/questions/71791529/ffmpeg-loudnorm-reading-json-data
    #bruh you have to extract from stderr
    match = re.search(r"\{[\s\S]*\}", result.stderr)
    if not match:
        raise RuntimeError("Failed to parse loudnorm stats")
    
    stats = json.loads(match.group())
    
    #print("DONE WITH FIRST PASS:")
    #print(stats)

    #build filter for second pass using extracted stats
    loudnorm_filter = (
        f"loudnorm=I=-16:TP=-1.5:LRA=11:"
        f"measured_I={stats['input_i']}:"
        f"measured_TP={stats['input_tp']}:"
        f"measured_LRA={stats['input_lra']}:"
        f"measured_thresh={stats['input_thresh']}:"
        f"offset={stats['target_offset']}"
    )
    cmd = [
        "ffmpeg",
        "-i", str(input_path),
        "-af",
        loudnorm_filter,
        str(temp_path)
    ]
    subprocess.run(cmd, check=True)
    
    replace_file_safely(input_path, temp_path)

    return input_path




def compress_audio(input_path: Path, target_format: str = None, bitrate: str = None) -> Path:
    """
    Convert a WAV (or other uncompressed) file into a compressed target format (MP3, Opus, etc.)
    Uses a temporary file for safety and replaces the original if needed.

    In blind tests opus seems to be the best audio file type: 
    https://hydrogenaudio.org/index.php/topic,117489.0.html

    Parameters
    ----------
    input_path : Path
        Path to the input audio file (WAV recommended).
    target_format : str
        Target audio format (e.g., 'mp3', 'opus').
    bitrate : str
        Target bitrate for lossy formats (e.g., '256k', '192k').

    Returns
    -------
    Path
        Path to the final compressed file.
    """
    target_path = input_path.with_suffix(f".{target_format}")

    #determine codec based on format
    if target_format.lower() in ("opus", "webm"):
        codec = "libopus"

        if bitrate is None:
            bitrate = "192k"

    #default to mp3 codec if none provided
    else:
        codec = "libmp3lame"

        if bitrate is None:
            bitrate = "256k"

    cmd = [
        "ffmpeg",
        "-y",
        "-i", str(input_path),
        "-c:a", codec,
        "-b:a", bitrate,
        str(target_path)
    ]

    subprocess.run(cmd, check=True)

    #remove original wav file
    if target_path.exists():
        input_path.unlink()

    return target_path

def extract_duration(file_path: Path) -> float:
    """
    Get the duration of an audio file in seconds using ffprobe.

    Parameters
    ----------
    file_path : Path
        Path to the audio file.

    Returns
    -------
    float
        Duration of the file in seconds.

    Raises
    ------
    RuntimeError
        If ffprobe fails or cannot parse the duration.
    """
    cmd = [
        "ffprobe",
        "-v", "error",           # suppress non-error messages
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(file_path)
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffprobe failed: {result.stderr.strip()}")

    try:
        return float(result.stdout.strip())
    except ValueError:
        raise RuntimeError(f"Failed to parse duration: {result.stdout.strip()}")
    
    def get_duration(self, file_path: Path) -> float:
        cmd = [
            self.ffprobe, 
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(file_path)
        ]
        result = self._execute(cmd, capture=True)
        return float(result.stdout.strip())
'''