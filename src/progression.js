(function () {
  "use strict";

  function currentEra(state, hasTech) {
    if (state.victory) return "Империя";
    if (hasTech("statehood")) return "Королевство";
    if (state.researched.length >= 3 || state.city.population >= 4) return "Город";
    if (state.researched.length >= 1 || state.city.population >= 2) return "Поселение";
    return "Племя";
  }

  function techUnlocked(state, id, techs) {
    return techs[id].prereq.every(function (prerequisite) {
      return state.researched.includes(prerequisite);
    });
  }

  function chooseResearch(state, id, techs) {
    if (state.researched.includes(id) || !techUnlocked(state, id, techs)) return false;
    state.currentResearch = id;
    return true;
  }

  function finishResearch(state, techs) {
    if (!state.currentResearch) return null;
    const tech = techs[state.currentResearch];
    if (state.resources.science < tech.cost) return null;
    state.resources.science -= tech.cost;
    const completed = state.currentResearch;
    state.researched.push(completed);
    state.currentResearch = null;
    window.EpohiEventJournal.append(state, function (counter) {
      return { eventId:"research-"+counter, turn:state.turn,
        phase:"progression", actorType:"player", actorId:"player",
        eventType:"technology-completed", text:"исследована технология «"+tech.name+"».",
        presentationSilent:true };
    });
    return tech;
  }

  window.EpohiProgression = {
    currentEra,
    techUnlocked,
    chooseResearch,
    finishResearch
  };
})();
