
import re
import json
import subprocess
from pathlib import Path


def get_temp_path(input_path: Path) -> Path:
    """
    Generate a temporary file path for processing.

    Args:
        input_path (Path): Original file path.

    Returns:
        Path: Temporary file path with '.tmp' inserted before the original extension.
              Example: 'haiku.mp3' -> 'haiku.tmp.mp3'
    """
    return input_path.with_suffix(".tmp" + input_path.suffix)


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
            "silenceremove=start_periods=1:start_duration=0:start_threshold=-50dB:detection=peak,"
            "areverse,"
            "silenceremove=start_periods=1:start_duration=0:start_threshold=-50dB:detection=peak,"
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
    
    print("DONE WITH FIRST PASS:")
    print(stats)

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


def convert_to_mp3(input_path: Path):
    """
    Convert a processed WAV file into a compressed MP3 file.
    Uses a temp output file for safety and replaces existing MP3 if needed.

    Parameters
    ----------
    wav_path : Path
        Path to the input WAV file.
    bitrate : str
        Target MP3 bitrate (e.g. '192k', '256k', '320k').

    Returns
    -------
    Path
        The final MP3 file path.
    """