from enum import Enum


#backend/core/youtube/client.py
class YouTubeClientAction(str, Enum):
    SEARCH = "search"
    DOWNLOAD = "download"

    ERROR = "error"

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
    SET_METADATA = "set_metadata"

    CREATE_PLAYLIST = "create_playlist"
    UPDATE_PLAYLISTS = "update_playlists"
    EDIT_PLAYLIST = "edit_playlist"
    DELETE_PLAYLIST = "delete_playlist"

    #dont change the frontend received versions, yet
    REGISTER_TRACK = "log_track"
    UNREGISTER_TRACK = "unlog_track"
    
    REGISTER_DOWNLOAD = "log_download"
    UNREGISTER_DOWNLOAD = "unlog_download"


    GET_DOWNLOADS_CONTENT = "get_downloads_content"

    SEARCH = "search"
    FETCH_LIKES = "fetch_likes"

    GET_ALL_PLAYLISTS = "get_all_playlists"
    GET_PLAYLIST_CONTENT = "get_playlist_content"
