const { test, expect } = require('@playwright/test');
const { clearStorage, createGame } = require('./helpers');

test('runtime invalidation request storm stays below near-frame-rate flush cadence', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.EpohiRuntimeInvalidation));
  await page.waitForFunction(() => !window.EpohiRuntimeInvalidation.stats().scheduled);

  const result = await page.evaluate(async () => {
    const before = window.EpohiRuntimeInvalidation.stats();
    const started = performance.now();
    while (performance.now() - started < 400) {
      window.EpohiRuntimeInvalidation.request('cadence-regression');
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    const after = window.EpohiRuntimeInvalidation.stats();
    return {
      requests: after.requests - before.requests,
      flushes: after.flushes - before.flushes,
      scheduled: after.scheduled
    };
  });

  expect(result.requests).toBeGreaterThanOrEqual(25);
  expect(result.flushes).toBeLessThanOrEqual(12);
  expect(result.scheduled).toBe(false);
});

async function installAsyncCallbackAttribution(page) {
  await page.addInitScript(() => {
    if (window.__epohiFixtureAsyncAttributionInstalled) return;
    window.__epohiFixtureAsyncAttributionInstalled = true;

    const nativeSetTimeout = window.setTimeout.bind(window);
    const nativeSetInterval = window.setInterval.bind(window);
    const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
    const nativeQueueMicrotask = window.queueMicrotask ? window.queueMicrotask.bind(window) : null;
    const stats = {};
    let active = false;
    let snapshots = 0;

    function scheduleStack() {
      return String(new Error().stack || '')
        .split('\n')
        .slice(2, 7)
        .join(' <- ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function wrap(kind, callback) {
      if (typeof callback !== 'function') return callback;
      const stack = scheduleStack();
      return function (...args) {
        if (!active) return callback.apply(this, args);
        const started = performance.now();
        try {
          return callback.apply(this, args);
        } finally {
          const elapsed = performance.now() - started;
          const key = `${kind} :: ${stack || 'unknown'}`;
          const item = stats[key] || (stats[key] = { kind, stack, calls: 0, totalMs: 0, maxMs: 0 });
          item.calls += 1;
          item.totalMs += elapsed;
          item.maxMs = Math.max(item.maxMs, elapsed);
          if (elapsed >= 8 || item.calls === 1 || item.calls % 100 === 0) {
            console.log(`[fixture-async] ${kind} calls=${item.calls} lastMs=${elapsed.toFixed(1)} totalMs=${item.totalMs.toFixed(1)} maxMs=${item.maxMs.toFixed(1)} stack=${stack || 'unknown'}`);
          }
        }
      };
    }

    window.setTimeout = function (callback, delay, ...args) {
      return nativeSetTimeout(wrap('setTimeout', callback), delay, ...args);
    };
    window.setInterval = function (callback, delay, ...args) {
      return nativeSetInterval(wrap('setInterval', callback), delay, ...args);
    };
    window.requestAnimationFrame = function (callback) {
      return nativeRequestAnimationFrame(wrap('requestAnimationFrame', callback));
    };
    if (nativeQueueMicrotask) {
      window.queueMicrotask = function (callback) {
        return nativeQueueMicrotask(wrap('queueMicrotask', callback));
      };
    }

    function compact() {
      return Object.values(stats)
        .sort((a, b) => b.totalMs - a.totalMs || b.calls - a.calls)
        .slice(0, 12)
        .map(item => ({
          kind: item.kind,
          calls: item.calls,
          totalMs: Number(item.totalMs.toFixed(1)),
          maxMs: Number(item.maxMs.toFixed(1)),
          stack: item.stack
        }));
    }

    window.__epohiFixtureAsyncAttribution = {
      start() {
        Object.keys(stats).forEach(key => delete stats[key]);
        snapshots = 0;
        active = true;
        const timer = nativeSetInterval(() => {
          if (!active) return;
          console.log(`[fixture-async-snapshot] ${JSON.stringify(compact())}`);
          snapshots += 1;
          if (snapshots >= 8) window.clearInterval(timer);
        }, 250);
      },
      stop() {
        active = false;
        return compact();
      },
      snapshot: compact
    };
  });
}

async function installPostTurnOwnerAttribution(page) {
  await page.evaluate(() => {
    if (window.__epohiFixturePostTurnAttributionInstalled) return;
    window.__epohiFixturePostTurnAttributionInstalled = true;
    const stats = {};

    function wrap(owner, name, label) {
      if (!owner || typeof owner[name] !== 'function') return;
      const original = owner[name];
      if (original.__epohiFixtureOwnerWrapped) return;
      const wrapped = function (...args) {
        const started = performance.now();
        try {
          return original.apply(this, args);
        } finally {
          const elapsed = performance.now() - started;
          const item = stats[label] || (stats[label] = { calls: 0, totalMs: 0, maxMs: 0 });
          item.calls += 1;
          item.totalMs += elapsed;
          item.maxMs = Math.max(item.maxMs, elapsed);
          if (elapsed >= 25 || item.calls === 1 || item.calls % 25 === 0) {
            console.log(`[fixture-owner] ${label} calls=${item.calls} lastMs=${elapsed.toFixed(1)} totalMs=${item.totalMs.toFixed(1)} maxMs=${item.maxMs.toFixed(1)}`);
          }
        }
      };
      Object.defineProperty(wrapped, '__epohiFixtureOwnerWrapped', { value: true });
      owner[name] = wrapped;
    }

    wrap(window.EpohiStrategyUX, 'refresh', 'StrategyUX.refresh');
    wrap(window.EpohiPlayerFeedback, 'refresh', 'PlayerFeedback.refresh');
    wrap(window.EpohiHumansVisuals, 'decorate', 'HumansVisuals.decorate');
    wrap(window.EpohiContextReviewCleanup, 'sync', 'ContextReviewCleanup.sync');
    wrap(window.EpohiHumansJourney, 'sync', 'HumansJourney.sync');
    wrap(window.EpohiCombatWorldStability, 'render', 'CombatWorldStability.render');

    const stabilization = window.EpohiPlayerFeedbackStabilization;
    [
      'ensureStableControls',
      'preserveFreePlay',
      'stabilizeMovementExplanation',
      'expireSkippedJourneyEvents',
      'addStackSelectionAcknowledgement'
    ].forEach(name => wrap(stabilization, name, `PlayerFeedbackStabilization.${name}`));

    window.__epohiFixtureOwnerStats = stats;
    window.__epohiFixtureStartPostTurnSnapshots = function (beforeTurn) {
      let emitted = 0;
      const started = performance.now();
      const timer = setInterval(() => {
        const debug = window.__epohiDebug && window.__epohiDebug();
        if (!debug || !debug.state || debug.state.turn <= beforeTurn || debug.isTurnProcessing()) return;
        const compact = {};
        Object.keys(stats).forEach(label => {
          const item = stats[label];
          compact[label] = {
            calls: item.calls,
            totalMs: Number(item.totalMs.toFixed(1)),
            maxMs: Number(item.maxMs.toFixed(1))
          };
        });
        console.log(`[fixture-owner-snapshot] afterIdleMs=${(performance.now() - started).toFixed(1)} stats=${JSON.stringify(compact)}`);
        emitted += 1;
        if (emitted >= 4) clearInterval(timer);
      }, 125);
    };
  });
}

test('synthetic joint-war End Turn emits retained phase timing', async ({ page }) => {
  const phases = [];
  const owners = [];
  const asyncOwners = [];
  page.on('console', message => {
    const text = message.text();
    if (text.startsWith('[fixture-phase]')) {
      phases.push(text);
      console.log(`EPOHI_FIXTURE_PHASE ${text}`);
      return;
    }
    if (text.startsWith('[fixture-owner]') || text.startsWith('[fixture-owner-snapshot]')) {
      owners.push(text);
      console.log(`EPOHI_FIXTURE_OWNER ${text}`);
      return;
    }
    if (text.startsWith('[fixture-async]') || text.startsWith('[fixture-async-snapshot]')) {
      asyncOwners.push(text);
      console.log(`EPOHI_FIXTURE_ASYNC ${text}`);
    }
  });

  await installAsyncCallbackAttribution(page);
  await clearStorage(page);
  await createGame(page, 2, 'small');
  await page.waitForFunction(() => window.EpohiCombatWorldStability && window.__epohiDebug().state);
  await installPostTurnOwnerAttribution(page);

  const setup = await page.evaluate(() => {
    const gs = window.__epohiDebug().state;
    const [ally, target] = gs.rivals;
    ally.met = target.met = true;
    ally.relation = 'ally';
    target.relation = 'neutral';
    ally.diplomacy[target.civilizationId] = 'neutral';
    ally.diplomacy.grievances = 0;
    ally.diplomacy.trust = 80;
    ally.units = [];
    target.units = [];
    gs.barbarians = [];
    gs.diplomaticProposals = [];
    const modulo = (Number(String(ally.civilizationId).replace(/\D/g, '')) || 0) % 4;
    gs.turn = (modulo || 4) - 1;
    window.__epohiFixtureStartPostTurnSnapshots(gs.turn);
    window.__epohiFixtureAsyncAttribution.start();
    return { ally: ally.civilizationId, target: target.civilizationId, beforeTurn: gs.turn };
  });

  const started = Date.now();
  try {
    await page.getByRole('button', { name: /Завершить ход/i }).click();
    await page.waitForFunction(
      beforeTurn => window.__epohiDebug().state.turn > beforeTurn && !window.__epohiDebug().isTurnProcessing(),
      setup.beforeTurn
    );
  } finally {
    console.log(`EPOHI_FIXTURE_END_TURN totalMs=${Date.now() - started} phases=${JSON.stringify(phases)} owners=${JSON.stringify(owners)} async=${JSON.stringify(asyncOwners)}`);
  }

  const proposal = await page.evaluate(({ ally, target }) => window.__epohiDebug().state.diplomaticProposals.find(
    item => item.type === 'jointWar' && item.civId === ally && item.targetId === target
  ), setup);
  expect(proposal).toMatchObject({ type: 'jointWar', status: 'pending' });
});
