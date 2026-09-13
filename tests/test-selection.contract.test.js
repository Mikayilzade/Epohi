'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const manifest = require('../scripts/test-selection-manifest.json');
const { combineBrowserPolicies, selectTests, validateManifest } = require('../scripts/select-tests');
const { classify, failSafe, mapPlan } = require('../scripts/map-ci-test-plan');
const workflow = require('node:fs').readFileSync(require('node:path').join(__dirname, '../.github/workflows/playwright.yml'), 'utf8');

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

test('automatic CI conservatively applies component layout browser escalation', () => {
  const plan = classify(['src/humans-context-review-cleanup.js']);
  assert.equal(plan.tier, 2);
  assert.equal(plan.runFocused, true);
  assert.equal(plan.runFocusedWebKit, true);
  assert.equal(plan.runFull, false);
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

test('automatic CI conservatively applies every worker escalation-capable condition', () => {
  const selected = selectTests({ changedPaths: ['src/humans-population-workforce.js'], ci: true });
  assert.deepEqual(selected.conditionalNeighbors.map(({ condition }) => condition), ['turn-yields', 'shared-schema']);
  const plan = classify(['src/humans-population-workforce.js']);
  assert.equal(plan.tier, 3);
  assert.equal(plan.runFull, true);
  assert.equal(plan.runSoak, true);
  assert.equal(plan.runFocused, false);
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

test('multiple test-only files stay focused and do not count toward the broad runtime threshold', () => {
  const plan = selectTests({ changedPaths: [
    'tests/population-workforce.spec.js', 'tests/resource-worker.spec.js',
    'tests/context-review-cleanup.spec.js', 'tests/turn-label-idempotence.spec.js'
  ] });
  assert.equal(plan.tier, 2);
  assert.equal(plan.fullRegression, false);
  assert.equal(plan.fallbackReason, null);
  assert.deepEqual(plan.focusedSpecs, [
    'tests/population-workforce.spec.js', 'tests/resource-worker.spec.js',
    'tests/context-review-cleanup.spec.js', 'tests/turn-label-idempotence.spec.js'
  ]);
});

test('an isolated ordinary spec edit selects that exact spec in Chromium', () => {
  const plan = selectTests({ changedPaths: ['tests/turn-label-idempotence.spec.js'] });
  assert.equal(plan.tier, 2);
  assert.equal(plan.browsers, 'chromium');
  assert.deepEqual(plan.focusedSpecs, ['tests/turn-label-idempotence.spec.js']);
  assert.equal(plan.fullRegression, false);
});

test('a known WebKit-sensitive spec edit stays focused and adds WebKit', () => {
  const plan = selectTests({ changedPaths: ['tests/camera-2.spec.js'] });
  assert.equal(plan.tier, 2);
  assert.equal(plan.browsers, 'chromium+webkit');
  assert.deepEqual(plan.focusedSpecs, ['tests/camera-2.spec.js']);
  assert.equal(plan.fullRegression, false);
});

test('the shared Playwright helper still escalates to Tier 3 full', () => {
  const plan = selectTests({ changedPaths: ['tests/helpers.js'] });
  assert.equal(plan.tier, 3);
  assert.equal(plan.browsers, 'chromium+webkit');
  assert.equal(plan.fullRegression, true);
});

test('a soak-test-only change runs the soak gates without ordinary browser duplication', () => {
  const plan = classify(['tests/autonomous-soak.spec.js']);
  assert.equal(plan.tier, 1);
  assert.equal(plan.runStatic, true);
  assert.equal(plan.runFocused, false);
  assert.equal(plan.runFull, false);
  assert.equal(plan.runSoak, true);
});

test('selector tooling declares cheap checks and no gameplay browser by itself', () => {
  const plan = selectTests({ changedPaths: ['scripts/select-tests.js'] });
  assert.equal(plan.tier, 0);
  assert.equal(plan.browsers, 'none');
  assert.equal(plan.fullRegression, false);
  assert.deepEqual(plan.checks, [
    'node --check scripts/select-tests.js', 'node --check scripts/map-ci-test-plan.js',
    'node --test tests/test-selection.contract.test.js'
  ]);
});

test('selector tooling cannot weaken a runtime plan', () => {
  const plan = selectTests({ changedPaths: ['scripts/select-tests.js', 'src/camera.js'] });
  assert.equal(plan.tier, 3);
  assert.equal(plan.browsers, 'chromium+webkit');
  assert.equal(plan.fullRegression, true);
  assert.equal(plan.checks.length, 3);
});

test('browser policies compose without downgrading stronger requirements', () => {
  assert.equal(combineBrowserPolicies(['none']), 'none');
  assert.equal(combineBrowserPolicies(['none', 'chromium']), 'chromium');
  assert.equal(combineBrowserPolicies(['chromium', 'policy-driven']), 'policy-driven');
  assert.equal(combineBrowserPolicies(['policy-driven', 'chromium+webkit']), 'chromium+webkit');
});

test('CI mapping preserves focused and full routing without duplicate browser work', () => {
  assert.deepEqual(classify(['CODEX_NEXT_TASK.md']), {
    tier: 0, reason: 'selector:documentation', runStatic: false, runSelectorChecks: false,
    runFocused: false, runFocusedWebKit: false, runFull: false, runSoak: false, focusedTests: []
  });
  const ordinary = classify(['tests/turn-label-idempotence.spec.js']);
  assert.deepEqual(ordinary.focusedTests, ['tests/turn-label-idempotence.spec.js']);
  assert.equal(ordinary.runFocused, true);
  assert.equal(ordinary.runFocusedWebKit, false);
  const sensitive = classify(['tests/camera-2.spec.js']);
  assert.equal(sensitive.runFocusedWebKit, true);
  const full = classify(['src/camera.js']);
  assert.equal(full.runFull, true);
  assert.equal(full.runFocused, false);
  assert.equal(full.runSoak, true);
});

test('selector-tooling CI runs whitelisted checks without gameplay browsers', () => {
  const plan = classify(['scripts/select-tests.js']);
  assert.equal(plan.runStatic, true);
  assert.equal(plan.runSelectorChecks, true);
  assert.equal(plan.runFocused, false);
  assert.equal(plan.runFull, false);
});

test('invalid selector plans fail safe to full cross-browser and soak', () => {
  for (const invalid of [null, {}, {
    tier: 2, browsers: 'none', focusedSpecs: [], checks: [], fullRegression: false, soakRelevant: false
  }, {
    tier: 3, browsers: 'chromium+webkit', focusedSpecs: [], checks: [], fullRegression: false, soakRelevant: false
  }]) {
    const plan = mapPlan(invalid);
    assert.equal(plan.runFull, true);
    assert.equal(plan.runSoak, true);
    assert.equal(plan.runFocused, false);
  }
  assert.equal(failSafe('crash').tier, 3);
});

test('workflow retains event/range semantics and hard-coded safe execution', () => {
  assert.match(workflow, /push:\n    branches:\n      - main/);
  assert.match(workflow, /EVENT_ACTION[\s\S]*== "synchronize"[\s\S]*base_sha="\$\{BEFORE_SHA:-\}"[\s\S]*head_sha="\$\{AFTER_SHA:-\}"/);
  assert.match(workflow, /git diff --name-only -z/);
  assert.match(workflow, /selector-fail-safe:workflow-or-range-error/);
  assert.match(workflow, /node scripts\/map-ci-test-plan\.js "\$\{changed_paths\[@\]\}"/);
  assert.doesNotMatch(workflow, /\beval\b|bash -c/);
  assert.match(workflow, /node --test tests\/test-selection\.contract\.test\.js/);
  assert.match(workflow, /if: needs\.classify-change\.outputs\.run_full == 'true'/);
  assert.match(workflow, /if: needs\.classify-change\.outputs\.run_soak == 'true'/);
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
    candidate.areas.find(({ id }) => id === 'app-bootstrap').conditionalNeighbors[0].browser = 'chromium+webkit';
  })), /unknown effect field/);
  assert.throws(() => validateManifest(manifestWith((candidate) => {
    candidate.areas.find(({ id }) => id === 'app-bootstrap').conditionalNeighbors[0].minimumTier = '3';
  })), /invalid tier/);
  assert.throws(() => validateManifest(manifestWith((candidate) => {
    candidate.areas.find(({ id }) => id === 'app-bootstrap').conditionalNeighbors[0].fullRegression = 'yes';
  })), /must be boolean/);
  assert.throws(() => validateManifest(manifestWith((candidate) => {
    candidate.areas.find(({ id }) => id === 'app-bootstrap').conditionalNeighbors[0].reason = 42;
  })), /reason must be a string/);
});

