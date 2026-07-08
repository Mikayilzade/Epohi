const { test, expect } = require("@playwright/test");
const {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
} = require("./helpers");

test.describe('Epohi browser smoke', () => {
  test('main menu loads without unhandled console errors', async ({ page }) => {
    const problems = watchConsole(page);
    await clearStorage(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'ЭПОХИ' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Новая игра' })).toBeVisible();
    await expectNoConsoleProblems(problems);
  });

  test('external game script loads and initializes the application', async ({ page }) => {
    const problems = watchConsole(page);
    await clearStorage(page);
    await page.goto('/');

    const scriptInfo = await page.evaluate(async () => {
      const scripts = Array.from(document.querySelectorAll('script[src]'))
        .map((script) => script.getAttribute('src'));
      const response = await fetch('./src/app.js');
      return {
        scripts,
        loaded: response.ok,
        hasAppScript: Array.from(document.scripts).some((script) => script.src.endsWith('/src/app.js')),
        hasDebugHook: typeof window.__epohiDebug === 'function'
      };
    });

    expect(scriptInfo.scripts.filter((src) => src === './src/app.js')).toHaveLength(1);
    expect(scriptInfo.loaded).toBe(true);
    expect(scriptInfo.hasAppScript).toBe(true);
    expect(scriptInfo.hasDebugHook).toBe(true);

    await page.getByRole('button', { name: 'Новая игра' }).click();
    await page.locator('#partySize').selectOption('small');
    await page.locator('#rivalCount').selectOption('0');
    await page.locator('#partyName').fill(`External script ${Date.now()}`);
    await page.getByRole('button', { name: 'Создать мир' }).click();

    await expect(page.locator('#gameApp')).toBeVisible();
    await expect(page.locator('#map .tile').first()).toBeVisible();
    await expect(page.locator('#endTurnBtn')).toBeVisible();
    await expect(page.locator('#turnValue')).toHaveText('1');
    await page.locator('#endTurnBtn').click();
    await expect(page.locator('#turnValue')).toHaveText('2');
    await expectNoConsoleProblems(problems);
  });

  test('external stylesheet is loaded and main layout keeps computed styles', async ({ page }) => {
    const problems = watchConsole(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await clearStorage(page);
    await createGame(page, 0, 'small');

    const styleInfo = await page.evaluate(async () => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map((link) => link.getAttribute('href'));
      const response = await fetch('./styles/app.css');
      return {
        links,
        loaded: response.ok,
        hasAppSheet: Array.from(document.styleSheets).some((sheet) => sheet.href && sheet.href.endsWith('/styles/app.css')),
        contextDisplay: getComputedStyle(document.querySelector('.context')).display,
        appDisplay: getComputedStyle(document.querySelector('#gameApp')).display,
        appRows: getComputedStyle(document.querySelector('#gameApp')).gridTemplateRows,
        toolbarDisplay: getComputedStyle(document.querySelector('.toolbar')).display,
        toolbarHeight: document.querySelector('.toolbar').getBoundingClientRect().height,
        endTurnVisible: !!(document.querySelector('#endTurnBtn').offsetWidth || document.querySelector('#endTurnBtn').offsetHeight)
      };
    });

    expect(styleInfo.links.filter((href) => href === './styles/app.css')).toHaveLength(1);
    expect(styleInfo.loaded).toBe(true);
    expect(styleInfo.hasAppSheet).toBe(true);
    expect(styleInfo.contextDisplay).toBe('flex');
    expect(styleInfo.appDisplay).toBe('grid');
    expect(styleInfo.appRows).not.toBe('none');
    expect(styleInfo.toolbarDisplay).toBe('grid');
    expect(styleInfo.toolbarHeight).toBeGreaterThan(0);
    expect(styleInfo.endTurnVisible).toBe(true);
    await expect(page.locator('#endTurnBtn')).toBeVisible();
    await expectNoConsoleProblems(problems);
  });

  for (const rivals of [0, 1, 2]) {
    test(`creates a new game with ${rivals} AI and starts the map`, async ({ page }) => {
      const problems = watchConsole(page);
      await clearStorage(page);
      await createGame(page, rivals, rivals === 2 ? 'normal' : 'small');
      await expect(page.locator('#turnValue')).toHaveText('1');
      await expect(page.locator('#map .tile')).toHaveCount(rivals === 2 ? 784 : 400);
      await expectNoConsoleProblems(problems);
    });
  }

  test('completes one full turn and opens in-game menu, chronicle, and save manager', async ({ page }) => {
    const problems = watchConsole(page);
    await clearStorage(page);
    await createGame(page, 1);

    await page.locator('#endTurnBtn').click();
    await expect(page.locator('#turnValue')).toHaveText('2');

    await page.locator('#menuBtn').click();
    await expect(page.locator('#menuModal')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Меню' })).toBeVisible();

    await page.locator('#chronicleBtn').click();
    await expect(page.locator('#menuContent')).toContainText('Летопись');
    await page.locator('#backMenu').click();

    await page.locator('#saveAsBtn').click();
    await expect(page.locator('#screenRoot')).toContainText('Сохранения');
    await expect(page.locator('#saveQuickFromManager')).toBeVisible();
    await expectNoConsoleProblems(problems);
  });

  test('saves and then loads the current campaign', async ({ page }) => {
    const problems = watchConsole(page);
    await clearStorage(page);
    await createGame(page, 1);

    await page.locator('#endTurnBtn').click();
    await expect(page.locator('#turnValue')).toHaveText('2');
    await page.locator('#menuBtn').click();
    await page.locator('#saveAsBtn').click();

    await page.locator('#saveQuickFromManager').click();
    const quicksaveCard = page.locator('.slot-card').filter({ hasText: 'Быстрое: Быстрое сохранение' });
    await expect(quicksaveCard).toContainText('ход 2');

    page.once('dialog', (dialog) => dialog.accept('Playwright test turn 2'));
    await page.locator('#saveManualFromManager').click();
    const manualSaveCard = page.locator('.slot-card').filter({ hasText: 'Ручное: Playwright test turn 2' });
    await expect(manualSaveCard).toContainText('ход 2');

    await page.getByRole('button', { name: 'Назад в игру' }).click();
    await page.locator('#menuBtn').click();
    await page.locator('#loadCurrentCampaignBtn').click();
    const savedTurnTwoCard = page.locator('.slot-card').filter({ hasText: 'Ручное: Playwright test turn 2' });
    await expect(savedTurnTwoCard).toContainText('ход 2');
    await savedTurnTwoCard.getByRole('button', { name: 'Загрузить' }).click();
    await expect(page.locator('#gameApp')).toBeVisible();
    await expect(page.locator('#turnValue')).toHaveText('2');
    await expectNoConsoleProblems(problems);
  });
});
