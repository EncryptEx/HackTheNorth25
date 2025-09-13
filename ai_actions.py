import os
import subprocess
import json

def execute_action(action_json: str):
    """
    Parses and executes the action specified in the JSON.
    """
    try:
        action = json.loads(action_json)
    except json.JSONDecodeError:
        return {"status": "error", "message": "Invalid JSON format."}

    action_type = action.get("action")
    
    if action_type == "create_file":
        file_path = action.get("file_path")
        content = action.get("content")
        if file_path and content is not None:
            try:
                with open(file_path, "w") as f:
                    f.write(content)
                return {"status": "success", "message": f"File '{file_path}' created successfully."}
            except Exception as e:
                return {"status": "error", "message": f"Error creating file: {e}"}
        else:
            return {"status": "error", "message": "Missing 'file_path' or 'content' for 'create_file' action."}

    elif action_type == "run_command":
        command = action.get("command")
        if command:
            try:
                result = subprocess.run(command, shell=True, capture_output=True, text=True)
                if result.returncode == 0:
                    return {"status": "success", "output": result.stdout}
                else:
                    return {"status": "error", "message": result.stderr}
            except Exception as e:
                return {"status": "error", "message": f"Error running command: {e}"}
        else:
            return {"status": "error", "message": "Missing 'command' for 'run_command' action."}

    elif action_type == "append_to_file":
        file_path = action.get("file_path")
        content = action.get("content")
        if file_path and content is not None:
            try:
                with open(file_path, "a") as f:
                    f.write(content)
                return {"status": "success", "message": f"Content appended to '{file_path}' successfully."}
            except Exception as e:
                return {"status": "error", "message": f"Error appending to file: {e}"}
        else:
            return {"status": "error", "message": "Missing 'file_path' or 'content' for 'append_to_file' action."}

    else:
        return {"status": "error", "message": f"Unknown action: '{action_type}'"}
