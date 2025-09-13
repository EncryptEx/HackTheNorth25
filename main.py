import os
import google.generativeai as genai
from fastapi import FastAPI

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

app = FastAPI()

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

