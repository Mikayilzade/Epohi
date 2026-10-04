(function () {
  "use strict";

  // This view uses the same decorator and sprite registry as map units.
  const UNITS = [
    { id: "worker", name: "Рабочий", status: "CANON · в игре", role: "Строит улучшения действиями рабочего." },
    { id: "scout", name: "Разведчик", status: "CANON · в игре", role: "Исследует мир и открывает местность." },
    { id: "warrior", name: "Воин", status: "CANON · в игре", role: "Ближний бой и защита." },
    { id: "settler", name: "Поселенец", status: "CANON · в игре", role: "Основывает новые города." },
    { id: "archer", name: "Лучник", status: "PLACEHOLDER · будущий", role: "Визуальный образ; сейчас не нанимается." },
    { id: "spearman", name: "Копейщик", status: "CANON · в игре", role: "Воин с копьём." },
    { id: "barbarian", name: "Варвар", status: "CANON · в игре", role: "Враждебный налётчик." },
    { id: "rider", name: "Всадник", status: "LEGACY · в игре", role: "Старый визуальный образ до нового арт-прохода." }
  ];

  function unitFigure(type) {
    const frame = document.createElement("span");
    frame.className = "unit-atlas-preview";
    const figure = document.createElement("span");
    figure.className = "piece unit unit-" + type;
    frame.appendChild(figure);
    window.EpohiHumansVisuals.decorateUnit(figure, { type: type, id: "atlas-" + type });
    return frame;
  }

  function render() {
    const wiki = document.getElementById("wikiContent");
    if (!wiki || !window.EpohiHumansVisuals || wiki.querySelector("#unitAtlas")) return;
    const section = document.createElement("section");
    section.id = "unitAtlas";
    section.className = "unit-atlas";
    const title = document.createElement("h3");
    title.textContent = "Атлас юнитов";
    section.appendChild(title);
    const intro = document.createElement("p");
    intro.textContent = "Те же миниатюры, что на карте. Статус показывает, доступен ли образ в игре и завершён ли его арт-проход.";
    section.appendChild(intro);
    const grid = document.createElement("div");
    grid.className = "unit-atlas-grid";
    UNITS.forEach(function (unit) {
      const card = document.createElement("article");
      card.className = "unit-atlas-card";
      card.dataset.visualId = unit.id;
      card.appendChild(unitFigure(unit.id));
      const copy = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = unit.name;
      const id = document.createElement("code");
      id.textContent = unit.id;
      const badge = document.createElement("span");
      badge.className = "unit-atlas-status";
      badge.textContent = unit.status;
      const role = document.createElement("small");
      role.textContent = unit.role;
      copy.append(name, id, badge, role);
      card.appendChild(copy);
      grid.appendChild(card);
    });
    section.appendChild(grid);
    wiki.prepend(section);
    wiki.querySelectorAll("[data-wiki-unit]").forEach(function (card) {
      const type = card.dataset.wikiUnit;
      const figure = card.querySelector(".wiki-unit-figure");
      if (figure) window.EpohiHumansVisuals.decorateUnit(figure, { type: type, id: "wiki-" + type });
    });
  }

  document.addEventListener("epohi:wiki-rendered", render);
})();
