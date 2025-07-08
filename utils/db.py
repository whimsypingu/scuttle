import sqlite3
import os
from typing import List

from data_structures import *
from globals import *


def delete_db():
    """
    Deletes the entire database file from disk.
    """
    if os.path.exists(DB_FILENAME):
        os.remove(DB_FILENAME)
        print(f"Deleted database: {DB_FILENAME}")
    else:
        print(f"Database file '{DB_FILENAME}' does not exist.")


def init_db():
    #create DB file if it doesn't exist
    if not os.path.exists(DB_FILENAME):
        conn = sqlite3.connect(DB_FILENAME)

        #enable foreign key constraints
        conn.execute("PRAGMA foreign_keys = ON;")

        c = conn.cursor()

        #create tracks table
        c.execute(f'''
            CREATE TABLE {DB_TRACKS_TABLENAME} (
                youtube_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                uploader TEXT,
                duration INTEGER
            );
        ''')

        #create downloads table
        c.execute(f'''
            CREATE TABLE {DB_DOWNLOADS_TABLENAME} (
                youtube_id TEXT PRIMARY KEY,
                downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (youtube_id) REFERENCES {DB_TRACKS_TABLENAME}(youtube_id) ON DELETE CASCADE
            );
        ''')

        #create cache table
        c.execute(f'''
            CREATE TABLE {DB_CACHE_TABLENAME} (
                youtube_id TEXT PRIMARY KEY,
                cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (youtube_id) REFERENCES {DB_TRACKS_TABLENAME}(youtube_id) ON DELETE CASCADE
            );
        ''')

        conn.commit()
        conn.close()
        print(f"Created new database: {DB_FILENAME}")
    else:
        print(f"Database already exists: {DB_FILENAME}")



def view_db():
    print(f"Viewing database: {DB_FILENAME}")

    conn = sqlite3.connect(DB_FILENAME)
    c = conn.cursor()

    print(f"---\nTABLE: {DB_TRACKS_TABLENAME}")
    for row in c.execute(f"SELECT * FROM {DB_TRACKS_TABLENAME}"):
        print(row)

    print(f"---\nTABLE: {DB_DOWNLOADS_TABLENAME}")
    for row in c.execute(f"SELECT * FROM {DB_DOWNLOADS_TABLENAME}"):
        print(row)

    print(f"---\nTABLE: {DB_CACHE_TABLENAME}")
    for row in c.execute(f"SELECT * FROM {DB_CACHE_TABLENAME}"):
        print(row)

    print("---")
    conn.close()



def cache_track_db(track: Track) -> bool:
    """
    Adds a track to the tracks table if it doesn't exist,
    and logs the access in the cache table.

    Returns:
        bool: True if inserted into tracks or cache successfully; False on failure.
    """
    youtube_id, title, uploader, duration = (
        track.youtube_id, track.title, track.uploader, track.duration
    )

    try:
        with sqlite3.connect(DB_FILENAME) as conn:
            conn.execute("PRAGMA foreign_keys = ON;")
            c = conn.cursor()

            #insert into tracks (ignore if already exists)
            c.execute(f'''
                INSERT OR IGNORE INTO {DB_TRACKS_TABLENAME} (youtube_id, title, uploader, duration)
                VALUES (?, ?, ?, ?)
            ''', (youtube_id, title, uploader, duration))

            #always insert into cache (even if already in tracks)
            c.execute(f'''
                INSERT INTO {DB_CACHE_TABLENAME} (youtube_id, cached_at)
                VALUES (?, CURRENT_TIMESTAMP)
                ON CONFLICT(youtube_id) DO UPDATE SET cached_at = CURRENT_TIMESTAMP
            ''', (youtube_id,))

            conn.commit()
            print(f"Cached track: {title}")

        return True

    except sqlite3.Error as e:
        print(f"SQLite error while caching track '{youtube_id}': {e}")
        return False




def search_db(q: str) -> List[Track]:
    """
    Search the local SQLite database for tracks that match the given query in the title or uploader.

    Args:
        q (str): The search term to match against track titles and uploader names.

    Returns:
        List[Track]: A list of tracks that matches the query, prioritized by downloaded/cached entries.
    """
    with sqlite3.connect(DB_FILENAME) as conn:
        c = conn.cursor()
        
        if not q:
            #no filtering, return all entries from downloads
            c.execute(f"""
                SELECT t.youtube_id, t.title, t.uploader, t.duration 
                FROM {DB_TRACKS_TABLENAME} t
                INNER JOIN {DB_DOWNLOADS_TABLENAME} d ON t.youtube_id = d.youtube_id
                ORDER BY d.downloaded_at DESC
            """)

        else:
            pattern = f"%{q.lower()}%"
            c.execute(f"""
                SELECT t.youtube_id, t.title, t.uploader, t.duration,
                    CASE WHEN d.youtube_id IS NOT NULL OR c.youtube_id IS NOT NULL THEN 1 ELSE 0 END AS priority,
                    COALESCE(d.downloaded_at, c.cached_at) AS last_active

                FROM {DB_TRACKS_TABLENAME} t
                LEFT JOIN {DB_DOWNLOADS_TABLENAME} d ON t.youtube_id = d.youtube_id
                LEFT JOIN {DB_CACHE_TABLENAME} c on t.youtube_id = c.youtube_id

                WHERE title LIKE ? COLLATE NOCASE OR uploader LIKE ? COLLATE NOCASE
                ORDER BY priority DESC, last_active DESC, t.title COLLATE NOCASE
            """, (pattern, pattern))
    
        db_rows = c.fetchall()

    db_results = [
        Track(
            youtube_id=row[0], 
            title=row[1],
            uploader=row[2],
            duration=row[3]
        )
        for row in db_rows
    ]

    return db_results

