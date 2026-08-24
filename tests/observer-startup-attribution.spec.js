const { test, expect } = require('@playwright/test');
const { clearStorage, createGame } = require('./helpers');

async function installObserverAttribution(page) {
  await page.addInitScript(() => {
    if (window.__epohiStartupObserverAttributionInstalled || typeof window.MutationObserver !== 'function') return;
    const NativeObserver = window.MutationObserver;
    const nativeObserve = NativeObserver.prototype.observe;
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

    function TrackingMutationObserver(callback) {
      const id = nextId++;
      const entry = { id, nativeCallbacks: 0, records: 0, registrations: [], mutationTargets: {}, constructStack: String(new Error().stack || '').split('\n').slice(1, 9).join('\n'), observeStack: '' };
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
      Object.defineProperty(observer, '__epohiStartupObserverAttributionId', { value: id });
      return observer;
    }

    TrackingMutationObserver.prototype = Object.create(NativeObserver.prototype);
    TrackingMutationObserver.prototype.constructor = TrackingMutationObserver;
    TrackingMutationObserver.prototype.observe = function (target, options) {
      const entry = entries.find(item => item.id === this.__epohiStartupObserverAttributionId);
      if (entry) {
        entry.registrations.push({ target: targetLabel(target), options: cleanOptions(options) });
        if (!entry.observeStack) entry.observeStack = String(new Error().stack || '').split('\n').slice(1, 9).join('\n');
      }
      return nativeObserve.call(this, target, options);
    };
    Object.setPrototypeOf(TrackingMutationObserver, NativeObserver);
    window.MutationObserver = TrackingMutationObserver;
    window.__epohiStartupObserverAttributionInstalled = true;
    window.__epohiStartupObserverAttribution = { snapshot: () => entries.map(item => ({ ...item, registrations: item.registrations.map(reg => ({ target: reg.target, options: { ...reg.options } })), mutationTargets: { ...item.mutationTargets } })) };
  });
}

async function openGame(page) {
  await installObserverAttribution(page);
  await clearStorage(page);
  await createGame(page, 0, 'small');
  await page.waitForFunction(() => Boolean(window.__epohiDebug && window.__epohiDebug().state && window.__epohiObserverSafetyStats));
}

async function callbackCount(page) {
  return page.evaluate(() => Number(window.__epohiObserverSafetyStats && window.__epohiObserverSafetyStats.callbacks || 0));
}

async function snapshot(page) {
  return page.evaluate(() => window.__epohiStartupObserverAttribution ? window.__epohiStartupObserverAttribution.snapshot() : []);
}

function delta(after, before) {
  return after.map(item => {
    const previous = before.find(entry => entry.id === item.id) || { nativeCallbacks: 0, records: 0, mutationTargets: {} };
    const mutationTargets = {};
    Object.keys(item.mutationTargets || {}).forEach(key => {
      const value = Number(item.mutationTargets[key] || 0) - Number(previous.mutationTargets && previous.mutationTargets[key] || 0);
      if (value) mutationTargets[key] = value;
    });
    return {
      id: item.id,
      nativeCallbacks: Number(item.nativeCallbacks || 0) - Number(previous.nativeCallbacks || 0),
      records: Number(item.records || 0) - Number(previous.records || 0),
      registrations: item.registrations,
      mutationTargets,
      constructStack: item.constructStack,
      observeStack: item.observeStack
    };
  }).filter(item => item.nativeCallbacks || item.records);
}

async function attachDelta(page, name, callbackBefore, before, waitMs) {
  await page.waitForTimeout(waitMs);
  const callbackAfter = await callbackCount(page);
  const after = await snapshot(page);
  const payload = { callbackDelta: callbackAfter - callbackBefore, attributionDelta: delta(after, before) };
  await test.info().attach(name + '.json', { body: Buffer.from(JSON.stringify(payload, null, 2)), contentType: 'application/json' });
  console.log('EPOHI_STARTUP_OBSERVER_ATTRIBUTION ' + name + ' ' + JSON.stringify(payload));
  return payload;
}

test('startup attribution names selected-worker idle observer owners', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => {
    const gs = window.__epohiDebug().state;
    let worker = gs.units.find(unit => unit.type === 'worker');
    if (!worker) {
      const city = gs.cities[0];
      const def = window.EpohiData.UNIT_DEFS.worker;
      worker = { id:'diag-worker', type:'worker', x:city.x, y:city.y, moves:def.maxMoves || 1, acted:false, hp:def.maxHealth, maxHp:def.maxHealth, name:'Рабочий diagnostic' };
      gs.units.push(worker);
    }
    const tile = gs.map[worker.y][worker.x];
    tile.revealed = true;
    window.__epohiDebug().render();
    const node = document.querySelector(`#map .tile[data-x="${worker.x}"][data-y="${worker.y}"]`);
    if (node) node.click();
    if (window.EpohiContextReviewCleanup && window.EpohiContextReviewCleanup.selectStackUnit) window.EpohiContextReviewCleanup.selectStackUnit(worker.id);
  });
  await page.waitForTimeout(300);
  const callbackBefore = await callbackCount(page);
  const before = await snapshot(page);
  const payload = await attachDelta(page, 'selected-worker-idle', callbackBefore, before, 400);
  expect(payload.callbackDelta).toBeLessThanOrEqual(6);
});

test('startup attribution names 30-cycle post-idle observer owners', async ({ page }) => {
  await openGame(page);
  const cityModal = page.locator('#cityModal');
  for (let i = 0; i < 30; i += 1) {
    await page.evaluate(() => document.getElementById('cityBtn').click());
    await expect(cityModal).toHaveClass(/show/);
    await page.evaluate(() => document.querySelector('[data-close="cityModal"]').click());
    await expect(cityModal).not.toHaveClass(/show/);
  }
  const callbackBefore = await callbackCount(page);
  const before = await snapshot(page);
  const payload = await attachDelta(page, 'city-30-cycle-idle', callbackBefore, before, 900);
  expect(payload.callbackDelta).toBeLessThanOrEqual(8);
});
