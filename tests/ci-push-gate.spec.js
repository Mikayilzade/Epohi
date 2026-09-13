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

test('permanent Playwright workflow uses PR risk classification and avoids duplicate feature-branch push gates', async () => {
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  const push = eventBlock(workflow, 'push', 'pull_request');
  const pullRequest = eventBlock(workflow, 'pull_request', 'workflow_dispatch');

  expect(push).toContain('    branches:');
  expect(push).toContain('      - main');
  expect(push).toContain('    paths:');
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
    expect(push).toContain(`      - ${requiredPath}`);
  }

  // Pull requests must always reach the classifier. In particular, do not put
  // a PR-level paths filter here: docs-only synchronizations need to run the
  // lightweight classifier so it can skip the expensive browser jobs itself.
  expect(pullRequest).toContain('    types: [opened, synchronize, reopened, ready_for_review]');
  expect(pullRequest).not.toContain('    paths:');

  expect(workflow).toContain('workflow_dispatch:');
  expect(workflow).toContain('cancel-in-progress: true');
  expect(workflow).toContain('name: Classify CI scope');
  expect(workflow).toContain('Decide risk tier and test scope');
  expect(workflow).toContain('docs-or-checkpoint-only');
  expect(workflow).toContain('new-pr-sync-range');
  expect(workflow).toContain('final-or-main-gate');

  expect(workflow).not.toContain('codex/work-on-existing-pr-and-follow-instructions');
  expect(workflow).not.toContain('codex-tgmou0');
  expect(workflow).not.toContain('diplomacy-activity-events-temp.yml');
});

test('permanent workflow maps risk tiers to static, focused, full and soak gates', async () => {
  const workflow = fs.readFileSync(workflowPath, 'utf8');

  expect(workflow).toContain('name: Static integrity');
  expect(workflow).toContain("if: needs.classify-change.outputs.run_static == 'true'");

  expect(workflow).toContain('name: Focused browser regression');
  expect(workflow).toContain("if: needs.classify-change.outputs.run_focused == 'true'");
  expect(workflow).toContain('Focused Chromium');
  expect(workflow).toContain('Focused WebKit');
  expect(workflow).toContain("if: needs.classify-change.outputs.run_focused_webkit == 'true'");

  expect(workflow).toContain('name: Full Chromium + WebKit regression');
  expect(workflow).toContain("if: needs.classify-change.outputs.run_full == 'true'");
  expect(workflow).toContain('npx playwright test --grep-invert @soak --project=chromium-mobile');
  expect(workflow).toContain('npx playwright test --grep-invert @soak --project=webkit-mobile');

  expect(workflow).toContain('Autonomous soak — Chromium long matrix');
  expect(workflow).toContain('EPOHI_SOAK_MODE=long npx playwright test tests/autonomous-soak.spec.js --project=chromium-mobile');
  expect(workflow).toContain('Autonomous soak — WebKit representative matrix');
  expect(workflow).toContain('EPOHI_SOAK_MODE=short npx playwright test tests/autonomous-soak.spec.js --project=webkit-mobile');
  expect(workflow).toContain("if: needs.classify-change.outputs.run_soak == 'true'");

  expect(workflow).toContain('npx playwright install --with-deps chromium webkit');
  expect(workflow).toContain('npx playwright install --with-deps chromium');
  expect(workflow).toContain('npx playwright install --with-deps webkit');
});
