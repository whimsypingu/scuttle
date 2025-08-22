import pytest
from pathlib import Path
from backend.core.lib.utils import get_audio_path
from backend.core.models.track import Track
from backend.core.youtube.client import YouTubeClient 

#pip install pytest, pip install pytest-asyncio

@pytest.mark.asyncio
async def test_download_success(tmp_path: Path):
    client = YouTubeClient(
        name="test",
        base_dir=tmp_path,
        dl_format="mp3"
    )

    track = Track(
        youtube_id="dQw4w9WgXcQ",  # Rickroll for test
        title="Rick Astley - Never Gonna Give You Up",
        uploader="RickAstleyVEVO",
        duration=213
    )

    result = await client.robust_download(track=track)

    audio_path = get_audio_path(track=track, base_dir=tmp_path)

    assert result is True
    assert audio_path.exists()  
    assert audio_path.suffix == ".mp3"
    assert audio_path.stat().st_size > 00


@pytest.mark.asyncio
async def test_search_success(tmp_path: Path):
    client = YouTubeClient(
        name="test",
        base_dir=tmp_path
    )

    query = "rick astley never gonna give you up"

    results = await client.robust_search(q=query)

    assert results, "Search returned no results"
    assert len(results) == 3, f"Epected 3 results, got {len(results)}"

    for i, track in enumerate(results):
        assert isinstance(track, Track), f"Result {i} is not a Track"



