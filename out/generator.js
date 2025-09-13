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
exports.executePlan = executePlan;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
function run(cmd, cwd) {
    return new Promise((resolve) => {
        const p = (0, child_process_1.exec)(cmd, { cwd, env: process.env });
        let stdout = '';
        let stderr = '';
        p.stdout?.on('data', (d) => (stdout += d.toString()));
        p.stderr?.on('data', (d) => (stderr += d.toString()));
        p.on('close', (code) => resolve({ code: code ?? 0, stdout, stderr }));
    });
}
function ensureDir(dir) {
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });
}
function writeFileSafe(filePath, content) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
}
function venvPythonPath(workspace) {
    const isWin = process.platform === 'win32';
    return isWin ? path.join(workspace, '.venv', 'Scripts', 'python.exe') : path.join(workspace, '.venv', 'bin', 'python');
}
async function executePlan(plan, workspace, output) {
    for (const step of plan.steps) {
        output.appendLine(`• ${step.title} (${step.action})`);
        switch (step.action) {
            case 'mkdir': {
                for (const d of step.args ?? [])
                    ensureDir(path.join(workspace, d));
                break;
            }
            case 'python-venv': {
                const target = step.args?.[0] ?? '.venv';
                const { code, stderr } = await run(`python -m venv ${target}`, workspace);
                if (code !== 0)
                    output.appendLine(`  ! venv error: ${stderr}`);
                break;
            }
            case 'write-file': {
                const [rel, content] = step.args ?? [];
                if (!rel)
                    break;
                writeFileSafe(path.join(workspace, rel), content ?? '');
                break;
            }
            case 'pip-install': {
                const py = venvPythonPath(workspace);
                const args = (step.args ?? []).join(' ');
                const { code, stderr } = await run(`${py} -m pip install --upgrade pip && ${py} -m pip install ${args}`, workspace);
                if (code !== 0)
                    output.appendLine(`  ! pip error: ${stderr}`);
                break;
            }
            case 'npm-init': {
                await run('npm init -y', workspace);
                break;
            }
            case 'npm-install': {
                const pkgs = (step.args ?? []).join(' ');
                if (pkgs)
                    await run(`npm install ${pkgs}`, workspace);
                break;
            }
            case 'npm-install-dev': {
                const pkgs = (step.args ?? []).join(' ');
                if (pkgs)
                    await run(`npm install -D ${pkgs}`, workspace);
                break;
            }
            case 'npm-scripts': {
                const mode = step.args?.[0] ?? 'js';
                const pkgPath = path.join(workspace, 'package.json');
                if (fs.existsSync(pkgPath)) {
                    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                    pkg.scripts = pkg.scripts || {};
                    if (mode === 'ts') {
                        pkg.type = 'module';
                        pkg.scripts.dev = 'ts-node-dev --respawn src/index.ts';
                        pkg.scripts.build = 'tsc';
                        pkg.scripts.start = 'node dist/index.js';
                    }
                    else {
                        pkg.type = 'module';
                        pkg.scripts.dev = 'nodemon src/index.js';
                        pkg.scripts.start = 'node src/index.js';
                    }
                    writeFileSafe(pkgPath, JSON.stringify(pkg, null, 2));
                }
                break;
            }
            case 'vscode-config': {
                // settings.json
                const settings = {
                    'python.defaultInterpreterPath': venvPythonPath(workspace),
                    'editor.formatOnSave': true
                };
                writeFileSafe(path.join(workspace, '.vscode', 'settings.json'), JSON.stringify(settings, null, 2));
                // tasks.json
                const tasks = {
                    version: '2.0.0',
                    tasks: [
                        {
                            label: 'Install Python Requirements',
                            type: 'shell',
                            command: `${venvPythonPath(workspace)} -m pip install -r requirements.txt`,
                            problemMatcher: []
                        },
                        {
                            label: 'Run App (Python)',
                            type: 'shell',
                            command: `${venvPythonPath(workspace)} -m uvicorn src.app:app --reload`,
                            problemMatcher: []
                        },
                        {
                            label: 'Run App (Node)',
                            type: 'npm',
                            script: 'dev'
                        }
                    ]
                };
                writeFileSafe(path.join(workspace, '.vscode', 'tasks.json'), JSON.stringify(tasks, null, 2));
                // launch.json
                const launch = {
                    version: '0.2.0',
                    configurations: [
                        {
                            name: 'Python: Uvicorn',
                            type: 'python',
                            request: 'launch',
                            module: 'uvicorn',
                            args: ['src.app:app', '--reload'],
                            justMyCode: true,
                            env: {}
                        },
                        {
                            name: 'Node: Dev',
                            type: 'node',
                            request: 'launch',
                            runtimeExecutable: 'npm',
                            runtimeArgs: ['run', 'dev'],
                            console: 'integratedTerminal',
                            skipFiles: ['<node_internals>/**']
                        }
                    ]
                };
                writeFileSafe(path.join(workspace, '.vscode', 'launch.json'), JSON.stringify(launch, null, 2));
                break;
            }
            case 'git-init': {
                await run('git init', workspace);
                writeFileSafe(path.join(workspace, '.gitignore'), ['.venv', 'node_modules', '.vscode/*.log', '__pycache__'].join('\n'));
                break;
            }
            case 'write-devcontainer': {
                const devJson = {
                    name: 'AutoEnv',
                    image: 'mcr.microsoft.com/devcontainers/python:3.11',
                    features: {
                        'ghcr.io/devcontainers/features/node:1': { version: '20' }
                    },
                    postCreateCommand: 'python -m venv .venv && . .venv/bin/activate || .venv\\Scripts\\activate && pip install -r requirements.txt || true'
                };
                writeFileSafe(path.join(workspace, '.devcontainer', 'devcontainer.json'), JSON.stringify(devJson, null, 2));
                writeFileSafe(path.join(workspace, '.devcontainer', 'Dockerfile'), '# Add customizations if needed\n');
                break;
            }
            default:
                // No-op for unknown actions
                break;
        }
    }
    vscode.window.showInformationMessage('AutoEnv plan executed.');
}
//# sourceMappingURL=generator.js.map