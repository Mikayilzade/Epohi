const { test, expect } = require('@playwright/test');
const { clearStorage, createGame } = require('./helpers');

async function installObserverAttribution(page) {
  await page.addInitScript(() => {
    if (window.__epohiStartupObserverAttributionInstalled || typeof window.MutationObserver !== 'function') return;
    const NativeObserver = window.MutationObserver;
    const nativeObserve = NativeObserver.prototype.observe;
    const nativeTakeRecords = NativeObserver.prototype.takeRecords;
    const nativeRaf = window.requestAnimationFrame.bind(window);
    const nativeSetTimeout = window.setTimeout.bind(window);
    const nativeQueueMicrotask = typeof window.queueMicrotask === 'function'
      ? window.queueMicrotask.bind(window)
      : callback => Promise.resolve().then(callback);
    let nextId = 1;
    let currentObserverId = 0;
    const drainedOwnerQueue = [];
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

    function entryForId(id) {
      return entries.find(item => item.id === id) || null;
    }

    function entryFor(observer) {
      return entryForId(observer && observer.__epohiStartupObserverAttributionId);
    }

    function accountRecords(entry, records, source) {
      const batch = Array.from(records || []);
      if (!batch.length) return batch;
      entry.records += batch.length;
      if (source === 'takeRecords') {
        entry.drainedBatches += 1;
        entry.drainedRecords += batch.length;
        drainedOwnerQueue.push(entry.id);
      }
      batch.forEach(record => {
        const label = targetLabel(record && record.target);
        entry.mutationTargets[label] = (entry.mutationTargets[label] || 0) + 1;
        const typed = String(record && record.type || 'unknown') + ':' + label;
        entry.mutationTypes[typed] = (entry.mutationTypes[typed] || 0) + 1;
      });
      return batch;
    }

    function deliveryEntry(stack) {
      let ownerId = currentObserverId;
      if (!ownerId && drainedOwnerQueue.length && stack.indexOf('humans-performance.js') >= 0) {
        ownerId = drainedOwnerQueue.shift();
      }
      return entryForId(ownerId);
    }

    function markScheduled(entry, kind, stack) {
      if (!entry) return;
      entry.scheduledDeliveries += 1;
      entry.deliveryKinds[kind] = (entry.deliveryKinds[kind] || 0) + 1;
      if (!entry.deliveryScheduleStack) entry.deliveryScheduleStack = stack.split('\n').slice(1, 9).join('\n');
    }

    window.requestAnimationFrame = function (callback) {
      if (typeof callback !== 'function') return nativeRaf(callback);
      const stack = String(new Error().stack || '');
      const entry = deliveryEntry(stack);
      markScheduled(entry, 'requestAnimationFrame', stack);
      return nativeRaf(function (time) {
        if (entry) entry.executedDeliveries += 1;
        return callback(time);
      });
    };

    window.setTimeout = function (callback, delay) {
      const args = Array.prototype.slice.call(arguments, 2);
      if (typeof callback !== 'function') return nativeSetTimeout.apply(window, [callback, delay].concat(args));
      const stack = String(new Error().stack || '');
      const entry = deliveryEntry(stack);
      markScheduled(entry, 'setTimeout', stack);
      return nativeSetTimeout(function () {
        if (entry) entry.executedDeliveries += 1;
        return callback.apply(window, args);
      }, delay);
    };

    window.queueMicrotask = function (callback) {
      if (typeof callback !== 'function') return nativeQueueMicrotask(callback);
      const stack = String(new Error().stack || '');
      const entry = deliveryEntry(stack);
      markScheduled(entry, 'queueMicrotask', stack);
      return nativeQueueMicrotask(function () {
        if (entry) entry.executedDeliveries += 1;
        return callback();
      });
    };

    function TrackingMutationObserver(callback) {
      const id = nextId++;
      const entry = {
        id,
        nativeCallbacks: 0,
        records: 0,
        drainedBatches: 0,
        drainedRecords: 0,
        scheduledDeliveries: 0,
        executedDeliveries: 0,
        deliveryKinds: {},
        registrations: [],
        mutationTargets: {},
        mutationTypes: {},
        constructStack: String(new Error().stack || '').split('\n').slice(1, 9).join('\n'),
        observeStack: '',
        deliveryScheduleStack: ''
      };
      entries.push(entry);
      const observer = new NativeObserver((records) => {
        entry.nativeCallbacks += 1;
        accountRecords(entry, records, 'callback');
        const previous = currentObserverId;
        currentObserverId = id;
        try {
          callback(records, observer);
        } finally {
          currentObserverId = previous;
        }
      });
      Object.defineProperty(observer, '__epohiStartupObserverAttributionId', { value: id });
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
        if (!entry.observeStack) entry.observeStack = String(new Error().stack || '').split('\n').slice(1, 9).join('\n');
      }
      return nativeObserve.call(this, target, options);
    };
    TrackingMutationObserver.prototype.takeRecords = function () {
      const records = nativeTakeRecords.call(this);
      const entry = entryFor(this);
      if (entry) accountRecords(entry, records, 'takeRecords');
      return records;
    };
    Object.setPrototypeOf(TrackingMutationObserver, NativeObserver);
    window.MutationObserver = TrackingMutationObserver;
    window.__epohiStartupObserverAttributionInstalled = true;
    window.__epohiStartupObserverAttribution = {
      snapshot: () => entries.map(item => ({
        ...item,
        deliveryKinds: { ...item.deliveryKinds },
        registrations: item.registrations.map(reg => ({ target: reg.target, options: { ...reg.options } })),
        mutationTargets: { ...item.mutationTargets },
        mutationTypes: { ...item.mutationTypes }
      }))
    };
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

function objectDelta(current, previous) {
  const output = {};
  Object.keys(current || {}).forEach(key => {
    const value = Number(current[key] || 0) - Number(previous && previous[key] || 0);
    if (value) output[key] = value;
  });
  return output;
}

function delta(after, before) {
  return after.map(item => {
    const previous = before.find(entry => entry.id === item.id) || {
      nativeCallbacks: 0,
      records: 0,
      drainedBatches: 0,
      drainedRecords: 0,
      scheduledDeliveries: 0,
      executedDeliveries: 0,
      deliveryKinds: {},
      mutationTargets: {},
      mutationTypes: {}
    };
    return {
      id: item.id,
      nativeCallbacks: Number(item.nativeCallbacks || 0) - Number(previous.nativeCallbacks || 0),
      records: Number(item.records || 0) - Number(previous.records || 0),
      drainedBatches: Number(item.drainedBatches || 0) - Number(previous.drainedBatches || 0),
      drainedRecords: Number(item.drainedRecords || 0) - Number(previous.drainedRecords || 0),
      scheduledDeliveries: Number(item.scheduledDeliveries || 0) - Number(previous.scheduledDeliveries || 0),
      executedDeliveries: Number(item.executedDeliveries || 0) - Number(previous.executedDeliveries || 0),
      deliveryKinds: objectDelta(item.deliveryKinds, previous.deliveryKinds),
      registrations: item.registrations,
      mutationTargets: objectDelta(item.mutationTargets, previous.mutationTargets),
      mutationTypes: objectDelta(item.mutationTypes, previous.mutationTypes),
      constructStack: item.constructStack,
      observeStack: item.observeStack,
      deliveryScheduleStack: item.deliveryScheduleStack
    };
  }).filter(item => item.nativeCallbacks || item.records || item.drainedBatches || item.drainedRecords || item.scheduledDeliveries || item.executedDeliveries);
}

function pendingBefore(items) {
  return items.map(item => ({
    id: item.id,
    pendingDeliveries: Math.max(0, Number(item.scheduledDeliveries || 0) - Number(item.executedDeliveries || 0)),
    deliveryKinds: item.deliveryKinds,
    registrations: item.registrations,
    constructStack: item.constructStack,
    observeStack: item.observeStack,
    deliveryScheduleStack: item.deliveryScheduleStack
  })).filter(item => item.pendingDeliveries > 0);
}

async function attachDelta(page, name, callbackBefore, before, waitMs) {
  await page.waitForTimeout(waitMs);
  const callbackAfter = await callbackCount(page);
  const after = await snapshot(page);
  const payload = {
    callbackDelta: callbackAfter - callbackBefore,
    pendingBefore: pendingBefore(before),
    attributionDelta: delta(after, before)
  };
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
