import sqlite3
import logging
from typing import List

from exceptions import TrackInsertError, CachingFailError, DownloadLogFailError
from data_structures import Track
import globals as G

logger = logging.getLogger(__name__)


def delete_db():
    """
    Deletes the entire database file from disk.
    """
    if G.DB_FILE.exists():
        G.DB_FILE.unlink()
        logger.info(f"Deleted database: {G.DB_FILE}")
    else:
        logger.info(f"Database file '{G.DB_FILE}' does not exist.")


def init_db():
    #create DB file if it doesn't exist
    if not G.DB_FILE.exists():
        conn = sqlite3.connect(G.DB_FILE)

        #enable foreign key constraints
        conn.execute("PRAGMA foreign_keys = ON;")
        c = conn.cursor()

        #create tracks table
        c.execute(f'''
            CREATE TABLE {G.DB_TRACKS_TABLENAME} (
                youtube_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                uploader TEXT,
                duration INTEGER
            );
        ''')

        #create downloads table
        c.execute(f'''
            CREATE TABLE {G.DB_DOWNLOADS_TABLENAME} (
                youtube_id TEXT PRIMARY KEY,
                downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (youtube_id) REFERENCES {G.DB_TRACKS_TABLENAME}(youtube_id) ON DELETE CASCADE
            );
        ''')

        #create cache table
        c.execute(f'''
            CREATE TABLE {G.DB_CACHE_TABLENAME} (
                youtube_id TEXT PRIMARY KEY,
                cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (youtube_id) REFERENCES {G.DB_TRACKS_TABLENAME}(youtube_id) ON DELETE CASCADE
            );
        ''')

        conn.commit()
        conn.close()
        logger.info(f"Created new database: {G.DB_FILE}")
    else:
        logger.info(f"Database already exists: {G.DB_FILE}")



def view_db():
    print(f"Viewing database: {G.DB_FILE}")

    conn = sqlite3.connect(G.DB_FILE)
    c = conn.cursor()

    print(f"---\nTABLE: {G.DB_TRACKS_TABLENAME}")
    for row in c.execute(f"SELECT * FROM {G.DB_TRACKS_TABLENAME}"):
        print(row)

    print(f"---\nTABLE: {G.DB_DOWNLOADS_TABLENAME}")
    for row in c.execute(f"SELECT * FROM {G.DB_DOWNLOADS_TABLENAME}"):
        print(row)

    print(f"---\nTABLE: {G.DB_CACHE_TABLENAME}")
    for row in c.execute(f"SELECT * FROM {G.DB_CACHE_TABLENAME}"):
        print(row)

    print("---")
    conn.close()



def insert_track_db(track: Track) -> None:
    """
    Inserts a track into the tracks table if it doesn't exist.

    Raises:
        TrackInsertError: if insertion into the tracks table fails.
    """
    youtube_id, title, uploader, duration = (
        track.youtube_id, track.title, track.uploader, track.duration
    )

    try:
        with sqlite3.connect(G.DB_FILE) as conn:
            conn.execute("PRAGMA foreign_keys = ON;")
            c = conn.cursor()

            #insert into tracks (ignore if already exists)
            c.execute(f'''
                INSERT OR IGNORE INTO {G.DB_TRACKS_TABLENAME} (youtube_id, title, uploader, duration)
                VALUES (?, ?, ?, ?)
            ''', (youtube_id, title, uploader, duration))

            conn.commit()
            logger.info(f"Logged track: {title}")

    except sqlite3.Error as e:
        logger.error(f"SQLite error while inserting track '{youtube_id}': {e}")
        raise TrackInsertError(f"Insertion failed for {youtube_id}") from e



