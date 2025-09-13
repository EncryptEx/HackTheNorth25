import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

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
    const htmlPath = path.join(__dirname, '..', 'media', 'prompt.html');
    try {
      return fs.readFileSync(htmlPath, 'utf8');
    } catch (e) {
      return '<html><body><p>Failed to load UI.</p></body></html>';
    }
  }
}
