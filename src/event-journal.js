(function () {
  "use strict";

  function append(state, makeEntry, policy) {
    if (!state) return null;
    const rules = policy || {};
    state.eventCounter = (rules.numericCounter
      ? (Number(state.eventCounter) || 0) : (state.eventCounter || 0)) + 1;
    const entry = makeEntry(state.eventCounter);
    if (!Array.isArray(state.eventLog)) state.eventLog = [];
    state.eventLog.unshift(entry);
    state.eventLog = state.eventLog.slice(0, rules.eventLimit == null ? Infinity : rules.eventLimit);
    if (!Array.isArray(state.history)) state.history = [];
    const line = rules.historyLine
      ? rules.historyLine(entry) : "Ход " + entry.turn + ": " + entry.text;
    if (!rules.dedupeHistory || !state.history.includes(line)) state.history.unshift(line);
    state.history = state.history.slice(0, rules.historyLimit == null ? Infinity : rules.historyLimit);
    return entry;
  }

  window.EpohiEventJournal = { append };
})();
