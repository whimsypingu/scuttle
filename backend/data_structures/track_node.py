from .track import Track

#queueing
class TrackNode:
    def __init__(self, track: Track):
        self.track = track
        self.prev = None
        self.next = None