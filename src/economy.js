(function () {
  "use strict";

  if (!window.EpohiUtils) {
    throw new Error("EpohiUtils must be loaded before economy.js");
  }

  const { emptyYield, addYield } = window.EpohiUtils;

  function getTileYield(tile, terrainData, improvementData, featureData) {
    const result = emptyYield();
    addYield(result, terrainData[tile.terrain].base);
    if (tile.improvement && !tile.pillaged) addYield(result, improvementData[tile.improvement].yield);
    if (tile.feature && tile.feature !== "ruins" && tile.improvement) addYield(result, featureData[tile.feature].bonus);
    return result;
  }

  window.EpohiEconomy = {
    getTileYield
  };
})();
