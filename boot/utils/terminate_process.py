import subprocess

def terminate_process(proc):
    try:
        proc.terminate()

        try:
            proc.wait(timeout=5)
            print("Subprocess terminated gracefully.")

        except subprocess.TimeoutExpired:
            print("Subprocess did not terminate, escalating to SIGKILL")

            proc.kill()
    
    except ProcessLookupError:
        #process already terminated
        pass

    finally:
        #safe cleanup call
        proc.wait()
        print(f"Subprocess cleanup complete. Exit code: {proc.returncode}")