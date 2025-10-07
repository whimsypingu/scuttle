# test_spotify_fetch.py

from backend.core.playlists.implementations.spotify_playlist_ext import SpotifyPlaylistExtractor
from backend.core.playlists.manager import PlaylistExtractorManager


x = PlaylistExtractorManager()

url = "https://open.spotify.com/playlist/1Qw9TOwrabuxluP08Qsx97?si=3NAEqgBNRZW2nMrunsuiBg&pi=kq9EXMeBRIuEr&nd=1&dlsi=3cc87dfe883f4c20"
print(x.fetch_data(url))

url2 = "https://hello-world.com/"
print(x.fetch_data(url2))