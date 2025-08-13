import re
from typing import List, Optional

from backend.data_structures import Track


GOOD_KEYWORDS = {
    "official": 5,
    "lyric": 3,
    "audio": 2,
    "full": 1
}

BAD_KEYWORDS = {
    "reaction": -5,
    "live": -1,
    "cover": -1,
    "remix": -1
}

BONUS_SCORE = {
    "uploader_in_title": 2,
    "title_pattern": 3,
    "reasonable_duration": 1
}


def track_score(q: str, track: Track) -> int:
    """
    Computes a relevance score for a given track based on keyword heuristics,
    metadata patterns, and duration.

    Scoring includes:
    - Positive and negative keyword matches in the title.
    - Bonus if the uploader's name appears in the title.
    - Bonus if the title matches a common song naming pattern (e.g., "Artist - Title").
    - Bonus if the duration is within a typical song length (1 to 5 minutes).

    Args:
        query (str): The original search query string.
        track (Track): The track to evaluate.

    Returns:
        int: The calculated relevance score for the track.
    """
    q = q.lower()
    title = track.title.lower()
    uploader = track.uploader.lower()
    duration = track.duration
    
    score = 0

    #positive keyword weighting
    for keyword, weight in GOOD_KEYWORDS.items():
        if keyword in title:
            score += weight

    #negative keyword weighting
    for keyword, weight in BAD_KEYWORDS.items():
        if keyword in title:
            
            if keyword in q:
                score += -(weight) #no penalty if explicitly searched for the keyword
            else:
                score += weight

    #bonus: uploader name in title
    if uploader.strip() in title:
        score += BONUS_SCORE["uploader_in_title"]

    #bonus: title pattern like artist-song
    if re.match(r"^.+\s-\s.+", title):
        score += BONUS_SCORE["title_pattern"]

    #bonus: reasonable duration (1 to 5 minutes)
    if (1 * 60) <= duration <= (5 * 60):
        score += BONUS_SCORE["reasonable_duration"]
    
    return score

    
def select_best_track(q: str, tracks: List[Track]) -> Optional[Track]:
    """
    Selects the single best-matching track from a list using heuristic scoring.

    Iterates through a list of candidate tracks, scoring each one with `track_score`,
    and returns the track with the highest score.

    Args:
        query (str): The original search query used to match tracks.
        tracks (List[Track]): A list of candidate Track objects.

    Returns:
        Optional[Track]: The highest-scoring Track, or None if the list is empty.
    """
    best_score = float("-inf")
    best_track = None

    for track in tracks:
        score = track_score(q, track)

        if score > best_score:
            best_score = score
            best_track = track
    
    return best_track
