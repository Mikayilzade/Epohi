'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { selectTests } = require('../scripts/select-tests');

test('documentation-only changes select Tier 0 and no browser', () => {
  const plan = selectTests({ changedPaths: ['CODEX_NEXT_TASK.md', 'docs/notes.md'] });
  assert.equal(plan.tier, 0);
  assert.equal(plan.browsers, 'none');
  assert.deepEqual(plan.focusedSpecs, []);
});

test('camera changes select camera coverage, mandatory WebKit, and full escalation', () => {
  const plan = selectTests({ changedPaths: ['src/camera.js'] });
  assert.equal(plan.tier, 3);
  assert.equal(plan.fullRegression, true);
  assert.equal(plan.browsers, 'chromium+webkit');
  assert.ok(plan.focusedSpecs.includes('tests/camera-2.spec.js'));
});

test('isolated component UI stays focused by default', () => {
  const plan = selectTests({ changedPaths: ['src/humans-context-review-cleanup.js'] });
  assert.equal(plan.tier, 2);
  assert.equal(plan.fullRegression, false);
  assert.deepEqual(plan.focusedSpecs, ['tests/context-review-cleanup.spec.js', 'tests/mobile-context.spec.js']);
});

test('pathfinding core is high-risk and full', () => {
  const plan = selectTests({ changedPaths: ['src/humans-pathing-core.js'] });
  assert.equal(plan.tier, 3);
  assert.equal(plan.fullRegression, true);
  assert.ok(plan.focusedSpecs.includes('tests/humans-pathing-performance.spec.js'));
});

test('save/schema changes fail closed to Tier 3 full', () => {
  const plan = selectTests({ changedPaths: ['src/save-utils.js'] });
  assert.equal(plan.tier, 3);
  assert.equal(plan.fullRegression, true);
  assert.equal(plan.soakRelevant, true);
});

test('localized worker change adds only explicitly implicated neighbors', () => {
  const focused = selectTests({ changedPaths: ['src/humans-population-workforce.js'] });
  assert.equal(focused.fullRegression, false);
  assert.ok(!focused.focusedSpecs.includes('tests/humans-autonomy.spec.js'));

  const withNeighbor = selectTests({
    changedPaths: ['src/humans-population-workforce.js'], conditions: ['autonomous-orders']
  });
  assert.ok(withNeighbor.focusedSpecs.includes('tests/humans-autonomy.spec.js'));
  assert.equal(withNeighbor.conditionalNeighbors[0].condition, 'autonomous-orders');
});

test('workflow changes follow infrastructure Tier 3 policy', () => {
  const plan = selectTests({ changedPaths: ['.github/workflows/playwright.yml'] });
  assert.equal(plan.tier, 3);
  assert.equal(plan.fullRegression, true);
  assert.equal(plan.browsers, 'chromium+webkit');
  assert.ok(plan.focusedSpecs.includes('tests/ci-push-gate.spec.js'));
});

test('unknown paths fail safe to Tier 3 full', () => {
  const plan = selectTests({ changedPaths: ['tools/unowned-generator.js'] });
  assert.equal(plan.tier, 3);
  assert.equal(plan.fullRegression, true);
  assert.match(plan.fallbackReason, /Unknown path ownership/);
});

test('four runtime files fail safe to Tier 3 full', () => {
  const plan = selectTests({ changedPaths: [
    'src/humans-context-review-cleanup.js', 'src/economy.js',
    'src/humans-worker-learning.js', 'styles/component.css'
  ] });
  assert.equal(plan.tier, 3);
  assert.equal(plan.fullRegression, true);
  assert.match(plan.fallbackReason, /broad-change threshold/);
});

test('0-AI smoke override selects a stable generated title only', () => {
  const plan = selectTests({ semanticAreas: ['browser-smoke'] });
  assert.equal(plan.caseOverrides.length, 1);
  assert.equal(plan.caseOverrides[0].grep, 'creates a new game with 0 AI and starts the map$');
  assert.doesNotMatch('creates a new game with 1 AI and starts the map', new RegExp(plan.caseOverrides[0].grep));
});
