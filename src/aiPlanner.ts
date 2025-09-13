import type { ProjectPlan } from './types';

/**
 * Mock rules engine that turns a user prompt into a structured ProjectPlan.
 * Replace this logic with a call to your LLM provider to generate the plan.
 */
export function planFromPrompt(prompt: string): ProjectPlan {
  const p = prompt.toLowerCase();
  const isPython = /(python|fastapi|flask|django|pandas|scikit|poetry|pip)/.test(p);
  const isNode = /(node|react|next|express|typescript|npm|pnpm|yarn)/.test(p);

  if (isPython && !isNode) {
    const useFastAPI = /fastapi/.test(p);
    const deps = ['uvicorn'];
    if (useFastAPI) deps.unshift('fastapi');

    const plan: ProjectPlan = {
      language: 'python',
      framework: useFastAPI ? 'fastapi' : undefined,
      dependencies: deps,
      devDependencies: ['pytest'],
      tools: ['black', 'ruff'],
      createDevContainer: /dev ?container|codespaces|docker/.test(p),
      steps: [
        { title: 'Create folders', action: 'mkdir', args: ['src', 'tests'] },
        { title: 'Create venv', action: 'python-venv', args: ['.venv'] },
        { title: 'Write requirements', action: 'write-file', args: ['requirements.txt', deps.join('\n')] },
        { title: 'Install deps', action: 'pip-install', args: ['-r', 'requirements.txt'] },
        { title: 'Write pytest config', action: 'write-file', args: ['pytest.ini', '[pytest]\naddopts = -q'] },
        { title: 'Write app stub', action: 'write-file', args: ['src/app.py', useFastAPI ? "from fastapi import FastAPI\napp = FastAPI()\n\n@app.get('/')\ndef read_root():\n    return {'hello':'world'}\n" : "# TODO: your app here\n"] },
        { title: 'Write .vscode', action: 'vscode-config' },
        { title: 'Init git', action: 'git-init' },
      ]
    };
    if (plan.createDevContainer) {
      plan.steps.push({ title: 'Write Dev Container', action: 'write-devcontainer' });
    }
    return plan;
  }

  // Default to Node/Express if Node-ish terms present
  const useExpress = /(express|api)/.test(p);
  const useTS = /(typescript|ts)/.test(p);
  const deps: string[] = [];
  if (useExpress) deps.push('express');

  const devDeps = ['nodemon'];
  if (useTS) devDeps.push('typescript', '@types/node', '@types/express', 'ts-node', 'ts-node-dev');

  const plan: ProjectPlan = {
    language: 'node',
    framework: useExpress ? 'express' : undefined,
    dependencies: deps,
    devDependencies: devDeps,
    testFramework: 'vitest',
    createDevContainer: /dev ?container|codespaces|docker/.test(p),
    steps: [
      { title: 'npm init', action: 'npm-init' },
      { title: 'Install deps', action: 'npm-install', args: deps },
      { title: 'Install devDeps', action: 'npm-install-dev', args: devDeps },
      { title: 'Create folders', action: 'mkdir', args: ['src', 'tests'] },
      { title: 'Write server stub', action: 'write-file', args: ['src/index.' + (useTS ? 'ts' : 'js'), useExpress ? "import express from 'express'\nconst app = express()\napp.get('/', (_, res)=>res.json({hello:'world'}))\napp.listen(3000)\n" : "console.log('Hello World')\n"] },
      { title: 'Write package scripts', action: 'npm-scripts', args: [useTS ? 'ts' : 'js'] },
      { title: 'Write .vscode', action: 'vscode-config' },
      { title: 'Init git', action: 'git-init' },
    ]
  };
  if (plan.createDevContainer) {
    plan.steps.push({ title: 'Write Dev Container', action: 'write-devcontainer' });
  }
  return plan;
}
