from queue import Empty, Queue
import subprocess
from threading import Thread
import socket

def wait_for_stop_command(shutdown_event, control_port=0, verbose=False):
    """
    Listens for a stop command, from a Rust GUI.
    
    Parameters
        shutdown_event: Event
        control_port: Port number on localhost
        verbose: Logs
    """
    def listener():
        try:
            sock = socket.create_connection(("127.0.0.1", control_port))
            file = sock.makefile("r")

            for line in file:
                if line.strip() == "STOP":
                    shutdown_event.set()
                    break
            
            sock.close()
        except Exception as e:
            print(f"[WARN] Control connection failed: {e}")

    t = Thread(target=listener, daemon=True)
    t.start()


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


def drain_queue(q):
    lines = []
    while True:
        try:
            lines.append(q.get_nowait())
        except Empty:
            break
    return lines
    