# Scuttle
Scuttle is a responsive web-based audio archival tool for managing and playing your personal audio collection.

- Search and download audio
- Play, pause, and skip tracks
- Create and manage playlists
- Self-host your audio library and stream to any device with a browser
- Imports playlists from external services (e.g. Spotify) to mirror or organize your personal collection

### Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Dependencies](#dependencies)
- [Future features](#future-features)
- [License](#license)
- [Disclaimer](#disclaimer)


## Installation

### 1. Clone the repository
Navigate to a folder where you want to put Scuttle, open a terminal and run:
```bash
git clone https://github.com/whimsypingu/scuttle.git
```

Then run this to preview options:
```bash
cd scuttle
python main.py --help
```

### 2. Setup the environment
Run the setup script to prepare the python environment. This will:
* Create a Python virtual environment (```/venv```)
* Install all required dependencies (please see ```/requirements.txt``` in [dependencies](#dependencies))
* Download a ```cloudflared``` executable for tunneling from [the official open source repository](https://github.com/cloudflare/cloudflared/releases/latest/)

```bash
python main.py --setup
```

### 3. Activate the virtual environment
Before running the server, activate the virtual environment:
* Windows (cmd):
```bash
venv\Scripts\activate
```
* Windows (Powershell):
```bash
venv\Scripts\Activate.ps1
```
* macOS/Linux
```bash
source venv/bin/activate
```


## Usage

### 1. Start the server
Ensure you've [activated the virtual environment](#3-activate-the-virtual-environment) first. 

Run:
```bash
python main.py
```


#### 1.1 (Optional) Set up Discord webhook notifications:
Scuttle can provide the tunneled link to a Discord channel using a webhook URL, so you can access your audio on any device that has access to the channel. To set this up:

1. Follow [this official guide](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks) to get a Discord webhook URL (~2 min)
2. Run the following command to save the webhook URL to your `.env` file:
```bash
python main.py --set-webhook [URL]
```

💡 While the server is running, your device will stay awake to maintain the connection, though the display may turn off to conserve battery.

### 2. Shut down the server
Press ```Ctrl+C``` in the terminal to shut off the server and allow your device to sleep normally again.


## Dependencies
This project requires Python 3.8+ and the following Python packages:

- **yt-dlp** – Download and manage audio/video content.  
- **FastAPI** – Web framework for building the backend API.  
- **uvicorn[standard]** – ASGI server to run the FastAPI app.  
- **websockets** – Real-time communication support.  
- **pydantic** – Data validation and parsing.  
- **python-dotenv** – Load environment variables from `.env` files.  
- **requests** – Make HTTP requests to external APIs.

These are installed during [setup of the virtual environment](#2-setup-the-environment). You can install all dependencies manually with:
```bash
pip install -r requirements.txt
```


## Project structure
```bash
scuttle/
├─ backend/             # Backend API and database
├─ boot/                # Setup scripts
├─ frontend/            # Web UI assets and logic
├─ tests/               # Um ignore this
├─ tools/               # Tunnel binary
├─ venv/                # Virtual environment (created by setup)
├─ .env                 # Environment variables (auto-generated)
├─ main.py              # Entry point for the application
├─ requirements.txt     # Required libraries
├─ sw.js                # Service worker
```


## Future Features

Scuttle is still in active development. Here are some planned features and improvements:

- [ ] Mobile UI improvements (swipe on queue to play next)
- [ ] Auto queue songs in a playlist
- [ ] Import playlist from YouTube  
- [ ] Improved search functionality
- [ ] Pagination for faster loading with larger libraries
- [ ] User authentication and multi-user support  
- [ ] Audio editing (silence removal, enhanced quality)
- [ ] Backend management from the web interface (download queue, server status)

These are not guaranteed but they reflect the current development priorities and ideas for future releases. Suggestions are welcome!


## License
This project is licensed under the [MIT License](./LICENSE).


## Disclaimer
Scuttle is provided for **personal, non-commercial use** only.
The developers do not **not endorse, support, or encourage downloading copyrighted material** without permission.
You are solely responsible for complying with all applicable laws and the terms of service of any platforms you interact with.
This project is intended to help users **archive, manage, and listen to their own legally obtained audio collections**. The developers are not responsible for any misuse of this software.
