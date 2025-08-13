#import shutil

from backend.core.database.audio_database import AudioDatabase
import backend.globals as G

db = AudioDatabase(G.DB_FILE)


'''
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

csv_file_path_custom'''
