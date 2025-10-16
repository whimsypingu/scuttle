from pathlib import Path

async def cleanup_download_folder(db, downloads_dir: Path):
    """
    Remove any files in the downloads folder whose base filename (without extension)
    is not present in the database downloads list.
    """
    #ensure the directory actually exists
    if not downloads_dir.exists():
        print(f"[CLEANUP] Downloads directory does not exist: {downloads_dir}")
        return
        
    #1. get the list of valid IDs from the database
    try:
        content = await db.get_downloads_content()
    except Exception as e:
        print(f"[CLEANUP] Failed to retrieve download list: {e}")
        return
    
    valid_ids = {item["id"] for item in content}

    #2. walk through the downloads folder
    for filepath in downloads_dir.iterdir():
        if not filepath.is_file():
            continue #ignore directories, but there shouldnt be any

        base_name = filepath.stem #filename without extension

        #3. if this file is not associated with any downloaded track, delete it
        if base_name not in valid_ids:
            try:
                filepath.unlink()
                print(f"[CLEANUP] Removed orphaned file: {filepath.name}")
            except OSError as e:
                print(f"[CLEANUP] Failed to remove {filepath.name}: {e}")