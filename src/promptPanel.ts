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
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>AutoEnv</title>
        <style>
          body { font-family: sans-serif; padding: 1rem; }
          .row { display: flex; gap: 2rem; align-items: flex-start; }
          .col { flex: 1; min-width: 280px; }
          label { display:block; font-size: 12px; color: #666; margin-top: .5rem; }
          input, textarea { width: 100%; box-sizing: border-box; }
          .btn { margin-top: .5rem; }
          .card { border: 1px solid #ddd; border-radius: 6px; padding: .5rem .75rem; margin-bottom: .5rem; }
          .card h4 { margin: .25rem 0; }
          .card img { max-width: 100%; height: auto; display: block; margin: .25rem 0; }
          .muted { color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="row">
          <div class="col">
            <h2>Describe your project</h2>
            <p>Example: <code>A FastAPI backend with PostgreSQL and pytest, use a devcontainer</code></p>
            <textarea id="prompt" rows="6"></textarea>
            <div class="btn">
              <button id="go">Plan & Setup</button>
            </div>
          </div>

          <div class="col">
            <h2>Buttons</h2>
            <div class="card">
              <h4>Create a Button</h4>
              <label for="btn-name">Name</label>
              <input id="btn-name" type="text" placeholder="Button name" />
              <label for="btn-img">Image URL</label>
              <input id="btn-img" type="url" placeholder="https://..." />
              <label for="btn-text">Long Text</label>
              <textarea id="btn-text" rows="5" placeholder="Enter long description..."></textarea>
              <div class="btn"><button id="btn-add">Add Button</button></div>
            </div>
            <div id="buttons-list" class="col"></div>
          </div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();

          // Existing: run plan
          document.getElementById('go').addEventListener('click', () => {
            vscode.postMessage({ type: 'submit', prompt: document.getElementById('prompt').value });
          });

          // Render buttons list
          function renderButtons(items = []) {
            const container = document.getElementById('buttons-list');
            if (!Array.isArray(items) || items.length === 0) {
              container.innerHTML = '<p class="muted">No buttons yet. Create the first one above.</p>';
              return;
            }
            container.innerHTML = items.map(function(b){
              const safeName = String(b.name || '');
              const safeImg = b.img ? '<img src="' + String(b.img) + '" alt="' + safeName + '">' : '';
              const safeText = String(b.text || '').replace(/</g,'&lt;').replace(/>/g,'&gt;');
              return '<div class="card">' +
                     '<h4>' + safeName + '</h4>' +
                     safeImg +
                     '<pre style="white-space: pre-wrap;">' + safeText + '</pre>' +
                     '</div>';
            }).join('');
          }

          // Receive data from extension
          window.addEventListener('message', (event) => {
            const msg = event.data;
            if (msg?.type === 'buttons:data') {
              renderButtons(msg.items || []);
            }
          });

          // Form: create button
          document.getElementById('btn-add').addEventListener('click', () => {
            const name = String(document.getElementById('btn-name').value || '').trim();
            const img = String(document.getElementById('btn-img').value || '').trim();
            const text = String(document.getElementById('btn-text').value || '').trim();
            if (!name) {
              alert('Please provide a name');
              return;
            }
            vscode.postMessage({ type: 'buttons:create', data: { name, img, text } });
            // Optionally clear the form
            document.getElementById('btn-name').value = '';
            document.getElementById('btn-img').value = '';
            document.getElementById('btn-text').value = '';
          });

          // On load: request list
          vscode.postMessage({ type: 'buttons:list' });
        </script>
      </body>
      </html>
    `;
  }
}
