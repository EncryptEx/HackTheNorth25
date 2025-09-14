import * as vscode from 'vscode';
import { PromptPanel } from './promptPanel';
import { planFromPrompt } from './aiPlanner';
import { executePlan } from './generator';
import * as dotenv from "dotenv";
import { initializeButtonModule, getAllButtons, createButton, deleteButton } from './buttons';




export function activate(context: vscode.ExtensionContext) {
  dotenv.config({ path: __dirname + "/../.env" });
  const apiKey = process.env.GEMINI_API_KEY;
  
  // vscode.window.showInformationMessage(`API key is ${apiKey}`);
  initializeButtonModule(context);
  
  const output = vscode.window.createOutputChannel('AutoEnv');
  const disposable = vscode.commands.registerCommand('autoenv.newProject', async () => {
    const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!ws) {
      vscode.window.showErrorMessage('Open a folder (File → Open Folder) first.');
      return;
    }

    const panel = PromptPanel.createOrShow();
  panel.onMessage(async (msg) => {
      if (msg?.type === 'submit') {
        const prompt = String(msg.prompt || '').trim();
        if (!prompt) {
          vscode.window.showWarningMessage('Please describe your project.');
          return;
        }
        output.show(true);
        output.appendLine('Generating plan with Gemini...');
        let plan;
        try {
          plan = await planFromPrompt(prompt);
        } catch (e: any) {
          vscode.window.showErrorMessage('Failed to generate plan: ' + (e?.message || e));
          output.appendLine('Error: ' + (e?.message || e));
          return;
        }
        const ok = await vscode.window.showInformationMessage(
          'AutoEnv will create files and install dependencies in this workspace. Proceed?',
          { modal: true },
          'Yes'
        );
        if (ok === 'Yes') {
          output.appendLine('== AutoEnv Plan ==');
          output.appendLine(JSON.stringify(plan, null, 2));
          await executePlan(plan, ws, output);
        }
      }
      if (msg?.type === 'buttons:list') {
        panel.postMessage({ type: 'buttons:data', items: getAllButtons() });
      }
      if (msg?.type === 'buttons:create') {
        const data = msg.data || {};
        // basic validation
        if (!data.name) {
          vscode.window.showWarningMessage('Button name is required.');
        } else {
          createButton({ name: String(data.name), img: String(data.img || ''), text: String(data.text || '') });
          panel.postMessage({ type: 'buttons:data', items: getAllButtons() });
        }
      }
      if (msg?.type === 'buttons:delete') {
        const id = Number(msg.id);
        if (!Number.isFinite(id)) return;
        deleteButton(id);
        panel.postMessage({ type: 'buttons:data', items: getAllButtons() });
      }
    });
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
