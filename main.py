import os
import google.generativeai as genai
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from dotenv import load_dotenv

import crud, models, schemas
from database import SessionLocal, engine

load_dotenv()

models.Base.metadata.create_all(bind=engine)


# --- Configuration ---
# 1. Install the library:
#    pip install google-generativeai fastapi uvicorn
#
# 2. Get your API key from Google AI Studio:
#    https://aistudio.google.com/app/apikey
#
# 3. Set your API key as an environment variable:
#    export GEMINI_API_KEY="YOUR_API_KEY"
#    (on Windows, use "set GEMINI_API_KEY=YOUR_API_KEY")

def get_api_key():
    """Gets the Gemini API key from environment variables."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not set. Please follow the configuration steps.")
    return api_key

def initialize_model(model_name="gemini-1.5-flash-latest"):
    """Initializes the generative model."""
    try:
        genai.configure(api_key=get_api_key())
        model = genai.GenerativeModel(model_name)
        return model
    except Exception as e:
        print(f"Error initializing model: {e}")
        return None

def generate_prompt_response(model, prompt):
    """
    Sends a prompt to the model and returns the response.
    """
    if not model:
        return "Model not initialized. Please check your API key and configuration."
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"An error occurred: {e}"

from ai_actions import execute_action
from pydantic import BaseModel

# ... existing code ...

app = FastAPI()

class AIPrompt(BaseModel):
    prompt: str

# # Dependency
def get_db():  
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/ai/execute")
def ai_execute(prompt_data: AIPrompt):
    """
    An endpoint that takes a prompt, gets a structured JSON response from the AI,
    and executes the corresponding action.
    """
    model = initialize_model()
    if not model:
        return {"error": "Model could not be initialized."}

    system_prompt = """
You are an AI assistant that can perform actions on the local file system. 
Based on the user's request, you should generate a JSON object representing the action to take.
The JSON object must have an "action" key.

Here are the available actions:

1.  **Create a file**:
    - **action**: "create_file"
    - **file_path**: The absolute path of the file to create.
    - **content**: The content to write to the file.
    Example:
    {
      "action": "create_file",
      "file_path": "/home/user/test.txt",
      "content": "Hello, world!"
    }

2.  **Run a command**:
    - **action**: "run_command"
    - **command**: The shell command to execute.
    Example:
    {
      "action": "run_command",
      "command": "ls -l"
    }

3.  **Append to a file**:
    - **action**: "append_to_file"
    - **file_path**: The absolute path of the file to append to.
    - **content**: The content to append to the file.
    Example:
    {
      "action": "append_to_file",
      "file_path": "/home/user/existing.log",
      "content": "New log entry."
    }

User prompt: 
""" + prompt_data.prompt

    ai_response_text = generate_prompt_response(model, system_prompt)

    # The model might return the json wrapped in markdown, so we clean it
    if ai_response_text.startswith("```json"):
        ai_response_text = ai_response_text[7:]
    if ai_response_text.endswith("```"):
        ai_response_text = ai_response_text[:-3]
    
    execution_result = execute_action(ai_response_text.strip())
    
    return {"ai_response": ai_response_text, "execution_result": execution_result}


PREMADE_PROMPT = "Tell me a fun fact about the solar system."

@app.get("/generate")
def generate():
    """
    An endpoint to generate a response from the model with a premade prompt.
    """
    model = initialize_model()
    if not model:
        return {"error": "Model could not be initialized."}
    
    response = generate_prompt_response(model, PREMADE_PROMPT)
    return {"response": response}


@app.get("/buttons/", response_model=list[schemas.Item])
def read_items_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    items = crud.get_items(db, skip=skip, limit=limit)
    return items


@app.get("/buttons/{item_id}", response_model=schemas.Item)
def read_item_endpoint(item_id: int, db: Session = Depends(get_db)):
    db_item = crud.get_item(db, item_id=item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item




