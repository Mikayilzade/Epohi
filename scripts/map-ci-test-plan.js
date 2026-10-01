#!/usr/bin/env node
'use strict';

const { selectTests } = require('./select-tests.js');

const VALID_BROWSERS = new Set(['none', 'chromium', 'chromium+webkit', 'policy-driven']);
const VALID_TIERS = new Set([0, 1, 2, 3, 4]);

function failSafe(reason) {
  return {
    tier: 3, reason: `selector-fail-safe:${reason}`, runStatic: true, runSelectorChecks: true,
    runFocused: false, runFocusedWebKit: false, runFull: true, runSoak: true, focusedTests: []
  };
}

function mapPlan(plan) {
  if (!plan || !VALID_TIERS.has(plan.tier) || !VALID_BROWSERS.has(plan.browsers) ||
      !Array.isArray(plan.focusedSpecs) || !Array.isArray(plan.checks) ||
      typeof plan.fullRegression !== 'boolean' || typeof plan.soakRelevant !== 'boolean') {
    return failSafe('invalid-plan');
  }
  if (plan.tier >= 3 && !plan.fullRegression) return failSafe('tier-3-without-full-regression');
  if (plan.fullRegression && plan.browsers !== 'chromium+webkit') return failSafe('full-without-cross-browser');

  const browserRequired = plan.tier === 2 && !plan.fullRegression;
  if (browserRequired && (plan.browsers === 'none' || plan.focusedSpecs.length === 0)) {
    return failSafe('invalid-focused-plan');
  }

  // policy-driven is deliberately conservative in automatic CI: cross-browser.
  const focusedWebKit = plan.browsers === 'chromium+webkit' || plan.browsers === 'policy-driven';
  return {
    tier: plan.tier,
    reason: plan.fallbackReason || `selector:${plan.matchedAreas.join(',')}`,
    runStatic: plan.tier > 0 || plan.checks.length > 0,
    runSelectorChecks: plan.checks.length > 0,
    runFocused: browserRequired,
    runFocusedWebKit: browserRequired && focusedWebKit,
    runFull: plan.fullRegression,
    runSoak: plan.soakRelevant,
    focusedTests: browserRequired ? plan.focusedSpecs : []
  };
}

function classify(changedPaths) {
  try {
    return mapPlan(selectTests({ changedPaths, ci: true }));
  } catch (error) {
    return failSafe(error && error.message ? error.message.replace(/\s+/g, ' ') : 'selector-error');
  }
}

if (require.main === module) console.log(JSON.stringify(classify(process.argv.slice(2))));

module.exports = { classify, failSafe, mapPlan };
