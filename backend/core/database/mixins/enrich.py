class EnrichMixin:
    async def get_artists(self, title_id: str):
        """
        Given a title id return a list of corresponding artists with their data
        """
        if not title_id:
            return []
        
        def _logic():
            with self.cursor() as cur:
                cur.execute("""
                    SELECT
                        a.rowid,
                        a.id,
                        a.artist,
                        COALESCE(a.artist_display, a.artist) AS artist_display
                    FROM artists a
                    JOIN title_artists ta ON ta.artist_rowid = a.rowid
                    WHERE ta.title_rowid = ?
                    ORDER BY ta.rowid; --preserves order they were added in
                """, (title_id,))

                results = cur.fetchall()
            return [dict(row) for row in results]

        return await self._atomic_db_op(_logic)



    async def get_recordings(self, artist_id: str = None, artist_name: str = None):
        """
        Given an artist id or name return a set of all de-duplicated titles
        """
        if not artist_id and not artist_name:
            return {}
        
        if (artist_id):
            subquery = "SELECT rowid FROM artists WHERE id = ?"
            params = (artist_id,)
        elif (artist_name):
            subquery = "SELECT rowid FROM artists WHERE artist = ?"
            params = (artist_name,)
    
        def _logic():
            with self.cursor() as cur:
                cur.execute(f"""
                    SELECT 
                        t.rowid,
                        t.id,
                        t.title,
                        COALESCE(t.title_display, t.title) AS title_display,
                        GROUP_CONCAT(a.artist, ', ') AS artists
                    FROM titles t
                    JOIN title_artists ta ON t.rowid = ta.title_rowid
                    JOIN artists a ON ta.artist_rowid = a.rowid
                    WHERE t.rowid IN (
                        SELECT title_rowid
                        FROM title_artists
                        WHERE artist_rowid IN (
                            {subquery}
                        )
                    )
                    GROUP BY t.rowid;
                """, params)

                results = cur.fetchall()
            return set(row['title'] for row in results)

        return await self._atomic_db_op(_logic)



    async def batch_update_artists(self, artists: dict):
        """
        Updates all artists.

        Args:
            artists (dict of dicts):
                {
                    "new_id":
                    {
                        "old_id" (optional): str,
                        "artist": str,
                        "artist_display": str
                    }
                    ...
                }

        Returns: Dict, artist_rowid_map
            {
                "new_id": rowid
            }
        """
        def _logic():
            artist_rowid_map = {}
            
            with self.cursor() as cur:
                for new_id, data in artists.items():
        
                    #get the rowids, porting old preferences if necessary
                    old_id = data.get('old_id', None) #optional field
                    cur.execute("""
                        INSERT OR IGNORE INTO artists (id, artist, artist_display, pref)
                        VALUES (
                            ?, 
                            ?, 
                            ?,
                            COALESCE((SELECT pref FROM artists WHERE id = ?), 0.0)
                        )
                        ON CONFLICT(id) DO UPDATE SET
                            -- do nothing but must do an update to get the rowid
                            artist = excluded.artist
                        RETURNING rowid;
                    """, (new_id, data['artist'], data['artist_display'], old_id))
                    new_rowid = cur.fetchone()[0]

                    artist_rowid_map[new_id] = new_rowid

                    #if merging, redirect the old rowid to the new rowid in junction table
                    if old_id:
                        cur.execute("""
                            UPDATE title_artists
                            SET artist_rowid = ?
                            WHERE artist_rowid IN (
                                SELECT rowid 
                                FROM artists 
                                WHERE id = ?
                            );
                        """, (new_rowid, old_id))
            return artist_rowid_map
            
        return await self._atomic_db_op(_logic)


    async def batch_update_titles(self, titles: list):
        """
        Inserts all titles.

        Args:
            titles (list of dicts):
                [
                    {
                        "new_id": str,
                        "title": str,
                        "title_display": str,
                        "duration": float
                    }
                    ...
                ]

        Returns: Dict, title_rowid_map
            {
                "new_id": rowid
            }
        """
        def _logic():
            title_rowid_map = {}

            with self.cursor() as cur:
                #create temp table to extract id and rowid mapping
                cur.execute("CREATE TEMP TABLE staging_ids(id TEXT);")
                
                id_list = [(t['new_id'],) for t in titles]
                cur.executemany("INSERT INTO staging_ids VALUES (?);", id_list)

                cur.executemany("""
                    INSERT INTO titles (id, title, title_display, duration)
                    VALUES (:new_id, :title, :title_display, :duration)
                    ON CONFLICT(id) DO NOTHING;
                """, titles)
 
                #extract mapping
                cur.execute("""
                    SELECT t.id, t.rowid
                    FROM titles t
                    INNER JOIN staging_ids s ON t.id = s.id;
                """)
                title_rowid_map = dict(cur.fetchall())
            
            return title_rowid_map

        return await self._atomic_db_op(_logic)



    async def batch_update_junctions(self, junctions: list, title_rowid_map=None, artist_rowid_map=None):
        """
        """
        translated_junctions = [
            (title_rowid_map[t_id], artist_rowid_map[a_id])
            for t_id, a_id in junctions
            if t_id in title_rowid_map and a_id in artist_rowid_map
        ]

        def _logic():
            with self.cursor() as cur:
                cur.executemany("""
                    INSERT OR IGNORE INTO title_artists (title_rowid, artist_rowid)
                    VALUES (?, ?);
                """, translated_junctions)

        await self._atomic_db_op(_logic)
        return True

