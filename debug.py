import utils
import globals
import logging


globals.DATA_DIR.mkdir(parents=True, exist_ok=True)
globals.DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

#utils.delete_db()
#utils.init_db()
utils.view_db()