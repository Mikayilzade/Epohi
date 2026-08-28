const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const workflowPath = path.join(
  process.cwd(),
  '.github',
  'workflows',
  'diplomacy-activity-events-temp.yml'
);

function pullRequestBlock(workflow) {
  const start = workflow.indexOf('  pull_request:');
  const end = workflow.indexOf('  workflow_dispatch:', start);
  if (start < 0 || end < 0) return '';
  return workflow.slice(start, end);
}

test('status/docs-only pushes cannot cancel a validating code checkpoint', async () => {
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  const block = pullRequestBlock(workflow);

  // Keep the durable trigger allowlist restricted to code/test/runtime paths for the
  // point where this workflow definition lives on the PR base.
  expect(block).toContain('    paths:');
  for (const requiredPath of [
    '.github/workflows/diplomacy-activity-events-temp.yml',
    'playwright.config.js',
    'package.json',
    'package-lock.json',
    'src/**',
    'tests/**',
    'index.html',
    'sw.js',
  ]) {
    expect(block).toContain(`      - ${requiredPath}`);
  }

  expect(block).not.toContain('AUTONOMY_STATUS.md');
  expect(block).not.toMatch(/-\s+\*\*\/\*\.md/);

  // On a pull_request workflow GitHub evaluates event trigger eligibility from the
  // base-side workflow definition. While this gate only exists on the Draft PR branch,
  // a docs/status synchronize can still start a detector-only run. It must never cancel
  // a source/test run that is already validating the previous checkpoint.
  expect(workflow).toContain('cancel-in-progress: false');
  expect(workflow).toContain('Detect meaningful source change');
  expect(workflow).toContain('run_browser_gate=false');
});
