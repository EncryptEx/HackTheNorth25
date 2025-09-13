"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptPanel = void 0;
const vscode = __importStar(require("vscode"));
class PromptPanel {
    static current;
    panel;
    constructor(panel) {
        this.panel = panel;
        this.panel.webview.html = this.html();
    }
    static createOrShow() {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        const panel = vscode.window.createWebviewPanel('autoenvPrompt', 'AutoEnv: Describe your project', {
            viewColumn: column ?? vscode.ViewColumn.One
        }, { enableScripts: true });
        const instance = new PromptPanel(panel);
        this.current = instance;
        return instance;
    }
    onMessage(handler) {
        this.panel.webview.onDidReceiveMessage(handler);
    }
    postMessage(msg) {
        this.panel.webview.postMessage(msg);
    }
    html() {
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
exports.PromptPanel = PromptPanel;
//# sourceMappingURL=promptPanel.js.map