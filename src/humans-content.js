(function () {
  "use strict";

  if (!window.EpohiData) {
    throw new Error("EpohiData must be loaded before humans-content.js");
  }

  const { TECHS, BUILDINGS, UNIT_DEFS } = window.EpohiData;

  Object.assign(TECHS, {
    woodworking: {
      name: "Обработка дерева",
      icon: "🪵",
      cost: 14,
      prereq: [],
      unlock: "Склад и путь к укреплениям"
    },
    animalHusbandry: {
      name: "Животноводство",
      icon: "🐎",
      cost: 18,
      prereq: ["agriculture"],
      unlock: "Всадник и более гибкое освоение земель"
    },
    fortification: {
      name: "Укрепления",
      icon: "🧱",
      cost: 24,
      prereq: ["woodworking"],
      unlock: "Частокол"
    },
    militaryOrganization: {
      name: "Военная организация",
      icon: "⚔️",
      cost: 30,
      prereq: ["mining", "woodworking"],
      unlock: "Копейщик и казармы"
    },
    laws: {
      name: "Законы",
      icon: "📜",
      cost: 38,
      prereq: ["writing", "trade"],
      unlock: "Совет и путь к государственности"
    }
  });

  TECHS.statehood.prereq = ["laws", "engineering"];
  TECHS.statehood.cost = 58;
  TECHS.statehood.unlock = "Дворец и государственная победа";

  Object.assign(BUILDINGS, {
    storehouse: {
      name: "Склад",
      icon: "📦",
      tech: "woodworking",
      cost: { production: 28 },
      yield: { food: 1, production: 1 },
      description: "+1 еда и +1 производство за ход"
    },
    stockade: {
      name: "Частокол",
      icon: "🧱",
      tech: "fortification",
      cost: { production: 38 },
      yield: { production: 1 },
      description: "+1 производство; защитный эффект будет расширен в прототипе"
    },
    barracks: {
      name: "Казармы",
      icon: "🏕️",
      tech: "militaryOrganization",
      cost: { production: 42, gold: 6 },
      yield: { production: 2 },
      description: "+2 производства за ход"
    },
    council: {
      name: "Совет",
      icon: "🏛️",
      tech: "laws",
      cost: { production: 48, gold: 10 },
      yield: { gold: 1, science: 2 },
      description: "+1 золото и +2 науки за ход"
    }
  });

  Object.assign(UNIT_DEFS, {
    spearman: {
      name: "Копейщик",
      icon: "🔱",
      mapIcon: "🔱",
      tech: "militaryOrganization",
      population: 2,
      cost: { production: 38 },
      maxMoves: 1,
      maxHealth: 110,
      attack: 22,
      defense: 24,
      description: "Оборонительный воин с высоким здоровьем и защитой"
    },
    rider: {
      name: "Всадник",
      icon: "🐎",
      mapIcon: "🐎",
      tech: "animalHusbandry",
      population: 2,
      cost: { production: 44, gold: 8 },
      maxMoves: 2,
      maxHealth: 85,
      attack: 21,
      defense: 10,
      description: "Мобильный боевой юнит для разведки, перехвата и быстрых походов"
    }
  });

  window.EpohiHumansContent = {
    version: 1,
    addedTechs: [
      "woodworking",
      "animalHusbandry",
      "fortification",
      "militaryOrganization",
      "laws"
    ],
    addedBuildings: ["storehouse", "stockade", "barracks", "council"],
    addedUnits: ["spearman", "rider"]
  };
})();
