
import re
import json
import subprocess
from pathlib import Path


def get_temp_path(input_path: Path) -> Path:
    return input_path.with_suffix(".tmp" + input_path.suffix)


def replace_file_safely(input_path: Path, temp_path: Path):
    input_path.unlink()                 #remove original
    temp_path.rename(input_path)        #move temp to original


def trim_silence(input_path: Path):
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





# --- TEST ---
folder = Path("TESTING")
input_file = folder / "haiku.mp3"

trim_silence(input_file)
apply_loudnorm(input_file)