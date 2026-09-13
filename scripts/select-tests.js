#!/usr/bin/env node
'use strict';

const manifest = require('./test-selection-manifest.json');

const DOC_PATTERNS = [/\.md$/i, /^docs\//, /^\.github\/codex\//];
const RUNTIME_PATTERNS = [/^src\//, /^styles\//, /^tests\//, /^index\.html$/, /^sw\.js$/];

function matches(pattern, file) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(file);
}

function unique(values) {
  return [...new Set(values)];
}

function fullPlan(reason, matchedAreas = [], soakRelevant = false) {
  return {
    tier: 3,
    focusedSpecs: unique(matchedAreas.flatMap((area) => area.primarySpecs)),
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
  if (paths.length > 0 && paths.every((path) => DOC_PATTERNS.some((pattern) => pattern.test(path)))) {
    return {
      tier: 0, focusedSpecs: [], caseOverrides: [], conditionalNeighbors: [], browsers: 'none',
      fullRegression: false, soakRelevant: false, fallbackReason: null, matchedAreas: ['documentation']
    };
  }

  const runtimeCount = paths.filter((path) => RUNTIME_PATTERNS.some((pattern) => pattern.test(path))).length;
  const matched = manifest.areas.filter((area) =>
    semantics.includes(area.id) || area.paths.some((pattern) => paths.some((path) => matches(pattern, path)))
  );
  const ownedPaths = paths.filter((path) => matched.some((area) => area.paths.some((pattern) => matches(pattern, path))));
  const unknownPaths = paths.filter((path) => !DOC_PATTERNS.some((pattern) => pattern.test(path)) && !ownedPaths.includes(path));

  if (runtimeCount >= manifest.runtimeFileThreshold) {
    return fullPlan(`${runtimeCount} runtime files meet the broad-change threshold of ${manifest.runtimeFileThreshold}.`, matched);
  }
  if (unknownPaths.length) {
    return fullPlan(`Unknown path ownership: ${unknownPaths.join(', ')}.`, matched);
  }
  if (matched.length === 0) {
    return fullPlan('No manifest owner matched the supplied change.');
  }

  const neighbors = matched.flatMap((area) => area.conditionalNeighbors
    .filter((neighbor) => requestedConditions.has(neighbor.condition))
    .map((neighbor) => ({ area: area.id, ...neighbor })));
  const fullRegression = matched.some((area) => area.fullRegression);
  const tier = fullRegression ? 3 : Math.max(...matched.map((area) => area.minimumTier));
  const browsers = fullRegression || matched.some((area) => area.browsers === 'chromium+webkit')
    ? 'chromium+webkit'
    : matched.some((area) => area.browsers === 'policy-driven') ? 'policy-driven' : 'chromium';

  return {
    tier,
    focusedSpecs: unique(matched.flatMap((area) => area.primarySpecs).concat(neighbors.flatMap((item) => item.specs))),
    caseOverrides: uniqueOverrides(matched.flatMap((area) => area.caseOverrides || [])),
    conditionalNeighbors: neighbors,
    browsers,
    fullRegression,
    soakRelevant: matched.some((area) => area.soakRelevant),
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

module.exports = { selectTests };
