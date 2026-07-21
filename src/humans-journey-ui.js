(function () {
  "use strict";

  if (!window.EpohiHumansJourneyData || !window.EpohiHumansJourney) {
    throw new Error("Journey data and core are required before humans-journey-ui.js");
  }

  const DATA = window.EpohiHumansJourneyData;
  const CORE = window.EpohiHumansJourney;
  let modal = null;
  let syncTimer = null;
  let mapTimer = null;

  function debug() {
    return typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
  }

  function state() {
    const value = debug();
    return value && value.state ? value.state : null;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function ensureBar() {
    let bar = document.getElementById("humansJourneyBar");
    if (bar) return bar;
    const resources = document.querySelector(".resources");
    if (!resources) return null;
    bar = document.createElement("section");
    bar.id = "humansJourneyBar";
    bar.className = "journey-bar";
    bar.innerHTML = '<button type="button" class="journey-bar-button" data-open-human-journey>' +
      '<span class="journey-emblem" data-journey-icon>🔥</span>' +
      '<span class="journey-copy"><small data-journey-kicker>Сага Ардены</small>' +
      '<strong data-journey-title>Первый очаг</strong><span data-journey-progress>0 / 3 цели</span></span>' +
      '<span class="journey-alert" data-journey-alert>›</span></button>';
    resources.insertAdjacentElement("afterend", bar);
    bar.querySelector("button").addEventListener("click", open);
    return bar;
  }

  function ensureModal() {
    if (modal && document.body.contains(modal)) return modal;
    modal = document.getElementById("humansJourneyModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "humansJourneyModal";
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = '<section class="sheet humans-journey-sheet">' +
      '<header class="sheet-head"><h2>Сага Ардены</h2>' +
      '<button class="close-btn" data-close-human-journey aria-label="Закрыть">×</button></header>' +
      '<div id="humansJourneyContent" class="sheet-scroll"></div></section>';
    document.body.appendChild(modal);
    modal.querySelector("[data-close-human-journey]").addEventListener("click", function () {
      modal.classList.remove("show");
    });
    return modal;
  }

  function objectiveHtml(item) {
    const pct = Math.max(0, Math.min(100, item.target ? item.current / item.target * 100 : (item.done ? 100 : 0)));
    return '<article class="journey-objective ' + (item.done ? "done" : "") + '">' +
      '<span>' + (item.done ? "✓" : "○") + '</span><div><strong>' + escapeHtml(item.label) + '</strong>' +
      '<small>' + item.current + " / " + item.target + '</small>' +
      '<div class="journey-progress-track"><i style="width:' + pct + '%"></i></div></div></article>';
  }

  function eventHtml(gs, journey) {
    const event = CORE.eventById(journey.queuedEvents[0]);
    if (!event) return '<div class="inline-note">Новых решений пока нет.</div>';
    const choices = event.choices.map(function (choice) {
      const disabled = !CORE.canAffordChoice(gs, choice);
      return '<button type="button" class="story-choice" data-story-event="' + event.id +
        '" data-story-choice="' + choice.id + '"' + (disabled ? " disabled" : "") + '>' +
        '<strong>' + escapeHtml(choice.label) + '</strong><small>' +
        escapeHtml(disabled ? "Не хватает ресурсов. " + choice.text : choice.text) + '</small></button>';
    }).join("");
    return '<article class="story-event"><div class="story-event-head"><span>' + event.icon +
      '</span><div><strong>' + escapeHtml(event.title) +
      '</strong><small>Решение ждёт приказа</small></div></div><p>' +
      escapeHtml(event.text) + '</p><div class="story-choices">' + choices + '</div></article>';
  }

  function specializationHtml(gs) {
    const cards = CORE.cities(gs).map(function (city) {
      const current = DATA.specializations[city.specialization];
      let body;
      if (current) {
        body = '<div class="city-specialization-current"><span>' + current.icon +
          '</span><div><strong>' + escapeHtml(current.name) + '</strong><small>' +
          escapeHtml(current.text) + '</small></div></div>';
      } else if ((city.population || 0) < 3) {
        body = '<div class="inline-note">Откроется при населении 3. Сейчас: ' + (city.population || 0) + '.</div>';
      } else {
        body = '<div class="specialization-grid">' + Object.keys(DATA.specializations).map(function (key) {
          const item = DATA.specializations[key];
          return '<button type="button" data-city-specialization="' + key +
            '" data-city-id="' + escapeHtml(city.id) + '"><span>' + item.icon +
            '</span><strong>' + escapeHtml(item.name) + '</strong><small>' +
            escapeHtml(item.text) + '</small></button>';
        }).join("") + '</div>';
      }
      return '<article class="city-specialization-card"><h3>' +
        (city.capital ? "🏛️ " : "▣ ") + escapeHtml(city.name) + " · население " +
        (city.population || 0) + '</h3>' + body + '</article>';
    }).join("");
    return cards || '<div class="inline-note">Нет живых городов.</div>';
  }

  function open() {
    const gs = state();
    if (!gs) return false;
    CORE.sync({ render: false });
    const journey = CORE.ensureJourneyState(gs);
    const progress = CORE.chapterProgress(gs);
    const scenario = DATA.scenarios[journey.scenario] || DATA.scenarios.balanced;
    const view = ensureModal();
    const content = view.querySelector("#humansJourneyContent");
    const completed = journey.completedChapters.length ? journey.completedChapters.map(function (id) {
      const chapter = DATA.chapters.find(function (item) { return item.id === id; });
      return chapter ? '<span class="saga-chip">' + chapter.icon + " " + escapeHtml(chapter.title) + '</span>' : "";
    }).join("") : '<span class="saga-chip muted">История только начинается</span>';

    content.innerHTML =
      '<div class="journey-hero"><span>' + scenario.icon + '</span><div><small>' +
      escapeHtml(scenario.name) + '</small><h3>' + progress.chapter.icon + " " +
      escapeHtml(progress.chapter.title) + '</h3><p>' + escapeHtml(progress.chapter.text) +
      '</p></div></div><div class="journey-scenario-note">' +
      escapeHtml(scenario.description) + '<br><strong>' + escapeHtml(scenario.bonus) +
      '</strong></div><div class="section-title">Текущая глава</div>' +
      '<div class="journey-objectives">' + progress.objectives.map(objectiveHtml).join("") +
      '</div><div class="journey-reward">' + escapeHtml(progress.chapter.reward) +
      '</div><div class="section-title">Решение эпохи</div>' + eventHtml(gs, journey) +
      '<div class="section-title">Специализация городов</div>' + specializationHtml(gs) +
      '<div class="section-title">Пройденные главы</div><div class="saga-chips">' +
      completed + '</div>';

    content.querySelectorAll("[data-story-choice]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (CORE.resolveEvent(button.dataset.storyEvent, button.dataset.storyChoice)) open();
      });
    });
    content.querySelectorAll("[data-city-specialization]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (CORE.chooseSpecialization(button.dataset.cityId, button.dataset.citySpecialization)) {
          const value = debug();
          if (value && typeof value.render === "function") value.render();
          open();
        }
      });
    });
    view.classList.add("show");
    return true;
  }

  function refresh(gs) {
    const bar = ensureBar();
    if (!bar || !gs) return;
    const journey = CORE.ensureJourneyState(gs);
    const progress = CORE.chapterProgress(gs);
    const scenario = DATA.scenarios[journey.scenario] || DATA.scenarios.balanced;
    bar.querySelector("[data-journey-icon]").textContent = progress.chapter.icon;
    bar.querySelector("[data-journey-kicker]").textContent = scenario.name;
    bar.querySelector("[data-journey-title]").textContent = progress.chapter.title;
    bar.querySelector("[data-journey-progress]").textContent =
      progress.done + " / " + progress.objectives.length + " цели";
    const alert = bar.querySelector("[data-journey-alert]");
    alert.textContent = journey.queuedEvents.length ? "!" : "›";
    alert.classList.toggle("has-event", journey.queuedEvents.length > 0);
    document.body.dataset.humanChapter = String(progress.index);
    decorateLater();
    menuButton();
  }

  function menuButton() {
    const menu = document.getElementById("menuModal");
    const content = document.getElementById("menuContent");
    if (!menu || !content || !menu.classList.contains("show") ||
        content.querySelector("[data-open-human-journey]")) return;
    const wrapper = document.createElement("div");
    wrapper.className = "menu-actions human-saga-menu";
    wrapper.innerHTML = '<button type="button" class="wide-btn human-saga-button" ' +
      'data-open-human-journey>📜 Сага Ардены</button>';
    content.insertBefore(wrapper, content.firstChild);
    wrapper.querySelector("button").addEventListener("click", function () {
      menu.classList.remove("show");
      open();
    });
  }

  function decorate() {
    mapTimer = null;
    document.querySelectorAll("#map .tile").forEach(function (tile) {
      const x = Number(tile.dataset.x);
      const y = Number(tile.dataset.y);
      tile.dataset.variant = String(Math.abs((x * 17 + y * 31) % 4));
    });
  }

  function decorateLater() {
    if (mapTimer) return;
    mapTimer = requestAnimationFrame(decorate);
  }

  function versionLabels() {
    document.title = "Эпохи: Люди " + DATA.previewVersion;
    document.querySelectorAll(".menu-version").forEach(function (element) {
      element.textContent = DATA.previewVersion;
    });
    const hint = document.querySelector(".menu-hint");
    if (hint && hint.textContent.includes("v1.4.5.1")) {
      hint.innerHTML = '<strong>Эпохи: Люди — игровая сборка.</strong><br>' +
        'Сага, решения эпохи, специализации городов, автономные приказы и полноценные победы.';
    }
  }

  function presetFromControls(selectedKey) {
    const selected = DATA.scenarios[selectedKey] || DATA.scenarios.balanced;
    const size = document.getElementById("partySize");
    const barbarians = document.getElementById("barbarianActivity");
    const rivals = document.getElementById("rivalCount");
    const currentSize = size ? size.value : selected.size;
    const currentBarbarians = barbarians ? barbarians.value : selected.barbarians;
    const currentRivals = rivals ? rivals.value : selected.rivals;
    if (currentSize === selected.size && currentBarbarians === selected.barbarians &&
        currentRivals === selected.rivals) return selectedKey;
    if (currentSize === "small" && currentRivals === "0") return "peaceful";
    if (currentBarbarians === "high") return "frontier";
    if (Number(currentRivals) >= 2) return "rivalry";
    return "balanced";
  }

  function newGamePresets() {
    const create = document.getElementById("createParty");
    const form = create && create.closest(".screen-form");
    if (!create || !form || document.getElementById("scenarioPreset")) return;
    const label = document.createElement("label");
    label.className = "field-label scenario-field";
    label.innerHTML = 'Сценарий<select id="scenarioPreset">' +
      Object.keys(DATA.scenarios).map(function (key) {
        const item = DATA.scenarios[key];
        return '<option value="' + key + '"' + (key === "balanced" ? " selected" : "") +
          '>' + item.icon + " " + escapeHtml(item.name) + '</option>';
      }).join("") + '</select><small id="scenarioDescription" class="wiki-mini"></small>';

    const first = form.querySelector(".field-label");
    if (first && first.nextSibling) form.insertBefore(label, first.nextSibling);
    else form.insertBefore(label, create);
    const select = label.querySelector("select");
    const description = label.querySelector("small");

    function apply() {
      const item = DATA.scenarios[select.value] || DATA.scenarios.balanced;
      document.getElementById("partySize").value = item.size;
      document.getElementById("barbarianActivity").value = item.barbarians;
      document.getElementById("rivalCount").value = item.rivals;
      description.textContent = item.description;
    }

    select.addEventListener("change", apply);
    create.addEventListener("click", function () {
      CORE.armScenario(presetFromControls(select.value));
    }, true);
    apply();
  }

  function schedule() {
    if (syncTimer) return;
    syncTimer = setTimeout(function () {
      syncTimer = null;
      versionLabels();
      newGamePresets();
      CORE.sync();
    }, 0);
  }

  function install() {
    ensureBar();
    ensureModal();
    versionLabels();
    newGamePresets();

    const map = document.getElementById("map");
    const turn = document.getElementById("turnValue");
    const menu = document.getElementById("menuModal");
    const menuContent = document.getElementById("menuContent");
    const screen = document.getElementById("screenRoot");

    if (map) new MutationObserver(decorateLater).observe(map, { childList: true });
    if (turn) new MutationObserver(schedule).observe(turn, { childList: true, characterData: true, subtree: true });
    if (menu) new MutationObserver(menuButton).observe(menu, { attributes: true, attributeFilter: ["class"] });
    if (menuContent) new MutationObserver(menuButton).observe(menuContent, { childList: true });
    if (screen) new MutationObserver(schedule).observe(screen, { childList: true, subtree: true });

    document.addEventListener("click", function () {
      setTimeout(schedule, 20);
      setTimeout(schedule, 260);
    }, true);
    schedule();
  }

  window.EpohiHumansJourneyUI = {
    open: open,
    refresh: refresh,
    decorate: decorate
  };

  CORE.openJourney = open;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();