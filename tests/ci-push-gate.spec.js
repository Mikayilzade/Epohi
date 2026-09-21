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
  // Classification reasons are owned by map-ci-test-plan.js, not by this YAML.
  // Assert the workflow contract: PR synchronizations classify only the pushed
  // range, other PR events classify the whole PR, and both use the selector.
  expect(workflow).toContain('if [[ "$EVENT_ACTION" == "synchronize" ]]');
  expect(workflow).toContain('base_sha="${BEFORE_SHA:-}"');
  expect(workflow).toContain('head_sha="${AFTER_SHA:-}"');
  expect(workflow).toContain('base_sha="${PR_BASE_SHA:-}"');
  expect(workflow).toContain('head_sha="${PR_HEAD_SHA:-}"');
  expect(workflow).toContain('node scripts/map-ci-test-plan.js "${changed_paths[@]}"');
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

  expect(workflow).toContain('name: Full — ${{ matrix.browser }} — shard ${{ matrix.shard }}/3');
  expect(workflow).toContain("if: needs.classify-change.outputs.run_full == 'true'");
  expect(workflow).toContain('browser: [chromium, webkit]');
  expect(workflow).toContain('shard: [1, 2, 3]');
  expect(workflow).toContain('--shard=${{ matrix.shard }}/3');
  expect(workflow).toContain('--workers=1');

  expect(workflow).toContain('name: Soak — Chromium — seed ${{ matrix.seed }}');
  expect(workflow).toContain('seed: [10101, 20202, 30303, 40404, 50505]');
  expect(workflow).toContain('EPOHI_SOAK_MODE=long EPOHI_SOAK_SEED=${{ matrix.seed }}');
  expect(workflow).toContain('name: Soak — WebKit — seed ${{ matrix.seed }}');
  expect(workflow).toContain('seed: [10101, 30303]');
  expect(workflow).toContain('EPOHI_SOAK_MODE=short EPOHI_SOAK_SEED=${{ matrix.seed }}');
  expect(workflow).toContain("if: needs.classify-change.outputs.run_soak == 'true'");
  expect(workflow).toContain('fail-fast: false');
  expect(workflow).toContain('playwright-report/');
  expect(workflow).toContain('test-results/');

  expect(workflow).toContain('npx playwright install --with-deps ${{ matrix.browser }}');
  expect(workflow).toContain('npx playwright install --with-deps chromium');
  expect(workflow).toContain('npx playwright install --with-deps webkit');
});

test('first browser failure keeps structured and visual diagnostics', async () => {
  const config = fs.readFileSync(path.join(process.cwd(), 'playwright.config.js'), 'utf8');
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  expect(config).toContain("trace: 'retain-on-failure'");
  expect(config).toContain("screenshot: 'only-on-failure'");
  expect(config).toContain("video: 'retain-on-failure'");
  expect(config).toContain("['html', { open: 'never' }]");
  expect(config).toContain("['./scripts/failure-diagnostics-reporter.js']");
  expect(workflow).not.toContain('--reporter=line');
});
