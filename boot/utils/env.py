from dotenv import load_dotenv

from misc import ENV_FILE

def update_env(key, value):
    """
    Update or insert a key=value pair in the .env file. 
    Calls load_dotenv(override=True) afterwards.
    Creates .env file if doesn't exist

    Args:
        key (str): Environment variable name.
        value (str): New value to set.
    """
    new_line = f"{key}={value}\n"

    # Read existing lines if the file exists
    lines = []
    if ENV_FILE.exists():
        with ENV_FILE.open("r") as f:
            lines = f.readlines()

    # Update if key exists, else append
    updated = False
    for i, line in enumerate(lines):
        if line.strip().startswith(f"{key}="):
            lines[i] = new_line
            updated = True
            break

    if not updated:
        lines.append(new_line)

    # Write all lines back to the .env file
    with ENV_FILE.open("w") as f:
        f.writelines(lines)

    load_dotenv(dotenv_path=ENV_FILE, override=True)