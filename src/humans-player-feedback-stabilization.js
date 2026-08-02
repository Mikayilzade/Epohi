(function () {
  "use strict";

  let controls = null;
  let contentObserver = null;

  function debug() {
    return typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
  }

  function removeRecreatedButtons(content) {
    content.querySelectorAll("#outcomeGoalsBtn, #outcomeMapBtn").forEach(function (button) {
      button.removeAttribute("id");
      button.hidden = true;
      button.setAttribute("aria-hidden", "true");
      button.tabIndex = -1;
    });
  }

  function ensureStableControls() {
    const modal = document.getElementById("victoryModal");
    const content = document.getElementById("victoryContent");
    const sheet = modal && modal.querySelector(".sheet");
    if (!modal || !content || !sheet) return;

    if (!controls || !document.body.contains(controls)) {
      controls = document.createElement("div");
      controls.className = "menu-actions feedback-outcome-controls";
      controls.innerHTML = '<button id="outcomeGoalsBtn" type="button" class="wide-btn secondary">Посмотреть цели</button>' +
        '<button id="outcomeMapBtn" type="button" class="wide-btn">Вернуться к карте</button>';
      sheet.appendChild(controls);
    }

    if (!contentObserver) {
      contentObserver = new MutationObserver(function () {
        removeRecreatedButtons(content);
      });
      contentObserver.observe(content, { childList: true, subtree: true });
    }
    removeRecreatedButtons(content);
  }

  function preserveFreePlay() {
    const value = debug();
    const state = value && value.state;
    if (!state || !state.continueAfterOutcome) return;
    state.victory = false;
    state.defeat = false;
    if (state.outcome) state.outcome.status = "active";
    const modal = document.getElementById("victoryModal");
    if (modal && modal.classList.contains("show")) modal.classList.remove("show");
  }

  function install() {
    const style = document.createElement("style");
    style.id = "feedbackOutcomeStabilizationStyles";
    style.textContent = ".feedback-outcome-controls{padding:0 14px 14px;margin-top:0}";
    if (!document.getElementById(style.id)) document.head.appendChild(style);

    ensureStableControls();
    preserveFreePlay();

    const modal = document.getElementById("victoryModal");
    if (modal) {
      new MutationObserver(function () {
        ensureStableControls();
        preserveFreePlay();
      }).observe(modal, { attributes: true, attributeFilter: ["class"] });
    }

    const turn = document.getElementById("turnValue");
    if (turn) {
      new MutationObserver(preserveFreePlay).observe(turn, { childList: true, characterData: true, subtree: true });
    }
  }

  window.EpohiPlayerFeedbackStabilization = {
    version: 1,
    ensureStableControls: ensureStableControls,
    preserveFreePlay: preserveFreePlay
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
