import * as vscode from 'vscode';
import { PromptPanel } from './promptPanel';
import { fetchPossiblePreferences, planFromPrompt } from './aiPlanner';
import { executePlan } from './generator';
import * as dotenv from "dotenv";
import { initializeButtonModule, getAllButtons, createButton, deleteButton } from './buttons';

import { Preference } from './buttons';



export function activate(context: vscode.ExtensionContext) {
  dotenv.config({ path: __dirname + "/../.env" });
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log(`API key is ${apiKey}`);
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
        
        console.log('buttons:create recieved');
        createButton({ name: String(data.name), img: String(data.img || ''), text: String(data.text || ''), preferences: data.preferences || {} });
        panel.postMessage({ type: 'buttons:data', items: getAllButtons() });
        
      }
      if (msg?.type === 'buttons:delete') {
        const id = Number(msg.id);
        if (!Number.isFinite(id)) return;
        deleteButton(id);
        panel.postMessage({ type: 'buttons:data', items: getAllButtons() });
      }

      if (msg?.type === 'fetchPreferences') {
        const prompt = String(msg.prompt || '').trim();
        if (!prompt) {
          panel.postMessage({ type: 'fetchPreferences:response', prefs: [] });
          return;
        }
        // use fetchPreferences from aiPlanner
        fetchPossiblePreferences(prompt).then((prefs) => {
          // update button
          const button = getAllButtons().find(b => b.name === prompt);
          if (button) {
            console.log(prefs);   
            // send a message to the webview with the preferences
            panel.postMessage({ type: 'button:found', prefs: prefs, button: button });
          }
        });
      }
  });

  context.subscriptions.push(disposable);
});
}