test('manifest validation rejects malformed top-level and area structures', () => {
  for (const value of [0, -1, 1.5, '4']) {
    assert.throws(() => validateManifest(manifestWith((candidate) => {
      candidate.runtimeFileThreshold = value;
    })), /positive integer/);
  }
  assert.throws(() => validateManifest(manifestWith((candidate) => {
    candidate.areas[0].paths = [''];
  })), /paths must be an array of non-empty strings/);
  assert.throws(() => validateManifest(manifestWith((candidate) => {
    candidate.areas[0].fullRegression = 'false';
  })), /fullRegression must be boolean/);
  assert.throws(() => validateManifest(manifestWith((candidate) => {
    candidate.areas[0].soakRelevant = null;
  })), /soakRelevant must be boolean/);
  assert.throws(() => validateManifest(manifestWith((candidate) => {
    candidate.areas[0].conditionalNeighbors = {};
  })), /conditionalNeighbors must be an array/);
  assert.throws(() => validateManifest(manifestWith((candidate) => {
    candidate.areas[0].caseOverrides = {};
  })), /caseOverrides must be an array/);
});

test('manifest validation rejects duplicate condition IDs and malformed optional checks', () => {
  assert.throws(() => validateManifest(manifestWith((candidate) => {
    candidate.areas.find(({ id }) => id === 'app-bootstrap').conditionalNeighbors.push(structuredClone(candidate.areas.find(({ id }) => id === 'app-bootstrap').conditionalNeighbors[0]));
  })), /Duplicate condition ID/);
  assert.throws(() => validateManifest(manifestWith((candidate) => {
    candidate.areas[0].checks = [''];
  })), /checks must be an array of non-empty strings/);
});
