from backend.core.models.enums import AudioDatabaseAction as ADA

class PlaylistsMixin:
    async def create_playlist(self, name: str, temp_id: str):
        def _logic():
            with self.cursor() as cur:
                cur.execute('INSERT INTO playlists (name) VALUES (?) RETURNING id;', (name,))
                row = cur.fetchone()
                return row["id"]
            
        new_id = await self._atomic_db_op(_logic)
        content = {
            "temp_id": temp_id, 
            "id": new_id, 
            "name": name
        }
        await self._emit_event(action=ADA.CREATE_PLAYLIST, payload={"content": content})
        
        return content
        

    #modifications to data
    async def update_track_playlists(self, track_id: str, playlist_updates: list[dict]):
        """
        Update a track's playlist memberships based on a set of updates.

        For each playlist update in `playlist_updates`, which should be like [{id: '1', checked: false}]:
          - If `checked` is True: ensure the track is present in the playlist 
            (insert if missing, keep if already exists).
          - If `checked` is False: remove the track from the playlist if it exists.
          - If `checked` is None or not provided: make no changes for that playlist.

        Args:
            track_id (str): The ID of the track to update.
            playlist_updates (list[dict]): A list of updates, where each item is a dict
                with:
                  - "id" (str): Playlist ID
                  - "checked" (bool | None): Desired membership state
        """
        def _logic():
            with self.cursor() as cur:
                for playlist in playlist_updates:
                    playlist_id, checked = playlist["id"], playlist["checked"]

                    if checked is True:
                        #insert new track at bottom of playlist (max+1) or keep existing
                        cur.execute('''
                            SELECT MAX(position) AS max_pos
                            FROM playlist_titles
                            WHERE playlist_id = ?;
                        ''', (playlist_id,))
                        result = cur.fetchone()["max_pos"]
                        new_position = (result or 0.0) + 1.0

                        #insert with position
                        cur.execute('''
                            INSERT INTO playlist_titles (playlist_id, title_id, position)
                            VALUES (?, ?, ?)
                            ON CONFLICT(playlist_id, title_id) DO NOTHING;
                        ''', (playlist_id, track_id, new_position))
                    
                    else:
                        cur.execute('DELETE FROM playlist_titles WHERE playlist_id = ? AND title_id = ?;', (playlist_id, track_id))
            return True
        
        await self._atomic_db_op(_logic)
        content = {
            "id": track_id,
            "updates": playlist_updates
        }
        await self._emit_event(ADA.UPDATE_PLAYLISTS, payload={"content": content})


    async def reorder_playlist_track(self, playlist_id: int, from_index: int, to_index: int):
        """
        Reorder a track within a playlist by moving it from one index to another.

        This method updates the `position` column of the track to reflect its new order
        in the playlist. It uses floating point indexing and sqlite3 indexes (see Build) 
        to allow fast lookup and insertion without renumbering the entire playlist.

        Args:
            playlist_id (int): The ID of the playlist to rename.
            from_index (int): The current 0-based index of the track to move.
            to_index (int): Target 0-based index to move the track to.

        Returns:
            
        """
        def _logic():
            with self.cursor() as cur:
                #fetch playlist tracks ordered by position
                cur.execute('''
                    SELECT title_id, position
                    FROM playlist_titles
                    WHERE playlist_id = ?
                    ORDER BY position ASC;
                ''', (playlist_id,))
                rows = [dict(row) for row in cur.fetchall()]

                n = len(rows) - 1 #have to account for removal of the element being reordered. to_index cannot be >= len(rows) - 1
                if n == 0 or from_index < 0 or from_index > n or to_index < 0 or to_index > n:
                    return False #invalid

                #remove the moved track so indices reflect post-removal state
                moved_row = rows.pop(from_index)
                track_id = moved_row["title_id"]

                if to_index == 0:
                    new_position = rows[0]["position"] - 1.0
                elif to_index == n:                               #this is the last element
                    new_position = rows[-1]["position"] + 1.0
                else:
                    new_position = (rows[to_index - 1]["position"] + rows[to_index]["position"]) / 2.0

                #update
                cur.execute('''
                    UPDATE playlist_titles
                    SET position = ?
                    WHERE playlist_id = ? AND title_id = ?;                    
                ''', (new_position, playlist_id, track_id))
                return True
        
        return await self._atomic_db_op(_logic)


    async def edit_playlist(self, playlist_id: int, name: str):
        """
        Update the name of an existing playlist.

        Args:
            playlist_id (int): The ID of the playlist to rename.
            name (str): The new name for the playlist.

        Returns:
            dict: The updated playlist info.
        """
        def _logic():
            with self.cursor() as cur:
                cur.execute('UPDATE playlists SET name = ? WHERE id = ?;', (name, playlist_id))

        await self._atomic_db_op(_logic)
        content = {
            "id": playlist_id,
            "name": name
        }
        await self._emit_event(action=ADA.EDIT_PLAYLIST, payload={"content": content})

        return content


    async def delete_playlist(self, playlist_id: int):
        """
        Delete a playlist and remove its track associations.

        Args:
            playlist_id (int): The ID of the playlist to delete.

        Returns:
            dict: Info about the deleted playlist.
        """
        def _logic():
            with self.cursor() as cur:
                cur.execute('DELETE FROM playlists WHERE id = ?;', (playlist_id,))

        await self._atomic_db_op(_logic)
        content = {
            "id": playlist_id
        }
        await self._emit_event(action=ADA.DELETE_PLAYLIST, payload={"content": content})

        return content
