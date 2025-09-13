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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const promptPanel_1 = require("./promptPanel");
const aiPlanner_1 = require("./aiPlanner");
const generator_1 = require("./generator");
function activate(context) {
    const output = vscode.window.createOutputChannel('AutoEnv');
    const disposable = vscode.commands.registerCommand('autoenv.newProject', async () => {
        const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!ws) {
            vscode.window.showErrorMessage('Open a folder (File → Open Folder) first.');
            return;
        }
        const panel = promptPanel_1.PromptPanel.createOrShow();
        panel.onMessage(async (msg) => {
            if (msg?.type === 'submit') {
                const prompt = String(msg.prompt || '').trim();
                if (!prompt) {
                    vscode.window.showWarningMessage('Please describe your project.');
                    return;
                }
                const plan = (0, aiPlanner_1.planFromPrompt)(prompt);
                const ok = await vscode.window.showInformationMessage('AutoEnv will create files and install dependencies in this workspace. Proceed?', { modal: true }, 'Yes');
                if (ok === 'Yes') {
                    output.show(true);
                    output.appendLine('== AutoEnv Plan ==');
                    output.appendLine(JSON.stringify(plan, null, 2));
                    await (0, generator_1.executePlan)(plan, ws, output);
                }
            }
        });
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map