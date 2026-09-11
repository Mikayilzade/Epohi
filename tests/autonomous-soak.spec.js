const { test, expect } = require('@playwright/test');
const {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
} = require('./helpers');

const mode = process.env.EPOHI_SOAK_MODE || 'short';
const longMode = mode === 'long';
const seeds = longMode
  ? [10101, 20202, 30303, 40404, 50505]
  : [10101, 30303];
const targetTurns = Number(process.env.EPOHI_SOAK_TURNS || (longMode ? 150 : 30));
const saveEvery = Number(process.env.EPOHI_SOAK_SAVE_EVERY || (longMode ? 30 : 15));

async function installSeededRandom(page, seed) {
  await page.addInitScript((initialSeed) => {
    const key = `__epohi_soak_rng_${initialSeed}`;
    let value = Number(sessionStorage.getItem(key));
    if (!Number.isFinite(value) || value <= 0) value = (Number(initialSeed) >>> 0) || 1;
    Math.random = () => {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
      sessionStorage.setItem(key, String(value));
      return value / 0x100000000;
    };
  }, seed);
}

async function waitForGame(page) {
  await expect(page.locator('#gameApp')).toBeVisible();
  await page.waitForFunction(() => Boolean(
    window.__epohiDebug &&
    window.__epohiDebug().state &&
    window.EpohiHumansAutonomy
  ));
}

async function visible(locator) {
  return (await locator.count()) > 0 && await locator.first().isVisible();
}

async function resolveBlockingInteraction(page, seed) {
  for (let pass = 0; pass < 8; pass += 1) {
    if (await visible(page.locator('#victoryModal.show'))) return 'outcome';

    const urgent = page.locator('#stabilityDecisionModal.show [data-decision-id][data-option-id]:not([disabled])');
    if (await visible(urgent)) {
      const count = await urgent.count();
      const index = Math.abs(seed + pass) % Math.max(1, count);
      await urgent.nth(index).click();
      await page.waitForTimeout(0);
      continue;
    }

    const turn = await page.evaluate(() => Number(window.__epohiDebug?.().state?.turn || 0));
    const proposalAnswer = ((seed + turn) & 1) === 0 ? 'yes' : 'no';
    const proposal = page.locator(`#coherenceProposalModal.show [data-coherence-proposal-answer="${proposalAnswer}"]:not([disabled])`);
    if (await visible(proposal)) {
      await proposal.first().click();
      await page.waitForTimeout(0);
      continue;
    }

    const annex = page.locator('#captureChoiceModal.show [data-capture-choice="annex"]:not([disabled])');
    if (await visible(annex)) {
      await annex.first().click();
      await page.waitForTimeout(0);
      continue;
    }
    const plunder = page.locator('#captureChoiceModal.show [data-capture-choice="plunder"]:not([disabled])');
    if (await visible(plunder)) {
      await plunder.first().click();
      await page.waitForTimeout(0);
      continue;
    }

    const routePoi = page.locator('#routePoiModal.show [data-route-poi-choice]:not([disabled])');
    if (await visible(routePoi)) {
      await routePoi.first().click();
      await page.waitForTimeout(0);
      continue;
    }

    return 'none';
  }
  throw new Error('Autonomous player could not resolve a blocking interaction after 8 passes.');
}

async function assertSingleBlockingOwner(page) {
  const owners = await page.evaluate(() => [
    'stabilityDecisionModal',
    'coherenceProposalModal',
    'captureChoiceModal',
    'routePoiModal'
  ].filter((id) => document.getElementById(id)?.classList.contains('show')));
  expect(owners, `multiple blocking layers own input: ${owners.join(', ')}`).toHaveLength(Math.min(1, owners.length));
}

