-- titles table
CREATE TABLE IF NOT EXISTS titles (
    rowid INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT UNIQUE,
    title TEXT NOT NULL,
    title_display TEXT,
    duration REAL DEFAULT 0.0,
    pref REAL DEFAULT 0.0 CHECK (pref >= 0.0 AND pref <= 1.0),
    pref_weight REAL DEFAULT 1.0
);

-- titles insertion trigger
CREATE TRIGGER IF NOT EXISTS trg_pref_insert_titles
AFTER INSERT ON titles
BEGIN
    UPDATE titles
    SET pref_weight = LN_BOOST(NEW.pref)
    WHERE rowid = NEW.rowid;
END;

-- titles update trigger
CREATE TRIGGER IF NOT EXISTS trg_pref_update_titles
AFTER UPDATE OF pref ON titles
BEGIN
    UPDATE titles
    SET pref_weight = LN_BOOST(NEW.pref)
    WHERE rowid = NEW.rowid;
END;

-- artists table
CREATE TABLE IF NOT EXISTS artists (
    rowid INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT UNIQUE,
    artist TEXT NOT NULL,
    artist_display TEXT,
    pref REAL DEFAULT 0.0 CHECK (pref >= 0.0 AND pref <= 1.0),
    pref_weight REAL DEFAULT 1.0
);

-- artists insertion trigger
CREATE TRIGGER IF NOT EXISTS trg_pref_insert_artist
AFTER INSERT ON artists
BEGIN
    UPDATE artists
    SET pref_weight = LN_BOOST(NEW.pref)
    WHERE rowid = NEW.rowid;
END;

-- artists update trigger
CREATE TRIGGER IF NOT EXISTS trg_pref_update_artists
AFTER UPDATE OF pref ON artists
BEGIN
    UPDATE artists
    SET pref_weight = LN_BOOST(NEW.pref)
    WHERE rowid = NEW.rowid;
END;

-- title and artists junction table
CREATE TABLE IF NOT EXISTS title_artists (
    title_rowid INTEGER,
    artist_rowid INTEGER,
    FOREIGN KEY (title_rowid) REFERENCES titles(rowid) ON DELETE CASCADE,
    FOREIGN KEY (artist_rowid) REFERENCES artists(rowid) ON DELETE CASCADE,
    PRIMARY KEY (title_rowid, artist_rowid)
);

-- fts5 view
CREATE VIEW IF NOT EXISTS title_artist_search_view AS
SELECT 
    t.rowid as rowid,
    t.title as title,
    GROUP_CONCAT(a.artist, ' ') as artists
FROM titles t
JOIN title_artists ta ON t.rowid = ta.title_rowid
JOIN artists a ON ta.artist_rowid = a.rowid
GROUP BY t.rowid;

-- fts5 table
CREATE VIRTUAL TABLE IF NOT EXISTS catalog_fts USING fts5(
    title, 
    artists,
    content='title_artist_search_view',
    content_rowid='rowid',
    tokenize='unicode61 remove_diacritics 1' --see https://sqlite.org/fts5.html section 4.3.1
);

-- downloads table
CREATE TABLE IF NOT EXISTS downloads (
    id TEXT PRIMARY KEY,
    downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id) REFERENCES titles(id) ON DELETE CASCADE
);

-- likes table
CREATE TABLE IF NOT EXISTS likes (
    id TEXT PRIMARY KEY,
    position REAL NOT NULL,
    liked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id) REFERENCES downloads(id) ON DELETE CASCADE
);

-- likes position index
CREATE INDEX IF NOT EXISTS idx_likes_position
ON likes(position);

-- playlists table
CREATE TABLE IF NOT EXISTS playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- playlist and titles junction table
CREATE TABLE IF NOT EXISTS playlist_titles (
    playlist_id INTEGER NOT NULL,
    title_id TEXT NOT NULL,
    position REAL NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (title_id) REFERENCES downloads(id) ON DELETE CASCADE,
    PRIMARY KEY (playlist_id, title_id)
);

-- playlist titles covering index
CREATE INDEX IF NOT EXISTS idx_playlist_titles_position
ON playlist_titles (playlist_id, position, title_id);