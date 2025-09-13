import * as vscode from 'vscode';

export class PromptPanel {
  public static current: PromptPanel | undefined;
  private readonly panel: vscode.WebviewPanel;

  private constructor(panel: vscode.WebviewPanel) {
    this.panel = panel;
    this.panel.webview.html = this.html();
  }

  public static createOrShow() {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    const panel = vscode.window.createWebviewPanel('autoenvPrompt', 'AutoEnv: Describe your project', {
      viewColumn: column ?? vscode.ViewColumn.One
    }, { enableScripts: true });

    const instance = new PromptPanel(panel);
    this.current = instance;
    return instance;
  }

  public onMessage(handler: (msg: any) => void) {
    this.panel.webview.onDidReceiveMessage(handler);
  }

  public postMessage(msg: any) {
    this.panel.webview.postMessage(msg);
  }

  private html() {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AutoEnv</title></head>
      <body style="font-family: sans-serif; padding: 1rem;">
        <h2>Describe your project</h2>
        <p>Example: <code>A FastAPI backend with PostgreSQL and pytest, use a devcontainer</code></p>
        <textarea id="prompt" rows="6" style="width:100%;"></textarea>
        <div style="margin-top: 0.5rem;">
          <button id="go">Plan & Setup</button>
        </div>
        <script>
          const vscode = acquireVsCodeApi();
          document.getElementById('go').addEventListener('click', () => {
            vscode.postMessage({ type: 'submit', prompt: document.getElementById('prompt').value });
          });
        </script>
      </body>
      </html>
    `;
  }
}