async function stateInvariantProblems(page) {
  return page.evaluate(() => {
    const debug = window.__epohiDebug && window.__epohiDebug();
    const gs = debug && debug.state;
    if (!gs) return ['missing game state'];

    const problems = [];
    const finite = (value) => Number.isFinite(Number(value));
    const cities = Array.isArray(gs.cities) && gs.cities.length ? gs.cities : (gs.city ? [gs.city] : []);
    const buildings = window.EpohiData?.BUILDINGS || {};
    const units = window.EpohiData?.UNIT_DEFS || {};
    const techs = window.EpohiData?.TECHS || {};

    ['food', 'production', 'gold', 'science'].forEach((key) => {
      if (!finite(gs.resources?.[key] ?? 0)) problems.push(`player resource ${key} is not finite`);
    });

    const inspectCity = (city, owner) => {
      if (!city) return;
      ['x', 'y', 'population', 'hp', 'maxHp'].forEach((key) => {
        if (city[key] != null && !finite(city[key])) problems.push(`${owner} city ${city.id || city.name || '?'} ${key} is not finite`);
      });
      const queue = city.queue;
      if (queue) {
        const candidates = typeof queue === 'string'
          ? [queue]
          : [queue.projectId, queue.unitId, queue.buildingId, queue.itemId, queue.id].filter(Boolean);
        candidates.forEach((id) => {
          if (!buildings[id] && !units[id]) problems.push(`${owner} city queue references unknown content ${id}`);
        });
      }
    };

    cities.forEach((city) => inspectCity(city, 'player'));
    if (cities.length && !cities.some((city) => city.capital)) problems.push('living player cities have no capital');

    (gs.units || []).forEach((unit) => {
      ['x', 'y', 'hp', 'maxHp', 'moves'].forEach((key) => {
        if (unit[key] != null && !finite(unit[key])) problems.push(`player unit ${unit.id || '?'} ${key} is not finite`);
      });
    });

    if (gs.currentResearch && !techs[gs.currentResearch]) problems.push(`unknown player research ${gs.currentResearch}`);

    (gs.rivals || []).forEach((civ) => {
      const rivalCities = Array.isArray(civ.cities) ? civ.cities : [];
      rivalCities.forEach((city) => inspectCity(city, civ.name || civ.civilizationId || 'rival'));
      if (civ.defeated && rivalCities.length) problems.push(`defeated state ${civ.name || civ.civilizationId} still owns cities`);
      if (!civ.defeated && rivalCities.length && !rivalCities.some((city) => city.capital)) {
        problems.push(`living state ${civ.name || civ.civilizationId} has no capital`);
      }
      (civ.units || []).forEach((unit) => {
        ['x', 'y', 'hp', 'maxHp', 'moves'].forEach((key) => {
          if (unit[key] != null && !finite(unit[key])) problems.push(`rival unit ${unit.id || '?'} ${key} is not finite`);
        });
      });
      const current = civ.science && civ.science.currentResearch;
      if (current && !techs[current]) problems.push(`unknown rival research ${current}`);
      const production = civ.productionQueue;
      if (typeof production === 'string' && !buildings[production] && !units[production]) {
        problems.push(`rival production references unknown content ${production}`);
      }
    });

    return problems;
  });
}

async function idleDomSettled(page) {
  return page.evaluate(() => new Promise((resolve) => {
    const root = document.getElementById('gameApp');
    if (!root) return resolve({ settled: true, records: 0 });

    let records = 0;
    let semanticChanges = 0;
    let ignoredEquivalentRecords = 0;
    let markup = root.innerHTML;
    const mutationTargets = new Map();
    let done = false;
    let quietTimer = null;
    let hardTimer = null;
    let observer = null;

    const finish = (settled) => {
      if (done) return;
      done = true;
      if (observer) observer.disconnect();
      clearTimeout(quietTimer);
      clearTimeout(hardTimer);
      const targets = Array.from(mutationTargets.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 8)
        .map(([target, count]) => `${target} (${count})`);
      resolve({ settled, records, semanticChanges, ignoredEquivalentRecords, targets });
    };
    const armQuietWindow = () => {
      clearTimeout(quietTimer);
      quietTimer = setTimeout(() => finish(true), 150);
    };

    observer = new MutationObserver((batch) => {
      records += batch.length;
      const nextMarkup = root.innerHTML;
      if (nextMarkup === markup) {
        ignoredEquivalentRecords += batch.length;
        return;
      }
      markup = nextMarkup;
      semanticChanges += 1;
      batch.forEach((record) => {
        const element = record.target.nodeType === Node.ELEMENT_NODE
          ? record.target
          : record.target.parentElement;
        const identity = element
          ? `${record.type}:${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${record.attributeName ? `[${record.attributeName}]` : ''}`
          : record.type;
        mutationTargets.set(identity, (mutationTargets.get(identity) || 0) + 1);
      });
      armQuietWindow();
    });
    observer.observe(root, { subtree: true, childList: true, attributes: true, characterData: true });
    armQuietWindow();
    hardTimer = setTimeout(() => finish(false), 1500);
  }));
}

async function assignStandingOrders(page) {
  await page.evaluate(() => {
    const debug = window.__epohiDebug && window.__epohiDebug();
    const gs = debug && debug.state;
    const autonomy = window.EpohiHumansAutonomy;
    if (!gs || !autonomy) return;
    (gs.units || []).forEach((unit) => {
      if (unit.order || unit.travelOrder || unit.hp <= 0) return;
      if (unit.type === 'scout') autonomy.assignOrder(unit.id, 'explore');
      else if (unit.type === 'warrior') autonomy.assignOrder(unit.id, 'guard', { x: unit.x, y: unit.y, radius: 3 });
    });
  });
}

