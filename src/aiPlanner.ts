import type { ProjectPlan } from './types';


export async function planFromPrompt(prompt: string): Promise<ProjectPlan> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY env variable not set');

  const SYSTEM_PROMPT = `
  System prompt:
You are an expert software project planner. Given a user prompt, you will create a detailed project plan in JSON format. Only use the following actions in the steps array:
- CREATE_FILE: { args: [relativePath: string, content: string] }
- APPEND_TO_FILE: { args: [relativePath: string, content: string] }
- RUN_COMMAND: { args: [command: string] }

The plan should include the following fields:
- language: string (e.g., "python")
- framework: string | undefined (e.g., "fastapi")
- dependencies: string[] (list of runtime dependencies)
- devDependencies: string[] (list of development dependencies)
- tools: string[] (list of tools to use, e.g., "black", "ruff")
- createDevContainer: boolean (whether to create a dev container)
- steps: { title: string, action: "CREATE_FILE" | "APPEND_TO_FILE" | "RUN_COMMAND", args?: any[] }[] (ordered steps to set up the project)

Example output:
{
  "language": "python",
  "framework": "fastapi",
  "dependencies": ["fastapi", "uvicorn"],
  "devDependencies": ["pytest"],
  "tools": ["black", "ruff"],
  "createDevContainer": true,
  "steps": [
    { "title": "Create app file", "action": "CREATE_FILE", "args": ["src/app.py", "from fastapi import FastAPI\\napp = FastAPI()\\n"] },
    { "title": "Add requirements", "action": "CREATE_FILE", "args": ["requirements.txt", "fastapi\\nuvicorn"] },
    { "title": "Install dependencies", "action": "RUN_COMMAND", "args": ["pip install -r requirements.txt"] },
    { "title": "Add test config", "action": "CREATE_FILE", "args": ["pytest.ini", "[pytest]\\naddopts = -q"] },
    { "title": "Append to README", "action": "APPEND_TO_FILE", "args": ["README.md", "# FastAPI Project\\n"] }
  ]
}
Respond ONLY with the JSON object. Do not respond with \`\`\`.`;


  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: SYSTEM_PROMPT + " User prompt: " + prompt }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${await response.text()}`);
  }
  const data = await response.json() as any;
  // Expecting the model to return a JSON string for ProjectPlan in the first candidate
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Gemini');
  try {
    const cleaned = text
  .replace(/^```json\s*/i, '')
  .replace(/^```\s*/i, '')
  .replace(/```$/i, '')
  .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error('Failed to parse ProjectPlan from Gemini response: ' + text);
  }
}
  
  

export async function fetchPossiblePreferences(prompt: string): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY env variable not set');

  const SYSTEM_PROMPT = `
  System prompt:
  Fetch by category a bunch of moslt popular set of preferences for setting up a development environment.
  Example. User asks for Django, you return:
  {
    "imageUrl": "https://static.djangoproject.com/img/logos/django-logo-negative.png",
    "preferences": [
      "Version": [
        "Latest stable",
        "Django 4.2",
        "Django 3.2 LTS",
        "Django 2.2 LTS"
      ],
      "Database": [
        "SQLite (default)",
        "PostgreSQL",
        "MySQL",
        "MariaDB",
        "Oracle"
      ],
      "Deployment": [
        "Heroku",
        "AWS Elastic Beanstalk",
        "Google App Engine",
        "Docker"
      ],
      "Testing Framework": [
        "pytest",
        "unittest (built-in)",
        "nose2"
      ],
      "Frontend Integration": [
        "None",
        "Django Templates",
        "React",
        "Vue.js",
        "Angular"
      ]
    ]
  }
  Respond ONLY with the JSON object. Do not respond with \`\`\`.
  `;

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: SYSTEM_PROMPT + " User prompt: " + prompt }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${await response.text()}`);
  }
  const data = await response.json() as any;
  // Expecting the model to return a JSON string for ProjectPlan in the first candidate
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Gemini');
  try {
    const cleaned = text
  .replace(/^```json\s*/i, '')
  .replace(/^```\s*/i, '')
  .replace(/```$/i, '')
  .trim();
    const obj = JSON.parse(cleaned);
    if (!obj?.preferences || typeof obj.preferences !== 'object') {
      throw new Error('Invalid preferences format');
    }
    // flatten to a single array of strings
    const prefs: string[] = [];
    for (const key of Object.keys(obj.preferences)) {
      if (Array.isArray(obj.preferences[key])) {
        prefs.push(...obj.preferences[key]);
      }
    }
    return prefs;
  } catch (e) {
    throw new Error('Failed to parse preferences from Gemini response: ' + text);
  }
}