(function () {
  "use strict";

  function currentEra(state, hasTech) {
    if (state.victory) return "Империя";
    if (hasTech("statehood")) return "Королевство";
    if (state.researched.length >= 3 || state.city.population >= 4) return "Город";
    if (state.researched.length >= 1 || state.city.population >= 2) return "Поселение";
    return "Племя";
  }

  window.EpohiProgression = {
    currentEra
  };
})();
