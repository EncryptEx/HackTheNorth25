import * as vscode from 'vscode';
import { PromptPanel } from './promptPanel';
import { planFromPrompt } from './aiPlanner';
import { executePlan } from './generator';

export function activate(context: vscode.ExtensionContext) {
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
        const plan = planFromPrompt(prompt);
        const ok = await vscode.window.showInformationMessage(
          'AutoEnv will create files and install dependencies in this workspace. Proceed?',
          { modal: true },
          'Yes'
        );
        if (ok === 'Yes') {
          output.show(true);
          output.appendLine('== AutoEnv Plan ==');
          output.appendLine(JSON.stringify(plan, null, 2));
          await executePlan(plan, ws, output);
        }
      }
    });
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
