from queue import Queue
import subprocess
from threading import Thread

def terminate_process(proc, name="", verbose=False):
    """
    Terminates a process.

    Parameters
        proc: Process to kill
        name: Description of the process
        verbose: Logs
    """

    if name != "":
        name = f"[{name}] "

    try:
        proc.terminate()

        try:
            proc.wait(timeout=5)

            if verbose:
                print(f"[terminate_process] Subprocess {name}terminated gracefully.")

        except subprocess.TimeoutExpired:

            if verbose:
                print(f"[terminate_process] Subprocess {name}did not terminate, escalating to SIGKILL")

            proc.kill()
    
    except ProcessLookupError:
        #process already terminated
        pass

    finally:
        #safe cleanup call
        proc.wait()

        if verbose:
            print(f"[terminate_process] Subprocess {name}cleanup complete. Exit code: {proc.returncode}")


def _enqueue_stream(stream, queue: Queue, verbose=False):
    """Read lines from stream and push into queue, to be eaten by another thread."""
    #blocking until new data from the stream (PIPE)
    for raw in iter(stream.readline, ""):
        line = raw.rstrip("\n")
        queue.put(line)

        if verbose:
            print(line)
    queue.put(None)

def drain_output(proc, verbose=False):
    stdout_queue = Queue()
    thread = Thread(target=_enqueue_stream, args=(proc.stdout, stdout_queue), kwargs={"verbose": verbose}, daemon=True)
    thread.start()
    return stdout_queue
