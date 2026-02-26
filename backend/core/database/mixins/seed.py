import csv
from pathlib import Path
import math
import time
from backend.core.lib.utils import normalize_for_search


class SeedMixin:
    async def seed(self):
        csv_path = Path(__file__).parent.parent / "seed.csv"

        #check if seeding already done
        def _is_seeded():
            with self.cursor() as cur:
                cur.execute("SELECT COUNT(*) as count FROM titles")
                row = cur.fetchone()
                return row["count"] > 0 if row else False
            
        seeded = await self._atomic_db_op(_is_seeded)
        if seeded:
            return

        #seeding
        def _run_seed_logic():
            if not csv_path.exists():
                print(f"[{self.name}] Couldn't find seed csv path")
                return
            
            seed_start_time = time.perf_counter()

            with open(csv_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                data = list(reader)

            pops = [float(row['popularity']) for row in data if row.get('popularity')]
            min_pop = min(pops) if pops else 0
            
            #calculate artist frequency for the 'pref' boost
            #we'll use a simple dict counter to avoid Pandas value_counts() or explode()
            artist_counts = {}
            for row in data:
                for a_id in str(row.get("artist_ids", "")).split("|"):
                    a_id = a_id.strip()
                    if a_id:
                        artist_counts[a_id] = artist_counts.get(a_id, 0) + 1
            
            max_freq = max(artist_counts.values()) if artist_counts else 1.0

            print(f"[Seed] Starting seed of {len(data)} tracks...")

            with self.cursor() as cur:
                for row in data:
                    title = str(row.get("track_name", "UNKNOWN_TITLE"))
                    title_id = f'SEED___{str(row.get("track_id", "UNKNOWN_TITLE"))}'

                    #custom scoring math based on the seeding csv values
                    pref = (float(row.get("popularity", min_pop)) - min_pop) / 50.0
                    duration = float(row.get("duration", 0.0))

                    #insertion into titles
                    cur.execute('''
                        INSERT INTO titles (id, title, title_display, duration, pref)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (title_id, normalize_for_search(title), title, duration, pref))

                    #process artists
                    names = str(row.get("artist_names", "")).split("|")
                    ids = str(row.get("artist_ids", "")).split("|")

                    for artist, artist_id in zip(names, ids):
                        artist, artist_id = artist.strip(), artist_id.strip()

                        #insert artists and junctions
                        cur.execute('''
                            INSERT OR IGNORE INTO artists (id, artist, artist_display)
                            VALUES (?, ?, ?)
                        ''', (artist_id, normalize_for_search(artist), artist))

                        cur.execute('''
                            INSERT OR IGNORE INTO title_artists (title_rowid, artist_rowid)
                            SELECT t.rowid, a.rowid
                            FROM titles t, artists a
                            WHERE t.id = ? AND a.id = ?
                        ''', (title_id, artist_id))

                #recalculate artist preferences based on frequency
                cur.execute(f"""
                    UPDATE artists
                    SET pref = (
                        SELECT CAST(COUNT(*) AS REAL) / {2.0 * max_freq}
                        FROM title_artists
                        WHERE title_artists.artist_rowid = artists.rowid
                    )
                    WHERE EXISTS (SELECT 1 FROM title_artists WHERE artist_rowid = artists.rowid);
                """)
        
            seed_end_time = time.perf_counter()
            seed_duration = seed_end_time - seed_start_time
            print(f"[Seed] Success. Took {seed_duration:.2f} seconds ({len(data) / seed_duration:.1f} tracks/sec).")

        print(f"[{self.name}] Starting data seed...")
        await self._atomic_db_op(_run_seed_logic)


