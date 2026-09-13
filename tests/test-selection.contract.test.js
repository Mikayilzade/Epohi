'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const manifest = require('../scripts/test-selection-manifest.json');
const { selectTests, validateManifest } = require('../scripts/select-tests');

function manifestWith(mutate) {
  const candidate = structuredClone(manifest);
  mutate(candidate);
  return candidate;
}

test('documentation-only changes select Tier 0 and no browser', () => {
  const plan = selectTests({ changedPaths: ['CODEX_NEXT_TASK.md', 'docs/notes.md'] });
  assert.equal(plan.tier, 0);
  assert.equal(plan.browsers, 'none');
  assert.deepEqual(plan.focusedSpecs, []);
});

test('documentation paths do not discard an explicit runtime semantic area', () => {
  const plan = selectTests({
    changedPaths: ['CODEX_NEXT_TASK.md'], semanticAreas: ['component-ui']
  });
  assert.equal(plan.tier, 2);
  assert.equal(plan.browsers, 'chromium');
  assert.deepEqual(plan.matchedAreas, ['component-ui']);
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

test('layout condition adds mandatory WebKit to component UI coverage', () => {
  const plan = selectTests({
    changedPaths: ['src/humans-context-review-cleanup.js'], conditions: ['layout']
  });
  assert.equal(plan.tier, 2);
  assert.equal(plan.browsers, 'chromium+webkit');
  assert.equal(plan.fullRegression, false);
});

for (const condition of ['shared-schema', 'turn-yields']) {
  test(`worker ${condition} condition escalates to full cross-browser stability coverage`, () => {
    const plan = selectTests({
      changedPaths: ['src/humans-population-workforce.js'], conditions: [condition]
    });
    assert.equal(plan.tier, 3);
    assert.equal(plan.browsers, 'chromium+webkit');
    assert.equal(plan.fullRegression, true);
    assert.equal(plan.soakRelevant, true);
  });
}

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

test('four test-only files do not count toward the broad runtime threshold', () => {
  const plan = selectTests({ changedPaths: [
    'tests/browser.spec.js', 'tests/camera-2.spec.js',
    'tests/mobile-context.spec.js', 'tests/turn-unlock.spec.js'
  ] });
  assert.equal(plan.tier, 3);
  assert.equal(plan.fullRegression, true);
  assert.match(plan.fallbackReason, /Unknown path ownership/);
  assert.doesNotMatch(plan.fallbackReason, /broad-change threshold/);
});

test('0-AI smoke override selects a stable generated title only', () => {
  const plan = selectTests({ semanticAreas: ['browser-smoke'] });
  assert.equal(plan.caseOverrides.length, 1);
  assert.equal(plan.caseOverrides[0].grep, 'creates a new game with 0 AI and starts the map$');
  assert.doesNotMatch('creates a new game with 1 AI and starts the map', new RegExp(plan.caseOverrides[0].grep));
});

test('the checked-in manifest passes structural and referenced-spec validation', () => {
  assert.equal(validateManifest(manifest), manifest);
});

test('manifest validation rejects duplicate area IDs and invalid policy values', () => {
  assert.throws(() => validateManifest(manifestWith((candidate) => {
    candidate.areas[1].id = candidate.areas[0].id;
  })), /Duplicate area ID/);
  assert.throws(() => validateManifest(manifestWith((candidate) => {
    candidate.areas[0].minimumTier = 99;
  })), /invalid tier/);
  assert.throws(() => validateManifest(manifestWith((candidate) => {
    candidate.areas[0].browsers = 'netscape';
  })), /invalid browser policy/);
});

test('manifest validation rejects missing specs and malformed or duplicate case override IDs', () => {
  assert.throws(() => validateManifest(manifestWith((candidate) => {
    candidate.areas[0].primarySpecs = ['tests/does-not-exist.spec.js'];
  })), /missing or invalid spec/);
  assert.throws(() => validateManifest(manifestWith((candidate) => {
    candidate.areas.at(-1).caseOverrides[0].id = 'Not valid';
  })), /malformed ID/);
  assert.throws(() => validateManifest(manifestWith((candidate) => {
    candidate.areas[0].caseOverrides = [structuredClone(candidate.areas.at(-1).caseOverrides[0])];
  })), /Duplicate case override ID/);
});

test('manifest validation rejects unknown and malformed condition effects', () => {
  assert.throws(() => validateManifest(manifestWith((candidate) => {
    candidate.areas[2].conditionalNeighbors[0].browser = 'chromium+webkit';
  })), /unknown effect field/);
  assert.throws(() => validateManifest(manifestWith((candidate) => {
    candidate.areas[2].conditionalNeighbors[0].minimumTier = '3';
  })), /invalid tier/);
  assert.throws(() => validateManifest(manifestWith((candidate) => {
    candidate.areas[2].conditionalNeighbors[0].fullRegression = 'yes';
  })), /must be boolean/);
});
