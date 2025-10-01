from queue import Queue
import subprocess
from threading import Thread

def terminate_process(proc, name=""):

    if name != "":
        name = f"[{name}] "

    try:
        proc.terminate()

        try:
            proc.wait(timeout=5)
            print(f"Subprocess {name}terminated gracefully.")

        except subprocess.TimeoutExpired:
            print(f"Subprocess {name}did not terminate, escalating to SIGKILL")

            proc.kill()
    
    except ProcessLookupError:
        #process already terminated
        pass

    finally:
        #safe cleanup call
        proc.wait()
        print(f"Subprocess {name}cleanup complete. Exit code: {proc.returncode}")


def _enqueue_stream(stream, queue: Queue):
    """Read lines from stream and push into queue, to be eaten by another thread."""
    #blocking until new data from the stream (PIPE)
    for raw in iter(stream.readline, ""):
        queue.put(raw.rstrip("\n"))
    queue.put(None)

def drain_output(proc, name=""):
    stdout_queue = Queue()
    thread = Thread(target=_enqueue_stream, args=(proc.stdout, stdout_queue), daemon=True)
    thread.start()
    return stdout_queue
