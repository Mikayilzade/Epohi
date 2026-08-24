const { test, expect } = require('@playwright/test');
const { watchConsole, expectNoConsoleProblems, clearStorage, createGame } = require('./helpers');

async function installObserverAttribution(page) {
  await page.addInitScript(() => {
    if (window.__epohiObserverAttributionInstalled || typeof window.MutationObserver !== 'function') return;
    const NativeObserver = window.MutationObserver;
    const nativeObserve = NativeObserver.prototype.observe;
    const nativeDisconnect = NativeObserver.prototype.disconnect;
    const nativeTakeRecords = NativeObserver.prototype.takeRecords;
    let nextId = 1;
    const entries = [];

    function targetLabel(target) {
      if (!target) return 'unknown';
      if (target === document) return '#document';
      if (target === document.documentElement) return 'html';
      if (target === document.body) return 'body';
      if (target.id) return '#' + target.id;
      const tag = target.tagName ? target.tagName.toLowerCase() : target.nodeName || 'node';
      const classes = target.classList && target.classList.length ? '.' + Array.from(target.classList).slice(0, 3).join('.') : '';
      return tag + classes;
    }

    function cleanOptions(options) {
      const value = options || {};
      return {
        attributes: !!value.attributes,
        childList: !!value.childList,
        subtree: !!value.subtree,
        characterData: !!value.characterData,
        attributeFilter: Array.isArray(value.attributeFilter) ? value.attributeFilter.slice() : []
      };
    }

    function entryFor(observer) {
      const id = observer && observer.__epohiObserverAttributionId;
      return entries.find(item => item.id === id) || null;
    }

    function TrackingMutationObserver(callback) {
      const id = nextId++;
      const entry = {
        id,
        nativeCallbacks: 0,
        records: 0,
        registrations: [],
        mutationTargets: {},
        observeStack: ''
      };
      entries.push(entry);
      const observer = new NativeObserver((records) => {
        const batch = Array.from(records || []);
        entry.nativeCallbacks += 1;
        entry.records += batch.length;
        batch.forEach(record => {
          const label = targetLabel(record && record.target);
          entry.mutationTargets[label] = (entry.mutationTargets[label] || 0) + 1;
        });
        callback(records, observer);
      });
      Object.defineProperty(observer, '__epohiObserverAttributionId', { value: id });
      return observer;
    }

    TrackingMutationObserver.prototype = Object.create(NativeObserver.prototype);
    TrackingMutationObserver.prototype.constructor = TrackingMutationObserver;
    TrackingMutationObserver.prototype.observe = function (target, options) {
      const entry = entryFor(this);
      if (entry) {
        const label = targetLabel(target);
        const existing = entry.registrations.find(item => item.target === label);
        const registration = { target: label, options: cleanOptions(options) };
        if (existing) Object.assign(existing, registration);
        else entry.registrations.push(registration);
        if (!entry.observeStack) {
          entry.observeStack = String(new Error().stack || '').split('\n').slice(1, 9).join('\n');
        }
      }
      return nativeObserve.call(this, target, options);
    };
    TrackingMutationObserver.prototype.disconnect = function () {
      return nativeDisconnect.call(this);
    };
    TrackingMutationObserver.prototype.takeRecords = function () {
      return nativeTakeRecords.call(this);
    };
    Object.setPrototypeOf(TrackingMutationObserver, NativeObserver);

    window.MutationObserver = TrackingMutationObserver;
    window.__epohiObserverAttributionInstalled = true;
    window.__epohiObserverAttribution = {
      snapshot: () => entries.map(entry => ({
        id: entry.id,
        nativeCallbacks: entry.nativeCallbacks,
        records: entry.records,
        registrations: entry.registrations.map(item => ({ target: item.target, options: Object.assign({}, item.options) })),
        mutationTargets: Object.assign({}, entry.mutationTargets),
        observeStack: entry.observeStack
      }))
    };
  });
}

