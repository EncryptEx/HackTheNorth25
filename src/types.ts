export type ProjectPlan = {
  language: 'python' | 'node';
  framework?: string;
  dependencies: string[];
  devDependencies?: string[];
  testFramework?: string;
  tools?: string[]; // e.g., 'pre-commit', 'black', 'ruff'
  createDevContainer?: boolean;
  steps: Array<{ title: string; action: string; args?: string[] }>;
};
