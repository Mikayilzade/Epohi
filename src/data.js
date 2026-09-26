(function () {
  "use strict";

  const TERRAIN = {
    plains: { name: "Равнина", icon: "🌿", movementCost: 1, passable: true, defenseModifier: 0, base: { food: 1, production: 0, gold: 0, science: 0 } },
    forest: { name: "Лес", icon: "🌲", movementCost: 2, passable: true, defenseModifier: 20, base: { food: 0, production: 1, gold: 0, science: 0 } },
    hill: { name: "Холмы", icon: "⛰️", movementCost: 2, passable: true, defenseModifier: 25, base: { food: 0, production: 1, gold: 0, science: 0 } },
    water: { name: "Побережье", icon: "🌊", movementCost: null, passable: false, defenseModifier: 0, impassableReason: "сухопутные отряды не могут входить в воду", base: { food: 1, production: 0, gold: 1, science: 0 } },
    desert: { name: "Пустошь", icon: "🏜️", movementCost: 1, passable: true, defenseModifier: 0, base: { food: 0, production: 0, gold: 1, science: 0 } },
    swamp: { name: "Болото", icon: "♒", movementCost: 3, passable: true, defenseModifier: 10, base: { food: 1, production: 0, gold: 0, science: 1 } },
    dead: { name: "Мёртвые земли", icon: "☠", movementCost: 2, passable: true, defenseModifier: -10, base: { food: 0, production: 0, gold: 0, science: 1 } }
  };

  const FEATURES = {
    wheat: { name: "Плодородная земля", icon: "🌾", bonus: { food: 1 } },
    ore: { name: "Руда", icon: "🪨", bonus: { production: 1 } },
    gems: { name: "Самоцветы", icon: "💎", bonus: { gold: 1 } },
    fish: { name: "Рыба", icon: "🐟", bonus: { food: 1 } },
    ruins: { name: "Древние руины", icon: "⌁", bonus: {} }
  };

  const IMPROVEMENTS = {
    lumber: {
      name: "Лесозаготовка", icon: "🪵", terrain: ["forest"], tech: null,
      cost: { production: 10 }, yield: { production: 3 },
      description: "+3 производства за ход"
    },
    farm: {
      name: "Ферма", icon: "🌾", terrain: ["plains"], tech: "agriculture",
      cost: { production: 11 }, yield: { food: 3 },
      description: "+3 еды за ход"
    },
    mine: {
      name: "Шахта", icon: "⛏️", terrain: ["hill"], tech: "mining",
      cost: { production: 14 }, yield: { production: 3, gold: 1 },
      description: "+3 производства и +1 золото"
    },
    tradingpost: {
      name: "Торговый пост", icon: "⚖️", terrain: ["plains", "desert"], tech: "trade",
      cost: { production: 8, gold: 12 }, yield: { gold: 3 },
      description: "+3 золота за ход"
    },
    harbor: {
      name: "Гавань", icon: "⚓", terrain: ["water"], tech: "trade",
      cost: { production: 17, gold: 8 }, yield: { food: 2, gold: 2 },
      description: "+2 еды и +2 золота"
    }
  };

  const BUILDINGS = {
    monument: {
      name: "Монумент", icon: "🗿", tech: null, cost: { production: 18 },
      yield: { science: 1 }, description: "+1 наука за ход"
    },
    granary: {
      name: "Амбар", icon: "🏚️", tech: "agriculture", cost: { production: 24 },
      yield: { food: 2 }, description: "+2 еды за ход"
    },
    workshop: {
      name: "Мастерская", icon: "⚒️", tech: "mining", cost: { production: 30 },
      yield: { production: 2 }, description: "+2 производства за ход"
    },
    library: {
      name: "Библиотека", icon: "📚", tech: "writing", cost: { production: 32, gold: 6 },
      yield: { science: 2 }, description: "+2 науки за ход"
    },
    market: {
      name: "Рынок", icon: "🏪", tech: "trade", cost: { production: 36 },
      yield: { gold: 2 }, description: "+2 золота за ход"
    },
    aqueduct: {
      name: "Акведук", icon: "🌉", tech: "engineering", cost: { production: 44, gold: 10 },
      yield: { food: 2, production: 1 }, description: "+2 еды и +1 производство"
    },
    palace: {
      name: "Дворец", icon: "🏰", tech: "statehood", cost: { production: 80, gold: 30 },
      yield: { gold: 3, science: 2 }, description: "При населении 6 основывает империю"
    }
  };

  const UNIT_DEFS = {
    worker: {
      name: "Рабочий", icon: "🧑‍🔧", mapIcon: "🔨", tech: null, population: 1,
      cost: { production: 22 }, maxMoves: 1, maxHealth: 70, attack: 4, defense: 4,
      description: "Строит улучшения только на клетке, где стоит"
    },
    scout: {
      name: "Разведчик", icon: "🧭", mapIcon: "🧭", tech: null, population: 1,
      cost: { production: 28 }, maxMoves: 2, maxHealth: 60, attack: 14, defense: 6,
      description: "Ходит на 2 клетки за ход и открывает область 3×3"
    },
    warrior: {
      name: "Воин", icon: "🛡️", mapIcon: "⚔️", tech: "mining", population: 2,
      cost: { production: 34 }, maxMoves: 1, maxHealth: 100, attack: 28, defense: 14,
      description: "Основной ранний боевой юнит против варваров"
    },
    settler: {
      name: "Поселенец", icon: "⛺", mapIcon: "🧳", tech: "trade", population: 4,
      cost: { production: 52, gold: 15 }, maxMoves: 1, maxHealth: 70, attack: 4, defense: 4,
      description: "Основывает полноценный новый город с собственной территорией и очередью"
    }
  };



  const BARBARIAN = { campHealth: 140, raiderHealth: 75, raiderAttack: 20, raiderDefense: 10, maxRaiders: 9, graceTurns: 12, spawnMin: 8, spawnMax: 12 };
  const BARBARIAN_ACTIVITY = { low:{label:"низкая", camps:.65, grace:16, min:11, max:15, limit:6}, normal:{label:"обычная", camps:1, grace:12, min:8, max:12, limit:9}, high:{label:"высокая", camps:1.35, grace:8, min:6, max:9, limit:14}, off:{label:"отключены", camps:0, grace:999, min:99, max:99, limit:0} };
  const CITY_MIN_DISTANCE = 4;
  const INTEREST_TYPES = {
    ruins: { name: "Древние руины", icon: "⌁" }, depot: { name: "Заброшенный склад", icon: "▣" }, grove: { name: "Священная роща", icon: "♧" },
    mine: { name: "Старая шахта", icon: "◇" }, caravan: { name: "Потерянный караван", icon: "⊙" }, cave: { name: "Пещера", icon: "△" },
    tower: { name: "Башня древнего мага", icon: "♜" }, temple: { name: "Разрушенный храм", icon: "✦" }
  };
  const ARTIFACT_BONUSES = [
    { id: "science", name: "+1 наука за ход" }, { id: "gold", name: "+1 золото за ход" }, { id: "production", name: "+1 производство за ход" },
    { id: "scoutSight", name: "Разведчики видят на 1 клетку дальше" }, { id: "militaryHealth", name: "Новые военные юниты получают +10 здоровья" }
  ];
  const AI_NAMES = ["Северный союз", "Королевство Ардан", "Республика Вельм", "Доминион Сар", "Лесной престол", "Империя Тарен"];
  const AI_COLORS = ["#d75a5a", "#6f8fe8", "#d99a35", "#ba65d9"];
  const AI_LIMITS = { maxCities: 3, maxScouts: 2, maxWorkers: 3, maxUnits: 10, maxActionsPerTurn: 18, minWarTurn: 20, logLimit: 180 };
  const AI_WEIGHTS = { defenseThreat: 90, exploreUnknown: 42, improveNeed: 36, settleRoom: 48, campExpedition: 38, prepareWar: 30, attackAdvantage: 58 };

  const TECHS = {
    agriculture: {
      name: "Земледелие", icon: "🌾", cost: 12, prereq: [],
      unlock: "Фермы и амбар"
    },
    mining: {
      name: "Горное дело", icon: "⛏️", cost: 16, prereq: [],
      unlock: "Шахты, мастерская и воин"
    },
    writing: {
      name: "Письменность", icon: "✍️", cost: 22, prereq: ["agriculture"],
      unlock: "Библиотека"
    },
    trade: {
      name: "Торговля", icon: "⚖️", cost: 28, prereq: ["writing"],
      unlock: "Торговые посты, гавани, рынок и поселенец"
    },
    engineering: {
      name: "Инженерия", icon: "📐", cost: 32, prereq: ["mining"],
      unlock: "Акведук"
    },
    statehood: {
      name: "Государственность", icon: "👑", cost: 46, prereq: ["trade", "engineering"],
      unlock: "Дворец и основание империи"
    }
  };

  window.EpohiData = {
    TERRAIN,
    FEATURES,
    IMPROVEMENTS,
    BUILDINGS,
    UNIT_DEFS,
    BARBARIAN,
    BARBARIAN_ACTIVITY,
    CITY_MIN_DISTANCE,
    INTEREST_TYPES,
    ARTIFACT_BONUSES,
    AI_NAMES,
    AI_COLORS,
    AI_LIMITS,
    AI_WEIGHTS,
    TECHS
  };
})();