async function advanceTurn(page, seed) {
  const before = await page.evaluate(() => Number(window.__epohiDebug().state.turn || 0));
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const blocker = await resolveBlockingInteraction(page, seed + attempt);
    if (blocker === 'outcome') return { outcome: true, turn: before };

    await page.evaluate(() => {
      const debug = window.__epohiDebug();
      if (!debug.isTurnProcessing()) return debug.endTurn();
      return null;
    });

    for (let poll = 0; poll < 480; poll += 1) {
      await page.waitForTimeout(25);
      const snapshot = await page.evaluate(() => {
        const debug = window.__epohiDebug && window.__epohiDebug();
        return debug && debug.state ? {
          turn: Number(debug.state.turn || 0),
          processing: Boolean(debug.isTurnProcessing()),
          victory: Boolean(debug.state.victory),
          defeat: Boolean(debug.state.defeat)
        } : null;
      });
      if (!snapshot) throw new Error('game state disappeared during turn processing');
      if (snapshot.victory || snapshot.defeat || await visible(page.locator('#victoryModal.show'))) {
        return { outcome: true, turn: snapshot.turn };
      }
      if (snapshot.turn > before && !snapshot.processing) return { outcome: false, turn: snapshot.turn };
      if (!snapshot.processing && snapshot.turn === before) {
        const resolved = await resolveBlockingInteraction(page, seed + attempt + poll);
        if (resolved === 'outcome') return { outcome: true, turn: snapshot.turn };
        if (resolved !== 'none') break;
      }
    }
  }
  throw new Error(`turn ${before} did not advance after resolving required interactions`);
}

async function saveReloadCurrentCampaign(page) {
  const before = await page.evaluate(async () => {
    const debug = window.__epohiDebug();
    const turn = Number(debug.state.turn || 0);
    await debug.saveGame();
    return turn;
  });

  await page.reload();
  await expect(page.getByRole('heading', { name: 'ЭПОХИ' })).toBeVisible();
  const resume = page.locator('[data-continue]').first();
  await expect(resume).toBeVisible();
  await resume.click();
  await waitForGame(page);
  const after = await page.evaluate(() => Number(window.__epohiDebug().state.turn || 0));
  expect(after, 'periodic save/reload must preserve the current turn').toBe(before);
}

test.describe('@soak deterministic autonomous player', () => {
  test.describe.configure({ mode: 'serial' });

  for (const seed of seeds) {
    test(`seed ${seed} survives ${targetTurns} turns or reaches a legitimate outcome`, async ({ page }) => {
      test.setTimeout(longMode ? 900_000 : 240_000);
      const problems = watchConsole(page);

      await clearStorage(page);
      await installSeededRandom(page, seed);
      await createGame(page, 1, 'small');
      await waitForGame(page);
      await assignStandingOrders(page);

      const startTurn = await page.evaluate(() => Number(window.__epohiDebug().state.turn || 1));
      const finalTurn = startTurn + targetTurns;
      let reachedOutcome = false;

      while (!reachedOutcome) {
        const current = await page.evaluate(() => Number(window.__epohiDebug().state.turn || 0));
        if (current >= finalTurn) break;

        const blocker = await resolveBlockingInteraction(page, seed + current);
        if (blocker === 'outcome') {
          reachedOutcome = true;
          break;
        }
        await assertSingleBlockingOwner(page);

        const invariants = await stateInvariantProblems(page);
        expect(invariants, invariants.join('\n')).toEqual([]);

        const idle = await idleDomSettled(page);
        expect(
          idle.settled,
          `DOM did not become idle at seed ${seed}, turn ${current}; observed ${idle.records} mutation records across ${idle.semanticChanges} semantic changes; ignored ${idle.ignoredEquivalentRecords} equivalent records; top targets: ${idle.targets.join(', ') || 'none'}`
        ).toBe(true);

        await assignStandingOrders(page);
        const result = await advanceTurn(page, seed + current);
        reachedOutcome = result.outcome;

        if (!reachedOutcome && saveEvery > 0 && (result.turn - startTurn) > 0 && (result.turn - startTurn) % saveEvery === 0) {
          await resolveBlockingInteraction(page, seed + result.turn);
          await saveReloadCurrentCampaign(page);
          await assignStandingOrders(page);
        }
      }

      const finalInvariants = await stateInvariantProblems(page);
      expect(finalInvariants, finalInvariants.join('\n')).toEqual([]);
      await expectNoConsoleProblems(problems);

      const completedTurn = await page.evaluate(() => Number(window.__epohiDebug().state.turn || 0));
      if (!reachedOutcome) expect(completedTurn).toBeGreaterThanOrEqual(finalTurn);
    });
  }
});