async function openGame(page, rivals = 1) {
  const problems = watchConsole(page);
  await clearStorage(page);
  await createGame(page, rivals, 'small');
  await page.waitForFunction(() => Boolean(
    window.EpohiEventOverlayPolicy &&
    window.EpohiDiplomacyCoherence &&
    window.EpohiWorkerLearning &&
    window.EpohiPerformance &&
    window.EpohiHumansObserver &&
    window.__epohiDebug &&
    window.__epohiDebug().state &&
    window.__epohiObserverSafetyStats
  ));
  return problems;
}

async function callbackCount(page) {
  return page.evaluate(() => Number(window.__epohiObserverSafetyStats && window.__epohiObserverSafetyStats.callbacks || 0));
}

test.describe('Mobile runtime stability', () => {
  test('pending diplomacy proposal becomes idle and remains clickable', async ({ page }) => {
    const problems = await openGame(page, 1);
    const proposalId = await page.evaluate(() => {
      const gs = window.__epohiDebug().state;
      const civ = gs.rivals[0];
      civ.met = true;
      civ.relation = 'neutral';
      civ.diplomacy = civ.diplomacy || {};
      civ.diplomacy.trust = 60;
      const item = window.EpohiLivingCivilizations.createProposal(gs, civ, 'gift', 'Проверочное дипломатическое предложение.');
      window.EpohiDiplomacyCoherence.renderProposal(gs);
      return String(item.id);
    });

    await expect(page.locator('#coherenceProposalModal')).toHaveClass(/show/);
    await page.waitForTimeout(300);
    const before = await callbackCount(page);
    await page.waitForTimeout(400);
    const after = await callbackCount(page);
    expect(after - before).toBeLessThanOrEqual(6);

    await page.locator('#coherenceProposalModal [data-coherence-proposal-answer="yes"]').click({ timeout: 1000 });
    await page.waitForFunction((id) => {
      const item = window.__epohiDebug().state.diplomaticProposals.find(entry => String(entry.id) === id);
      return item && item.status !== 'pending';
    }, proposalId, { timeout: 1000 });
    await expect(page.locator('#coherenceProposalModal')).not.toHaveClass(/show/);
    await expectNoConsoleProblems(problems);
  });

  test('selected worker context does not keep mutating every animation frame', async ({ page }) => {
    const problems = await openGame(page, 0);
    await page.evaluate(() => {
      const gs = window.__epohiDebug().state;
      let worker = gs.units.find(unit => unit.type === 'worker');
      if (!worker) {
        const city = gs.cities[0];
        const def = window.EpohiData.UNIT_DEFS.worker;
        worker = {
          id:'perf-worker', type:'worker', x:city.x, y:city.y,
          moves:def.maxMoves || 1, acted:false,
          hp:def.maxHealth, maxHp:def.maxHealth, name:'Рабочий тест'
        };
        gs.units.push(worker);
      }
      const tile = gs.map[worker.y][worker.x];
      tile.revealed = true;
      window.__epohiDebug().render();
      const node = document.querySelector(`#map .tile[data-x="${worker.x}"][data-y="${worker.y}"]`);
      if (node) node.click();
      if (window.EpohiContextReviewCleanup && window.EpohiContextReviewCleanup.selectStackUnit) {
        window.EpohiContextReviewCleanup.selectStackUnit(worker.id);
      }
    });

    await page.waitForTimeout(300);
    const before = await callbackCount(page);
    await page.waitForTimeout(400);
    const after = await callbackCount(page);
    expect(after - before).toBeLessThanOrEqual(6);
    await expectNoConsoleProblems(problems);
  });

  test('opening city sheet stays open and heavy observers are quarantined', async ({ page }) => {
    const problems = await openGame(page, 0);
    await page.evaluate(() => {
      const gs = window.__epohiDebug().state;
      const city = gs.cities[0];
      window.__epohiDebug().render();
      const tile = document.querySelector(`#map .tile[data-x="${city.x}"][data-y="${city.y}"]`);
      const piece = tile && (tile.querySelector('.piece.city') || tile.querySelector('.city-pop'));
      if (piece) piece.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true, view:window }));
    });

    const openCity = page.locator('#contextActions [data-context-action="open-city"]');
    await expect(openCity).toBeVisible({ timeout: 1500 });
    await openCity.click({ timeout: 1000 });
    await expect(page.locator('#cityModal')).toHaveClass(/show/);

    await page.waitForTimeout(250);
    const before = await callbackCount(page);
    await page.waitForTimeout(700);
    const after = await callbackCount(page);
    await expect(page.locator('#cityModal')).toHaveClass(/show/);
    expect(after - before).toBeLessThanOrEqual(8);

    const snapshot = await page.evaluate(() => window.EpohiPerformance.snapshot());
    expect(snapshot.observerSuppressedHeavy).toBeGreaterThanOrEqual(2);
    expect(snapshot.observerNarrowedHeavy).toBeGreaterThanOrEqual(1);
    await expectNoConsoleProblems(problems);
  });

  test('observer sync is bounded and city sheet survives 30 explicit open-close cycles', async ({ page }) => {
    await installObserverAttribution(page);
    const problems = await openGame(page, 0);
    const architecture = await page.evaluate(() => window.EpohiHumansObserver.stats());
    expect(architecture.broadObservers).toBe(0);
    expect(architecture.narrowObservers).toBeLessThanOrEqual(2);

    const cityModal = page.locator('#cityModal');

    for (let i = 0; i < 30; i += 1) {
      await page.evaluate(() => document.getElementById('cityBtn').click());
      await expect(cityModal).toHaveClass(/show/);
      await page.evaluate(() => document.querySelector('[data-close="cityModal"]').click());
      await expect(cityModal).not.toHaveClass(/show/);
    }

    const before = await callbackCount(page);
    const observerBefore = await page.evaluate(() => window.EpohiHumansObserver.stats().syncs);
    const attributionBefore = await page.evaluate(() => window.__epohiObserverAttribution ? window.__epohiObserverAttribution.snapshot() : []);
    await page.waitForTimeout(900);
    const after = await callbackCount(page);
    const observerAfter = await page.evaluate(() => window.EpohiHumansObserver.stats().syncs);
    const attributionAfter = await page.evaluate(() => window.__epohiObserverAttribution ? window.__epohiObserverAttribution.snapshot() : []);
    const attributionDelta = attributionAfter.map(item => {
      const previous = attributionBefore.find(entry => entry.id === item.id) || { nativeCallbacks: 0, records: 0, mutationTargets: {} };
      const mutationTargets = {};
      Object.keys(item.mutationTargets || {}).forEach(key => {
        const delta = Number(item.mutationTargets[key] || 0) - Number(previous.mutationTargets && previous.mutationTargets[key] || 0);
        if (delta) mutationTargets[key] = delta;
      });
      return {
        id: item.id,
        nativeCallbacks: Number(item.nativeCallbacks || 0) - Number(previous.nativeCallbacks || 0),
        records: Number(item.records || 0) - Number(previous.records || 0),
        registrations: item.registrations,
        mutationTargets,
        observeStack: item.observeStack
      };
    }).filter(item => item.nativeCallbacks || item.records);

    await test.info().attach('observer-attribution.json', {
      body: Buffer.from(JSON.stringify({ callbackDelta: after - before, attributionDelta }, null, 2)),
      contentType: 'application/json'
    });
    console.log('EPOHI_OBSERVER_ATTRIBUTION ' + JSON.stringify({ callbackDelta: after - before, attributionDelta }));

    expect(after - before).toBeLessThanOrEqual(8);
    expect(observerAfter - observerBefore).toBeLessThanOrEqual(2);
    await expectNoConsoleProblems(problems);
  });
});
