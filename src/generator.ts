import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import type { ProjectPlan } from './types';

function run(cmd: string, cwd: string): Promise<{ code: number, stdout: string, stderr: string }> {
  return new Promise((resolve) => {
    const p = exec(cmd, { cwd, env: process.env });
    let stdout = ''; let stderr = '';
    p.stdout?.on('data', d => stdout += d.toString());
    p.stderr?.on('data', d => stderr += d.toString());
    p.on('close', code => resolve({ code: code ?? 0, stdout, stderr }));
  });
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeFileSafe(filePath: string, content: string) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, { encoding: 'utf8' });
}

function venvPythonPath(workspace: string) {
  const isWin = process.platform === 'win32';
  return isWin ? path.join(workspace, '.venv', 'Scripts', 'python.exe')
               : path.join(workspace, '.venv', 'bin', 'python');
}

export async function executePlan(plan: ProjectPlan, workspace: string, output: vscode.OutputChannel) {
  for (const step of plan.steps) {
    output.appendLine(`• ${step.title} (${step.action})`);
    switch (step.action) {
      case 'CREATE_FILE': {
        const [rel, content] = step.args ?? [];
        if (!rel) break;
        writeFileSafe(path.join(workspace, rel), content ?? '');
        break;
      }
      case 'APPEND_TO_FILE': {
        const [rel, content] = step.args ?? [];
        if (!rel) break;
        const filePath = path.join(workspace, rel);
        ensureDir(path.dirname(filePath));
        fs.appendFileSync(filePath, content ?? '', { encoding: 'utf8' });
        break;
      }
      case 'RUN_COMMAND': {
        const cmd = step.args?.[0];
        if (!cmd) break;
        const { code, stdout, stderr } = await run(cmd, workspace);
        output.appendLine(stdout);
        if (code !== 0) output.appendLine(`  ! command error: ${stderr}`);
        break;
      }
      default:
        output.appendLine(`  ! Skipped unsupported action: ${step.action}`);
        break;
    }
  }
  console.log('AutoEnv plan executed.');
}
