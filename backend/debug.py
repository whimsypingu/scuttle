#import shutil

#import backend.core as core
#import backend.globals as G

#G.DATA_DIR.mkdir(parents=True, exist_ok=True)

#shutil.rmtree(G.DOWNLOAD_DIR)
#G.DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

#core.delete_db()
#core.init_db()
#core.view_db()

from itertools import product
import csv

play_queue_lengths = ["0", "1+"]
button_clicked = ["play", "queue"]
downloaded_status = [True, False]

combinations = list(product(play_queue_lengths, button_clicked, downloaded_status))

csv_file_path_custom = "backend/custom_ui_behavior_matrix.csv"

with open(csv_file_path_custom, mode="w", newline="") as file:
    writer = csv.writer(file)
    writer.writerow(["Play Queue Length", "Button Clicked", "Downloaded", "Expected Behavior"])

    for qlen, button, downloaded in combinations:
        writer.writerow([qlen, button, downloaded, ""])  # Empty expected behavior

csv_file_path_custom