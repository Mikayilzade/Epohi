(function () {
  "use strict";

  let pendingOpenMap = false;
  let pendingArmed = false;
  let lastState = null;
  let scheduled = false;

  function debug() {
    return typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
  }

  function state() {
    const value = debug();
    return value && value.state ? value.state : null;
  }

  function revealAll(gs) {
    let changed = false;
    (gs.map || []).forEach(function (row) {
      row.forEach(function (tile) {
        if (!tile.revealed) changed = true;
        tile.revealed = true;
      });
    });
    (gs.rivals || []).forEach(function (civ) {
      if (!civ.met || !civ.relation || civ.relation === "unknown") changed = true;
      civ.met = true;
      if (!civ.relation || civ.relation === "unknown") civ.relation = "neutral";
    });
    return changed;
  }

  function apply(gs) {
    if (!gs) return false;
    if (gs !== lastState) {
      lastState = gs;
      if (typeof gs.openMapMode !== "boolean") {
        gs.openMapMode = pendingArmed ? pendingOpenMap : false;
      }
      pendingArmed = false;
    }
    if (!gs.openMapMode) {
      document.body.classList.remove("open-map-mode");
      return false;
    }
    const changed = revealAll(gs);
    document.body.classList.add("open-map-mode");
    return changed;
  }

  function injectNewGameControl() {
    const create = document.getElementById("createParty");
    const form = create && create.closest(".screen-form");
    if (!create || !form || document.getElementById("openMapMode")) return;

    const label = document.createElement("label");
    label.className = "observer-option";
    label.innerHTML = '<span class="observer-option-icon">👁</span><span><strong>Открытая карта</strong>' +
      '<small>Без тумана войны: видны развитие городов и перемещения всех государств.</small></span>' +
      '<input id="openMapMode" type="checkbox">';
    form.insertBefore(label, create);

    create.addEventListener("click", function () {
      pendingOpenMap = document.getElementById("openMapMode").checked;
      pendingArmed = true;
    }, true);
    create.addEventListener("click", function () {
      sync();
    });
  }

  function injectMenuControl() {
    const menu = document.getElementById("menuModal");
    const content = document.getElementById("menuContent");
    const gs = state();
    if (!menu || !content || !gs || !menu.classList.contains("show") || content.querySelector("[data-open-map-mode]")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "menu-actions observer-menu-control";
    if (gs.openMapMode) {
      wrapper.innerHTML = '<button class="wide-btn observer-active" disabled data-open-map-mode>👁 Открытая карта активна</button>';
    } else {
      wrapper.innerHTML = '<button class="wide-btn secondary" data-open-map-mode>👁 Открыть карту для теста</button>';
      wrapper.querySelector("button").addEventListener("click", function () {
        if (!window.confirm("Открыть всю карту? Вернуть туман войны в этой партии уже не получится.")) return;
        gs.openMapMode = true;
        revealAll(gs);
        const value = debug();
        if (value && typeof value.render === "function") value.render();
        menu.classList.remove("show");
        schedule();
      });
    }
    content.insertBefore(wrapper, content.firstChild);
  }

  function sync() {
    scheduled = false;
    injectNewGameControl();
    const gs = state();
    if (gs) {
      const changed = apply(gs);
      injectMenuControl();
      if (changed) {
        const value = debug();
        if (value && typeof value.updateCampDiscovery === "function") value.updateCampDiscovery(gs);
        if (value && typeof value.render === "function") value.render();
      }
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    window.setTimeout(sync, 0);
  }

  function install() {
    const screen = document.getElementById("screenRoot");
    const map = document.getElementById("map");
    const turn = document.getElementById("turnValue");
    const menu = document.getElementById("menuModal");
    const menuContent = document.getElementById("menuContent");

    if (screen) new MutationObserver(schedule).observe(screen, { childList: true, subtree: true });
    if (map) new MutationObserver(schedule).observe(map, { childList: true });
    if (turn) new MutationObserver(schedule).observe(turn, { childList: true, subtree: true, characterData: true });
    if (menu) new MutationObserver(schedule).observe(menu, { attributes: true, attributeFilter: ["class"] });
    if (menuContent) new MutationObserver(schedule).observe(menuContent, { childList: true });
    document.addEventListener("click", function () { window.setTimeout(schedule, 30); }, true);
    schedule();
  }

  window.EpohiHumansObserver = {
    version: 1,
    revealAll: revealAll,
    apply: apply,
    sync: sync
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
