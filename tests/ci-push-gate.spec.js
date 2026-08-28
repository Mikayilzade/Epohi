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
  expect(workflow).toContain('cancel-in-progress: true');
});
