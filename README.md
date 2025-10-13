# Scuttle
Scuttle is a responsive web-based audio archival tool for managing and playing your personal audio collection.

- Search and download audio
- Play, pause, and skip tracks
- Create and manage playlists
- Self-host your audio library and stream to any device with a browser


## Installation


## Usage

### 1. Initial Setup
Before running the server for the first time, run the setup script. This will:

- Create a Python virtual environment  
- Install all required dependencies  
- Download the `cloudflared` executable

```bash
python setup.py
```

### 2. Start the server
Once setup is complete, start the application with:

```bash
python main.py
```



## Dependencies

This project requires Python 3.8+ and the following Python packages:

- **yt-dlp** – Download and manage audio/video content.  
- **FastAPI** – Web framework for building the backend API.  
- **uvicorn[standard]** – ASGI server to run the FastAPI app.  
- **websockets** – Real-time communication support.  
- **pydantic** – Data validation and parsing.  
- **python-dotenv** – Load environment variables from `.env` files.  
- **requests** – Make HTTP requests to external APIs.

You can install all dependencies with:

```bash
pip install -r requirements.txt
```
