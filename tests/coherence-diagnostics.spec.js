const { test } = require('@playwright/test');
const { clearStorage, createGame } = require('./helpers');

async function openGame(page, rivals = 1) {
  await clearStorage(page);
  await createGame(page, rivals, 'small');
  await page.waitForFunction(() => Boolean(
    window.EpohiCaptureState && window.EpohiDiplomacyCoherence &&
    window.EpohiCombatWorldStability && window.__epohiDebug && window.__epohiDebug().state
  ));
}

test('diagnose capture modal lifecycle', async ({ page }) => {
  await openGame(page, 1);
  const immediate = await page.evaluate(() => {
    const gs = window.__epohiDebug().state;
    const civ = gs.rivals[0];
    const city = civ.cities[0];
    const before = !!city.capturePending;
    city.hp = 0;
    const queued = window.EpohiCaptureState.queueCapture(gs, civ, city);
    const modal = document.getElementById('captureChoiceModal');
    return { before, queued, className:modal && modal.className, html:modal && modal.innerHTML, pending:gs.pendingCityCaptures.length };
  });
  console.log('CAPTURE_IMMEDIATE', JSON.stringify(immediate));
  await page.waitForTimeout(100);
  const delayed = await page.evaluate(() => {
    const modal = document.getElementById('captureChoiceModal');
    const gs = window.__epohiDebug().state;
    return { className:modal && modal.className, html:modal && modal.innerHTML, pending:gs.pendingCityCaptures.length };
  });
  console.log('CAPTURE_DELAYED', JSON.stringify(delayed));
});

test('diagnose urgent decision lifecycle', async ({ page }) => {
  await openGame(page, 0);
  const immediate = await page.evaluate(() => {
    const gs = window.__epohiDebug().state;
    const city = gs.cities[0];
    const item = window.EpohiCombatWorldStability.createUrgentDecision(gs, {
      id:'diag-urgent', title:'Диагностика', text:'Проверка решения', cityId:city.id,
      options:[{id:'a',label:'A',gold:1},{id:'b',label:'B',science:1}]
    });
    const modal = document.getElementById('stabilityDecisionModal');
    return { item:item && item.id, className:modal && modal.className, text:modal && modal.textContent, pending:gs.urgentDecisions.filter(x=>x.status==='pending').length };
  });
  console.log('URGENT_IMMEDIATE', JSON.stringify(immediate));
  await page.waitForTimeout(100);
  console.log('URGENT_DELAYED', JSON.stringify(await page.evaluate(() => {
    const modal=document.getElementById('stabilityDecisionModal');
    return {className:modal&&modal.className,text:modal&&modal.textContent};
  })));
});

test('diagnose diplomacy render', async ({ page }) => {
  await openGame(page, 1);
  const proposal = await page.evaluate(() => {
    const gs=window.__epohiDebug().state,civ=gs.rivals[0]; civ.met=true;
    const item=window.EpohiLivingCivilizations.createProposal(gs,civ,'peace','Диагностический мир.');
    return {id:item&&item.id,status:item&&item.status};
  });
  console.log('PROPOSAL_CREATED', JSON.stringify(proposal));
  const living = await page.evaluate(() => { window.EpohiLivingCivilizations.renderUI(window.__epohiDebug().state); return 'returned'; });
  console.log('LIVING_RENDER', living);
  const modal = await page.evaluate(() => { window.EpohiDiplomacyCoherence.renderProposal(window.__epohiDebug().state); const m=document.getElementById('coherenceProposalModal'); return {className:m&&m.className,text:m&&m.textContent}; });
  console.log('PROPOSAL_MODAL', JSON.stringify(modal));
});

test('diagnose end turn unlock', async ({ page }) => {
  await openGame(page, 1);
  console.log('TURN_BEFORE', JSON.stringify(await page.evaluate(() => ({turn:window.__epohiDebug().state.turn,processing:window.__epohiDebug().isTurnProcessing()}))));
  await page.evaluate(() => window.__epohiDebug().endTurn());
  console.log('ENDTURN_RETURNED');
  await page.waitForTimeout(1200);
  console.log('TURN_AFTER', JSON.stringify(await page.evaluate(() => ({turn:window.__epohiDebug().state.turn,processing:window.__epohiDebug().isTurnProcessing()}))));
});
