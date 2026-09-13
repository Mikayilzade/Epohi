#!/usr/bin/env node
'use strict';

const manifest = require('./test-selection-manifest.json');
const fs = require('node:fs');
const path = require('node:path');

const DOC_PATTERNS = [/\.md$/i, /^docs\//, /^\.github\/codex\//];
const RUNTIME_PATTERNS = [/^src\//, /^styles\//, /^index\.html$/, /^sw\.js$/];
const VALID_TIERS = new Set([0, 1, 2, 3, 4]);
const VALID_BROWSER_POLICIES = new Set(['none', 'chromium', 'chromium+webkit', 'policy-driven']);
const CONDITION_FIELDS = new Set([
  'condition', 'specs', 'reason', 'browsers', 'minimumTier', 'fullRegression', 'soakRelevant'
]);
const BROWSER_POLICY_PRIORITY = ['none', 'chromium', 'policy-driven', 'chromium+webkit'];

function validateManifest(candidate, { rootDir = path.resolve(__dirname, '..') } = {}) {
  if (!candidate || !Array.isArray(candidate.areas)) throw new Error('Manifest areas must be an array.');
  if (!Number.isInteger(candidate.runtimeFileThreshold) || candidate.runtimeFileThreshold <= 0) {
    throw new Error('Manifest runtimeFileThreshold must be a positive integer.');
  }
  const areaIds = new Set();
  const overrideIds = new Set();
  const assertTier = (tier, label) => {
    if (!VALID_TIERS.has(tier)) throw new Error(`${label} has invalid tier: ${tier}.`);
  };
  const assertBrowsers = (browsers, label) => {
    if (!VALID_BROWSER_POLICIES.has(browsers)) throw new Error(`${label} has invalid browser policy: ${browsers}.`);
  };
  const assertSpec = (spec, label) => {
    if (typeof spec !== 'string' || !spec.endsWith('.spec.js') || !fs.existsSync(path.join(rootDir, spec))) {
      throw new Error(`${label} references missing or invalid spec: ${spec}.`);
    }
  };

  for (const area of candidate.areas) {
    if (typeof area.id !== 'string' || !area.id.trim()) throw new Error('Area ID must be a non-empty string.');
    if (areaIds.has(area.id)) throw new Error(`Duplicate area ID: ${area.id}.`);
    areaIds.add(area.id);
    if (!Array.isArray(area.paths) || area.paths.some((item) => typeof item !== 'string' || !item.trim())) {
      throw new Error(`Area ${area.id} paths must be an array of non-empty strings.`);
    }
    assertTier(area.minimumTier, `Area ${area.id}`);
    assertBrowsers(area.browsers, `Area ${area.id}`);
    for (const field of ['fullRegression', 'soakRelevant']) {
      if (typeof area[field] !== 'boolean') throw new Error(`Area ${area.id} ${field} must be boolean.`);
    }
    if (!Array.isArray(area.primarySpecs)) throw new Error(`Area ${area.id} primarySpecs must be an array.`);
    area.primarySpecs.forEach((spec) => assertSpec(spec, `Area ${area.id}`));
    if (area.checks !== undefined && (!Array.isArray(area.checks) || area.checks.some((item) => typeof item !== 'string' || !item.trim()))) {
      throw new Error(`Area ${area.id} checks must be an array of non-empty strings.`);
    }
    if (area.conditionalNeighbors !== undefined && !Array.isArray(area.conditionalNeighbors)) {
      throw new Error(`Area ${area.id} conditionalNeighbors must be an array.`);
    }
    if (area.caseOverrides !== undefined && !Array.isArray(area.caseOverrides)) {
      throw new Error(`Area ${area.id} caseOverrides must be an array.`);
    }

    const conditionIds = new Set();
    for (const neighbor of area.conditionalNeighbors || []) {
      const unknownFields = Object.keys(neighbor).filter((field) => !CONDITION_FIELDS.has(field));
      if (unknownFields.length) {
        throw new Error(`Condition ${area.id}/${neighbor.condition || '<missing>'} has unknown effect field(s): ${unknownFields.join(', ')}.`);
      }
      if (typeof neighbor.condition !== 'string' || !neighbor.condition.trim()) {
        throw new Error(`Area ${area.id} has a condition with a malformed ID.`);
      }
      if (conditionIds.has(neighbor.condition)) throw new Error(`Duplicate condition ID in area ${area.id}: ${neighbor.condition}.`);
      conditionIds.add(neighbor.condition);
      if (!Array.isArray(neighbor.specs)) throw new Error(`Condition ${area.id}/${neighbor.condition} specs must be an array.`);
      neighbor.specs.forEach((spec) => assertSpec(spec, `Condition ${area.id}/${neighbor.condition}`));
      if (neighbor.reason !== undefined && typeof neighbor.reason !== 'string') {
        throw new Error(`Condition ${area.id}/${neighbor.condition} reason must be a string.`);
      }
      if (neighbor.minimumTier !== undefined) assertTier(neighbor.minimumTier, `Condition ${area.id}/${neighbor.condition}`);
      if (neighbor.browsers !== undefined) assertBrowsers(neighbor.browsers, `Condition ${area.id}/${neighbor.condition}`);
      for (const field of ['fullRegression', 'soakRelevant']) {
        if (neighbor[field] !== undefined && typeof neighbor[field] !== 'boolean') {
          throw new Error(`Condition ${area.id}/${neighbor.condition} ${field} must be boolean.`);
        }
      }
    }

    for (const override of area.caseOverrides || []) {
      if (typeof override.id !== 'string' || !override.id.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(override.id)) {
        throw new Error(`Area ${area.id} has a case override with a malformed ID.`);
      }
      if (overrideIds.has(override.id)) throw new Error(`Duplicate case override ID: ${override.id}.`);
      overrideIds.add(override.id);
      assertSpec(override.spec, `Case override ${override.id}`);
      if (typeof override.grep !== 'string' || !override.grep.trim()) {
        throw new Error(`Case override ${override.id} grep must be a non-empty string.`);
      }
    }
  }
  return candidate;
}

validateManifest(manifest);

function matches(pattern, file) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(file);
}

function unique(values) {
  return [...new Set(values)];
}

function combineBrowserPolicies(policies) {
  return policies.reduce((selected, policy) =>
    BROWSER_POLICY_PRIORITY.indexOf(policy) > BROWSER_POLICY_PRIORITY.indexOf(selected) ? policy : selected, 'none');
}

function fullPlan(reason, matchedAreas = [], soakRelevant = false) {
  return {
    tier: 3,
    focusedSpecs: unique(matchedAreas.flatMap((area) => area.primarySpecs)),
    checks: unique(matchedAreas.flatMap((area) => area.checks || [])),
    caseOverrides: uniqueOverrides(matchedAreas.flatMap((area) => area.caseOverrides || [])),
    conditionalNeighbors: [],
    browsers: 'chromium+webkit',
    fullRegression: true,
    soakRelevant: soakRelevant || matchedAreas.some((area) => area.soakRelevant),
    fallbackReason: reason,
    matchedAreas: matchedAreas.map((area) => area.id)
  };
}

function uniqueOverrides(overrides) {
  return [...new Map(overrides.map((override) => [override.id, override])).values()];
}

function selectTests({ changedPaths = [], semanticAreas = [], conditions = [] } = {}) {
  const paths = unique(changedPaths.filter(Boolean));
  const semantics = unique(semanticAreas.filter(Boolean));
  const requestedConditions = new Set(conditions);
  const knownSemanticIds = new Set(manifest.areas.map((area) => area.id));
  const unknownSemantics = semantics.filter((id) => !knownSemanticIds.has(id));

  if (paths.length === 0 && semantics.length === 0) {
    return fullPlan('No change paths or semantic ownership were supplied.');
  }
  if (unknownSemantics.length) {
    return fullPlan(`Unknown semantic area: ${unknownSemantics.join(', ')}.`);
  }
  if (semantics.length === 0 && paths.length > 0 && paths.every((path) => DOC_PATTERNS.some((pattern) => pattern.test(path)))) {
    return {
      tier: 0, focusedSpecs: [], caseOverrides: [], conditionalNeighbors: [], browsers: 'none',
      checks: [], fullRegression: false, soakRelevant: false, fallbackReason: null, matchedAreas: ['documentation']
    };
  }

  const runtimeCount = paths.filter((path) => RUNTIME_PATTERNS.some((pattern) => pattern.test(path))).length;
  const matched = manifest.areas.filter((area) =>
    semantics.includes(area.id) || area.paths.some((pattern) => paths.some((path) => matches(pattern, path)))
  );
  const ownedPaths = paths.filter((path) => matched.some((area) => area.paths.some((pattern) => matches(pattern, path))));
  const changedSpecs = paths.filter((file) => /^tests\/.+\.spec\.js$/.test(file) && !ownedPaths.includes(file));
  const unknownPaths = paths.filter((file) => !DOC_PATTERNS.some((pattern) => pattern.test(file)) &&
    !ownedPaths.includes(file) && !changedSpecs.includes(file));

  if (runtimeCount >= manifest.runtimeFileThreshold) {
    return fullPlan(`${runtimeCount} runtime files meet the broad-change threshold of ${manifest.runtimeFileThreshold}.`, matched);
  }
  if (unknownPaths.length) {
    return fullPlan(`Unknown path ownership: ${unknownPaths.join(', ')}.`, matched);
  }
  if (matched.length === 0 && changedSpecs.length === 0) {
    return fullPlan('No manifest owner matched the supplied change.');
  }

  const neighbors = matched.flatMap((area) => area.conditionalNeighbors
    .filter((neighbor) => requestedConditions.has(neighbor.condition))
    .map((neighbor) => ({ area: area.id, ...neighbor })));
  const fullRegression = matched.some((area) => area.fullRegression) || neighbors.some((item) => item.fullRegression);
  const minimumTier = Math.max(changedSpecs.length ? 2 : 0, ...matched.map((area) => area.minimumTier), ...neighbors.map((item) => item.minimumTier || 0));
  const tier = fullRegression ? Math.max(3, minimumTier) : minimumTier;
  const specPolicies = changedSpecs.map((spec) => combineBrowserPolicies(manifest.areas
    .filter((area) => area.primarySpecs.includes(spec) || (area.conditionalNeighbors || []).some((item) => item.specs.includes(spec)))
    .map((area) => area.browsers).concat('chromium')));
  const browsers = fullRegression ? 'chromium+webkit' : combineBrowserPolicies(
    matched.map((area) => area.browsers).concat(neighbors.map((item) => item.browsers || 'none'), specPolicies)
  );

  return {
    tier,
    focusedSpecs: unique(matched.flatMap((area) => area.primarySpecs).concat(neighbors.flatMap((item) => item.specs), changedSpecs)),
    checks: unique(matched.flatMap((area) => area.checks || [])),
    caseOverrides: uniqueOverrides(matched.flatMap((area) => area.caseOverrides || [])),
    conditionalNeighbors: neighbors,
    browsers,
    fullRegression,
    soakRelevant: matched.some((area) => area.soakRelevant) || neighbors.some((item) => item.soakRelevant),
    fallbackReason: null,
    matchedAreas: matched.map((area) => area.id)
  };
}

function parseArguments(argv) {
  const options = { changedPaths: [], semanticAreas: [], conditions: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--changed') options.changedPaths.push(argv[++index]);
    else if (argument === '--semantic') options.semanticAreas.push(argv[++index]);
    else if (argument === '--condition') options.conditions.push(argv[++index]);
    else if (argument === '--help') options.help = true;
    else if (argument.startsWith('-')) throw new Error(`Unknown option: ${argument}`);
    else options.changedPaths.push(argument);
  }
  return options;
}

function usage() {
  return 'Usage: node scripts/select-tests.js [--changed PATH]... [--semantic AREA]... [--condition NAME]...';
}

if (require.main === module) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) console.log(usage());
    else console.log(JSON.stringify(selectTests(options), null, 2));
  } catch (error) {
    console.error(error.message);
    console.error(usage());
    process.exitCode = 2;
  }
}

module.exports = { combineBrowserPolicies, selectTests, validateManifest };
