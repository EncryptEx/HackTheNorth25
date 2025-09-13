import os
import argparse
import google.generativeai as genai

# --- Configuration ---
# 1. Install the library:
#    pip install google-generativeai
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

def main():
    """Main function to run the prompt engineering script."""
    parser = argparse.ArgumentParser(description="Prompt engineering script for Gemini models.")
    parser.add_argument("prompt", type=str, help="The prompt to send to the model.")
    parser.add_argument("--model", type=str, default="gemini-1.5-flash-latest", help="The model to use (e.g., gemini-1.5-flash-latest).")
    args = parser.parse_args()

    print(f"Initializing model: {args.model}...")
    model = initialize_model(args.model)

    if model:
        print(f"Sending prompt: '{args.prompt}'")
        print("-" * 20)
        response = generate_prompt_response(model, args.prompt)
        print("Model Response:")
        print(response)

if __name__ == "__main__":
    main()
