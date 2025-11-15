import pytest
from pathlib import Path
from backend.core.lib.utils import get_audio_path
from backend.core.models.track import Track
from backend.core.youtube.client import YouTubeClient 
import os

#pip install pytest, pip install pytest-asyncio. in venv\Scripts\activate.bat set PYTHONPATH=C:\rootdir, consider swapping to pip install -e
#python -m pip install -U yt-dlp. for breakages

@pytest.mark.asyncio
async def test_download_by_id(tmp_path: Path):
    client = YouTubeClient(
        name="test",
        base_dir=tmp_path,
        dl_format="mp3"
    )

    # track = Track(
    #     id="dQw4w9WgXcQ",  # Rickroll for test
    #     title="Rick Astley - Never Gonna Give You Up",
    #     artist="RickAstleyVEVO",
    #     duration=213
    # )
    id = "dQw4w9WgXcQ"

    track = await client.download_by_id(id)

    audio_path = get_audio_path(id=id, base_dir=tmp_path)
    
    print(f"Contents of {tmp_path}:")
    for f in os.listdir(tmp_path):
        file_path = tmp_path / f
        if file_path.is_file():
            print(f" - {f} | size: {file_path.stat().st_size} bytes | suffix: {file_path.suffix}")

    assert isinstance(track, Track), "Download by query failed"
    assert audio_path.exists(), "Audio file was not created"
    assert audio_path.suffix == ".mp3", "Downloaded file has wrong extension"
    assert audio_path.stat().st_size > 0, "Downloaded file is empty"


@pytest.mark.asyncio
async def test_download_by_query(tmp_path: Path):
    client = YouTubeClient(
        name="test",
        base_dir=tmp_path,
        dl_format="mp3"
    )

    query = "rick astley never gonna give you up"

    track = await client.download_by_query(q=query)

    search_results = await client.search(q=query, limit=1)
    assert search_results, "Search returned no results"
    expected_track = search_results[0]

    audio_path = get_audio_path(id=track.id, base_dir=tmp_path, audio_format="mp3")

    assert isinstance(track, Track), "Download by query failed"
    assert audio_path.exists(), "Audio file was not created"
    assert audio_path.suffix == ".mp3", "Downloaded file has wrong extension"
    assert audio_path.stat().st_size > 0, "Downloaded file is empty"


@pytest.mark.asyncio
async def test_search(tmp_path: Path):
    client = YouTubeClient(
        name="test",
        base_dir=tmp_path
    )

    query = "rick astley never gonna give you up"

    results = await client.search(q=query)

    assert results, "Search returned no results"
    assert len(results) == 3, f"Expected 3 results, got {len(results)}"

    for i, track in enumerate(results):
        assert isinstance(track, Track), f"Result {i} is not a Track"



