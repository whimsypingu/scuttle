import asyncio
from functools import wraps

#turns something async
def run_in_executor(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        loop = asyncio.get_running_loop()
        # run func(*args, **kwargs) in default thread pool
        return await loop.run_in_executor(None, lambda: func(*args, **kwargs))
    return wrapper