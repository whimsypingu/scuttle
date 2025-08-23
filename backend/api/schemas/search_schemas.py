from pydantic import BaseModel
from typing import Optional

class SearchRequest(BaseModel):
    q: Optional[str] = None

class DownloadSearchRequest(BaseModel):
    q: Optional[str] = None