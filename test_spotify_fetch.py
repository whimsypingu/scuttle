# test_spotify_fetch.py

from backend.core.playlists.implementations.spotify_playlist_ext import SpotifyPlaylistExtractor
from backend.core.playlists.manager import PlaylistExtractorManager


x = PlaylistExtractorManager()

url = "https://open.spotify.com/playlist/1Qw9TOwrabuxluP08Qsx97?si=3NAEqgBNRZW2nMrunsuiBg&pi=kq9EXMeBRIuEr&nd=1&dlsi=3cc87dfe883f4c20"
print(x.fetch_data(url))

url2 = "https://hello-world.com/"
print(x.fetch_data(url2))

url3 = "https://open.spotify.com/playlist/3Q1eF1HTFBrKoXK5MZcloP?si=GedkvF4pTraU5Yj9NvwyJw&pi=fAg7j1ABQfebt"
print(x.fetch_data(url3))