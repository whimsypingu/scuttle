from backend.core.models.enums import AudioDatabaseAction as ADA

class LikesMixin:
    async def toggle_like(self, id: str):
        """
        Toggle the liked status of a track.

        If the track ID exists in the LIKES table, it is removed. If it does not 
        exist, it is inserted at the "top" of the list by assigning it a 
        position value of MIN(position) - 1.0.

        Args:
            id (str): The unique track ID to toggle.

        Note:
            The new position calculation ensures that the most recently liked 
            track appears first when ordered by position ASC.
        """
        async with self._lock:
            #check if already in db
            row = await self._fetchone(f'''
                SELECT 1 FROM likes
                WHERE id = ?;
            ''', (id,))

            if row:
                #exists already, so remove
                await self._execute(f'''
                    DELETE FROM likes
                    WHERE id = ?;
                ''', (id,))
            else:
                #doesn't exist yet, so we add it to the front/top of the list by inserting with a float that has min_pos-1
                result = await self._fetchone(f'''
                    SELECT MIN(position) AS min_pos FROM likes;
                ''')

                new_position = (result["min_pos"] or 0.0) - 1.0

                await self._execute(f'''
                    INSERT INTO likes (id, position) VALUES (?, ?);
                ''', (id, new_position))


    async def fetch_liked_tracks(self):
        """
        Retrieve the list of track IDs in the likes playlist, ordered by position.

        Fetches all IDs from the LIKES table sorted by their floating-point 
        position. Emits an ADA.FETCH_LIKES event with the resulting list.

        Returns:
            list[str]: A list of unique track IDs.

        Future Note:
            Consider updating this to join with the TITLES and ARTISTS tables 
            to return full track metadata (objects) instead of just IDs, 
            reducing the need for secondary lookups in the frontend.
        """
        async with self._lock:
            rows = await self._fetchall(f'''
                SELECT id
                FROM likes
                ORDER BY position ASC;
            ''')
            track_ids = [row["id"] for row in rows]
            await self._emit_event(action=ADA.FETCH_LIKES, payload={"content": track_ids})
    
            return track_ids


    async def reorder_likes_track(self, from_index: int, to_index: int):
        """
        Reorder a track within the system likes playlist by moving it from one index to another.

        This method updates the `position` column of the track to reflect its new order
        in the playlist. It uses floating point indexing and sqlite3 indexes (see Build) 
        to allow fast lookup and insertion without renumbering the entire playlist.

        Args:
            from_index (int): The current 0-based index of the track to move.
            to_index (int): Target 0-based index to move the track to.

        Returns:
            bool: Success or failure
        """
        async with self._lock:
            #fetch playlist tracks ordered by position
            rows = await self._fetchall(f'''
                SELECT id, position
                FROM likes
                ORDER BY position ASC;
            ''')

            print("[reorder_likes] BEFORE reorder:")
            for r in rows:
                print(f"  id={r['id']}, position={r['position']}")


            n = len(rows) - 1 #have to account for removal of the element being reordered. to_index cannot be >= len(rows) - 1
            if n == 0 or from_index < 0 or from_index > n or to_index < 0 or to_index > n:
                print("FAILURE")
                return False #invalid
            
            #remove the moved track so indices reflect post-removal state
            moved_row = rows.pop(from_index)
            track_id = moved_row["id"]
            
            print("from_index:", from_index, "to_index:", to_index)

            if to_index == 0:
                new_position = rows[0]["position"] - 1.0
            elif to_index == n:                               #this is the last element
                new_position = rows[-1]["position"] + 1.0
            else:
                new_position = (rows[to_index - 1]["position"] + rows[to_index]["position"]) / 2.0

            #update
            await self._execute(f'''
                UPDATE likes
                SET position = ?
                WHERE id = ?;                    
            ''', (new_position, track_id))

            print("[reorder_likes]: SUCCESS")

            #fetch playlist tracks ordered by position
            rows = await self._fetchall(f'''
                SELECT id, position
                FROM likes
                ORDER BY position ASC;
            ''')

            print("[reorder_likes] AFTER reorder:")
            for r in rows:
                print(f"  id={r['id']}, position={r['position']}")

            return True