def cache_track_db(track: Track) -> None:
    """
    Adds a track to the tracks table if it doesn't exist,
    and logs the access in the cache table.

    Raises:
        CachingFailError: if a database error occurs while caching.
    """
    youtube_id, title, uploader, duration = (
        track.youtube_id, track.title, track.uploader, track.duration
    )

    try:
        with sqlite3.connect(G.DB_FILE) as conn:
            conn.execute("PRAGMA foreign_keys = ON;")
            c = conn.cursor()

            #always insert into cache (even if already in tracks)
            c.execute(f'''
                INSERT INTO {G.DB_CACHE_TABLENAME} (youtube_id, cached_at)
                VALUES (?, CURRENT_TIMESTAMP)
                ON CONFLICT(youtube_id) DO UPDATE SET cached_at = CURRENT_TIMESTAMP
            ''', (youtube_id,))

            conn.commit()
            logger.info(f"Cached track: {title}")

    except sqlite3.Error as e:
        logger.error(f"SQLite error while caching track '{youtube_id}': {e}")
        raise CachingFailError(f"Caching failed for {youtube_id}") from e



def download_track_db(track: Track) -> None:
    """
    Logs a track into the downloads table if not already present.

    Raises:
        DownloadLogFailError: if a database error occurs while recording the download.
    """
    youtube_id, title, uploader, duration = (
        track.youtube_id, track.title, track.uploader, track.duration
    )

    try:
        with sqlite3.connect(G.DB_FILE) as conn:
            conn.execute("PRAGMA foreign_keys = ON;")
            c = conn.cursor()

            # Insert into downloads table, ignore if already exists
            c.execute(f'''
                INSERT OR IGNORE INTO {G.DB_DOWNLOADS_TABLENAME} (youtube_id, downloaded_at)
                VALUES (?, CURRENT_TIMESTAMP)
            ''', (youtube_id,))

            conn.commit()
            logger.info(f"Logged download: {title}")

    except sqlite3.Error as e:
        logger.error(f"SQLite error while logging download '{youtube_id}': {e}")
        raise DownloadLogFailError(f"Download logging failed for {youtube_id}") from e



def search_db(q: str) -> List[Track]:
    """
    Search the local SQLite database for tracks that match the given query in the title or uploader.

    Args:
        q (str): The search term to match against track titles and uploader names.

    Returns:
        List[Track]: A list of tracks that matches the query, prioritized by downloaded/cached entries.
    """
    with sqlite3.connect(G.DB_FILE) as conn:
        conn.row_factory = sqlite3.Row #for accessing row data later
        c = conn.cursor()
        
        if not q:
            #no filtering, return all entries from downloads
            c.execute(f"""
                SELECT t.youtube_id, t.title, t.uploader, t.duration 
                FROM {G.DB_TRACKS_TABLENAME} t
                INNER JOIN {G.DB_DOWNLOADS_TABLENAME} d ON t.youtube_id = d.youtube_id
                ORDER BY d.downloaded_at DESC
            """)

        else:
            pattern = f"%{q.lower()}%"
            c.execute(f"""
                SELECT t.youtube_id, t.title, t.uploader, t.duration,
                    CASE WHEN d.youtube_id IS NOT NULL OR c.youtube_id IS NOT NULL THEN 1 ELSE 0 END AS priority,
                    COALESCE(d.downloaded_at, c.cached_at) AS last_active

                FROM {G.DB_TRACKS_TABLENAME} t
                LEFT JOIN {G.DB_DOWNLOADS_TABLENAME} d ON t.youtube_id = d.youtube_id
                LEFT JOIN {G.DB_CACHE_TABLENAME} c on t.youtube_id = c.youtube_id

                WHERE title LIKE ? COLLATE NOCASE OR uploader LIKE ? COLLATE NOCASE
                ORDER BY priority DESC, last_active DESC, t.title COLLATE NOCASE
            """, (pattern, pattern))
    
        db_rows = c.fetchall()

        db_results = [
            Track(
                youtube_id=row["youtube_id"], 
                title=row["title"],
                uploader=row["uploader"],
                duration=row["duration"]
            )
            for row in db_rows
        ]

    return db_results

