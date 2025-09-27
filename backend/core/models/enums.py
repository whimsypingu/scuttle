from enum import Enum


#backend/core/youtube/client.py
class YouTubeClientAction(str, Enum):
    SEARCH = "search"
    DOWNLOAD = "download"

    START = "task_start"
    FINISH = "task_finish"


#backend/core/queue/implementations/download_queue.py
class DownloadQueueAction(str, Enum):
    SET_FIRST = "set_first"
    INSERT_NEXT = "insert_next"
    PUSH = "push"
    POP = "pop"
    REMOVE = "remove"
    SEND_CONTENT = "send_content"


#backend/core/queue/implementations/play_queue.py
class PlayQueueAction(str, Enum):
    CLEAR = "clear"
    SET_ALL = "set_all"
    SET_FIRST = "set_first"
    INSERT_NEXT = "insert_next"
    PUSH = "push"
    POP = "pop"
    REMOVE = "remove"
    SEND_CONTENT = "send_content"


#backend/core/database/audio_database.py
class AudioDatabaseAction(str, Enum):
    SEARCH = "search"

    FETCH_LIKES = "fetch_likes"

    CREATE_PLAYLIST = "create_playlist"
    
    GET_ALL_PLAYLISTS = "get_all_playlists"
    GET_PLAYLIST_CONTENT = "get_playlist_content"

    ADD_TO_PLAYLIST = "add_to_playlist"
