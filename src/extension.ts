import * as vscode from 'vscode';
import { PromptPanel } from './promptPanel';
import { fetchPossiblePreferences, planFromPrompt } from './aiPlanner';
import { executePlan } from './generator';
import * as dotenv from "dotenv";
import { initializeButtonModule, getAllButtons, createButton, deleteButton, updateButton } from './buttons';

import { Preference } from './buttons';



export function activate(context: vscode.ExtensionContext) {
  dotenv.config({ path: __dirname + "/../.env" });
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log(`API key is ${apiKey}`);
  initializeButtonModule(context);
  // Cache prepared preferences per button id for quick access in the webview
  const preparedPrefs = new Map<number, any>();
  
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
        console.log('buttons:create received');
        const newBtn = createButton({ name: String(data.name), img: String(data.img || ''), text: String(data.text || ''), preferences: data.preferences || {} });
        // Update list immediately so the new card appears
        panel.postMessage({ type: 'buttons:data', items: getAllButtons() });
        // Background: fetch preferences and image
        fetchPossiblePreferences(newBtn.name).then((prefs) => {
          preparedPrefs.set(newBtn.id, prefs);
          // Update image if provided
          if (prefs && prefs.imageUrl) {
            updateButton(newBtn.id, { img: String(prefs.imageUrl) });
            panel.postMessage({ type: 'buttons:data', items: getAllButtons() });
          }
          // Inform webview that prefs are ready for this button
          panel.postMessage({ type: 'preferences:prepared', id: newBtn.id, prefs });
        }).catch(err => {
          console.error('fetchPossiblePreferences failed:', err);
        });
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
          const button = getAllButtons().find(b => b.name === prompt);
          if (button) {
            preparedPrefs.set(button.id, prefs);
            if (prefs && prefs.imageUrl) {
              updateButton(button.id, { img: String(prefs.imageUrl) });
              panel.postMessage({ type: 'buttons:data', items: getAllButtons() });
            }
            panel.postMessage({ type: 'button:found', prefs, button });
          }
        }).catch(err => {
          console.error('fetchPreferences failed:', err);
        });
      }

      if (msg?.type === 'button:getByName') {
        const name = String(msg.name || '').trim();
        if (!name) return;
        const button = getAllButtons().find(b => b.name === name);
        if (button) {
          const prefs = preparedPrefs.get(button.id) || null;
          panel.postMessage({ type: 'button:found', button, prefs });
        }
      }

      if (msg?.type === 'button:saveText') {
        const id = Number(msg.id);
        const text = String(msg.text || '');
        if (!Number.isFinite(id) || !text) return;
        updateButton(id, { text });
        panel.postMessage({ type: 'buttons:data', items: getAllButtons() });
      }
  });

  context.subscriptions.push(disposable);
});
}