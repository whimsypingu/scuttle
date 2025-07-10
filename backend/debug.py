import shutil

import backend.core as core
import backend.globals as G

G.DATA_DIR.mkdir(parents=True, exist_ok=True)

shutil.rmtree(G.DOWNLOAD_DIR)
G.DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

core.delete_db()
core.init_db()
core.view_db()