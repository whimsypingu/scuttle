import pytest
from backend.core.playlists.manager import PlaylistExtractorManager

#pip install pytest, pip install pytest-asyncio. in venv\Scripts\activate.bat set PYTHONPATH=C:\rootdir, consider swapping to pip install -e
#python -m pip install -U yt-dlp. for breakages

@pytest.mark.asyncio
async def test_spotify_full_url():
    manager = PlaylistExtractorManager()

    spotify_playlist_url = "https://open.spotify.com/playlist/3neOUFiSw5j7DVOzesUhh8"

    #fetch data from Spotify
    data = manager.fetch_data(spotify_playlist_url)
    print(data)

    assert isinstance(data, list), "fetch_data() did not return a list"
    assert len(data) > 0, "Playlist returned no tracks"



@pytest.mark.asyncio
async def test_spotify_short_share_link():
    manager = PlaylistExtractorManager()

    spotify_playlist_url = "https://spotify.link/Gy55yym9CXb"

    #fetch data from Spotify
    data = manager.fetch_data(spotify_playlist_url)
    print(data)

    assert isinstance(data, list), "fetch_data() did not return a list"
    assert len(data) > 0, "Playlist returned no tracks"
