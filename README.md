# AutoEnv Wizard (VS Code Extension)

Spin up a ready-to-code environment from a plain-English prompt.

## Features
- Prompt-driven setup: describe your project and AutoEnv generates a plan.
- Scaffolds folders and starter files.
- Creates and configures a Python virtual environment (or Node project) automatically.
- Installs dependencies and writes VS Code settings (`.vscode/settings.json`, `tasks.json`, `launch.json`).
- Optional Dev Container template.
- Pluggable AI: swap the simple rules engine with any LLM provider.

## Quick Start (Dev)
1. Install dependencies: `npm install`
2. Build: `npm run compile`
3. Press `F5` in VS Code to launch the Extension Development Host.
4. Run command **AutoEnv: New Project from Prompt** (`Ctrl/Cmd+Shift+P`).
5. Enter a prompt like: `A FastAPI backend with PostgreSQL and pytest`.

## Configure AI (Optional)
Replace the mock planner in `src/aiPlanner.ts` with your LLM of choice. Provide API keys via environment variables and add a provider SDK.

## Notes
- The extension writes files to the **current workspace** folder. It will ask for confirmation before creating or overwriting anything.
- Python support expects `python` on PATH. Node support expects `node` and `npm` on PATH.
