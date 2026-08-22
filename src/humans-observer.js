(function () {
  "use strict";

  let pendingOpenMap = false;
  let pendingArmed = false;
  let lastState = null;
  let scheduled = false;
  let lastReason = "startup";

  const runtimeStats = {
    schedules: 0,
    syncs: 0,
    clickSignals: 0,
    turnSignals: 0,
    menuSignals: 0,
    broadObservers: 0,
    narrowObservers: 0
  };

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
      const checkbox = document.getElementById("openMapMode");
      pendingOpenMap = !!(checkbox && checkbox.checked);
      pendingArmed = true;
      schedule("create-party");
    }, true);
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
        schedule("open-map-enabled");
      });
    }
    content.insertBefore(wrapper, content.firstChild);
  }

  function announceSettled(reason) {
    try {
      document.dispatchEvent(new CustomEvent("epohi:humans-ui-settled", {
        detail: { source: "humans-observer", reason: reason || "sync" }
      }));
    } catch (error) {
      // CustomEvent is only an optimization signal; gameplay must not depend on it.
    }
  }

  function sync() {
    scheduled = false;
    runtimeStats.syncs += 1;
    const reason = lastReason;
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
    announceSettled(reason);
  }

  function schedule(reason) {
    lastReason = reason || lastReason || "explicit";
    runtimeStats.schedules += 1;
    if (scheduled) return;
    scheduled = true;
    window.setTimeout(sync, 0);
  }

  function install() {
    const turn = document.getElementById("turnValue");
    const menu = document.getElementById("menuModal");

    // Deliberately no screenRoot/map/body/menuContent subtree observers here.
    // A turn text change is a bounded semantic signal that async turn processing settled.
    if (turn) {
      new MutationObserver(function () {
        runtimeStats.turnSignals += 1;
        schedule("turn-changed");
      }).observe(turn, { childList: true, subtree: true, characterData: true });
      runtimeStats.narrowObservers += 1;
    }

    // The menu's own show/hide class is the only DOM state needed to inject its control.
    if (menu) {
      new MutationObserver(function () {
        runtimeStats.menuSignals += 1;
        schedule("menu-visibility");
      }).observe(menu, { attributes: true, attributeFilter: ["class"] });
      runtimeStats.narrowObservers += 1;
    }

    // Generic document-click invalidation used to duplicate the bounded runtime owner:
    // click -> observer timeout/sync -> ui-settled -> runtime RAF, while the runtime also
    // scheduled its own RAF for the same click. Keep only semantic observer signals here.
    // New-game/open-map controls retain their explicit local listeners above.

    window.addEventListener("pageshow", function () { schedule("pageshow"); });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) schedule("visibility-return");
    });
    schedule("startup");
  }

  window.EpohiHumansObserver = {
    version: 3,
    revealAll: revealAll,
    apply: apply,
    sync: sync,
    requestSync: schedule,
    stats: function () { return Object.assign({}, runtimeStats, { scheduled: scheduled, lastReason: lastReason }); }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();