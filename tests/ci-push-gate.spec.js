const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const workflowPath = path.join(
  process.cwd(),
  '.github',
  'workflows',
  'playwright.yml'
);

function eventBlock(workflow, eventName, nextEventName) {
  const start = workflow.indexOf(`  ${eventName}:`);
  const end = workflow.indexOf(`  ${nextEventName}:`, start);
  if (start < 0 || end < 0) return '';
  return workflow.slice(start, end);
}

test('permanent Playwright workflow gates source/test/runtime changes on push and PR', async () => {
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  const push = eventBlock(workflow, 'push', 'pull_request');
  const pullRequest = eventBlock(workflow, 'pull_request', 'workflow_dispatch');

  for (const block of [push, pullRequest]) {
    expect(block).toContain('    paths:');
    for (const requiredPath of [
      '.github/workflows/playwright.yml',
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
  }

  expect(workflow).toContain('workflow_dispatch:');
  expect(workflow).toContain('cancel-in-progress: false');
  expect(workflow).not.toContain('codex/work-on-existing-pr-and-follow-instructions');
  expect(workflow).not.toContain('codex-tgmou0');
  expect(workflow).not.toContain('diplomacy-activity-events-temp.yml');
});

test('permanent workflow runs focused, full and autonomous soak gates', async () => {
  const workflow = fs.readFileSync(workflowPath, 'utf8');

  expect(workflow).toContain('Focused mobile runtime — Chromium and WebKit');
  expect(workflow).toContain('Full mobile regression — Chromium and WebKit');
  expect(workflow).toContain('npx playwright test --grep-invert @soak --project=chromium-mobile');
  expect(workflow).toContain('npx playwright test --grep-invert @soak --project=webkit-mobile');

  expect(workflow).toContain('Autonomous soak — Chromium long matrix');
  expect(workflow).toContain('EPOHI_SOAK_MODE=long npx playwright test tests/autonomous-soak.spec.js --project=chromium-mobile');
  expect(workflow).toContain('Autonomous soak — WebKit representative matrix');
  expect(workflow).toContain('EPOHI_SOAK_MODE=short npx playwright test tests/autonomous-soak.spec.js --project=webkit-mobile');

  expect(workflow).toContain('npx playwright install --with-deps chromium webkit');
  expect(workflow).toContain('npx playwright install --with-deps chromium');
  expect(workflow).toContain('npx playwright install --with-deps webkit');
});
