(function () {
  "use strict";

  const CACHE = new Map();
  const previousPositions = new Map();

  function svg(body, viewBox) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (viewBox || '0 0 64 64') + '">' +
      '<defs>' +
      '<linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f2c58f"/><stop offset="1" stop-color="#a86842"/></linearGradient>' +
      '<linearGradient id="cloth" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#78905a"/><stop offset="1" stop-color="#344b35"/></linearGradient>' +
      '<linearGradient id="iron" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e7edf0"/><stop offset=".5" stop-color="#8999a0"/><stop offset="1" stop-color="#4e5d62"/></linearGradient>' +
      '<linearGradient id="wood" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d9a75d"/><stop offset="1" stop-color="#6b4026"/></linearGradient>' +
      '<filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="1.7" flood-opacity=".45"/></filter>' +
      '<filter id="glow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '</defs>' + body + '</svg>';
  }

  function url(markup) {
    if (!CACHE.has(markup)) CACHE.set(markup, 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup) + '")');
    return CACHE.get(markup);
  }

  function baseFigure(body) {
    return svg('<ellipse cx="32" cy="56" rx="20" ry="5" fill="#102016" opacity=".34"/>' +
      '<g filter="url(#shadow)">' + body + '</g>');
  }

  const UNIT = {
    scout: baseFigure(
      '<path d="M22 49l4-19 13-2 6 21-8 4-8-1z" fill="url(#cloth)"/>' +
      '<circle cx="33" cy="20" r="8" fill="url(#skin)"/>' +
      '<path d="M25 19q8-13 17 0l-2 4q-8-5-15 0z" fill="#6a4930"/>' +
      '<path d="M18 51l7-24" stroke="#7b4b2b" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="17" cy="22" r="5" fill="#d9b55d" stroke="#4a3824" stroke-width="2"/>' +
      '<path d="M17 18v8M13 22h8" stroke="#fff5c8" stroke-width="1"/>' +
      '<path d="M25 34l-8 7M40 34l8 6" stroke="#b4784d" stroke-width="4" stroke-linecap="round"/>'
    ),
    worker: baseFigure(
      '<path d="M21 50l5-20h14l5 20-9 4-8-1z" fill="#8a6a42"/>' +
      '<circle cx="33" cy="21" r="8" fill="url(#skin)"/>' +
      '<path d="M25 18q8-8 16 0l-1 5H26z" fill="#b08a4f"/>' +
      '<path d="M21 37l-9 10M42 36l8 8" stroke="#b4784d" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M10 45l25-24" stroke="#75462b" stroke-width="3"/>' +
      '<path d="M30 18l11 4-4 7-12-5z" fill="url(#iron)" stroke="#46545a"/>'
    ),
    warrior: baseFigure(
      '<path d="M25 49l1-22 14 1 3 21-8 5z" fill="#8a3f34"/>' +
      '<circle cx="33" cy="19" r="8" fill="url(#skin)"/>' +
      '<path d="M24 18q9-12 18 0v5H24z" fill="url(#iron)"/>' +
      '<path d="M42 30l9 18" stroke="#d7e0df" stroke-width="3"/>' +
      '<path d="M49 47l6 5M48 50l5-6" stroke="#d7b45d" stroke-width="2"/>' +
      '<path d="M18 31q9-6 13 3v13q-8 7-15 0z" fill="#3f6f69" stroke="#f0d792" stroke-width="2"/>' +
      '<path d="M18 39h13M24 31v20" stroke="#d9c078" stroke-width="1.5"/>'
    ),
    settler: baseFigure(
      '<path d="M20 51l5-21h14l6 21-10 3-8-2z" fill="#6f7750"/>' +
      '<circle cx="32" cy="20" r="8" fill="url(#skin)"/>' +
      '<path d="M24 18q8-8 17 0l-2 4H25z" fill="#8b6841"/>' +
      '<rect x="42" y="27" width="13" height="18" rx="3" fill="url(#wood)" stroke="#4e321f"/>' +
      '<path d="M21 36l-10 9M42 36l7 5" stroke="#b4784d" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M11 44v-24" stroke="#69432b" stroke-width="2"/><path d="M12 20l14 5-14 6z" fill="#d7a44d"/>'
    ),
    spearman: baseFigure(
      '<path d="M24 50l2-22 13-1 4 23-9 4z" fill="#526c50"/>' +
      '<circle cx="32" cy="19" r="8" fill="url(#skin)"/>' +
      '<path d="M23 17q9-11 18 0v5H23z" fill="url(#iron)"/>' +
      '<path d="M48 9L39 54" stroke="#6d4228" stroke-width="3"/>' +
      '<path d="M48 8l4 10-8-2z" fill="#dce6e6" stroke="#526064"/>' +
      '<ellipse cx="20" cy="39" rx="9" ry="13" fill="#6c5038" stroke="#e0c06e" stroke-width="2"/>' +
      '<path d="M20 28v22M12 39h16" stroke="#d9b862" stroke-width="1.4"/>'
    ),
    rider: svg(
      '<ellipse cx="32" cy="56" rx="25" ry="5" fill="#102016" opacity=".34"/>' +
      '<g filter="url(#shadow)">' +
      '<path d="M13 43q5-17 22-15 10 1 17 10l-3 12-11 2-11-4-9 4z" fill="#7b5436"/>' +
      '<path d="M44 32l9-8 5 4-6 16-6 1z" fill="#8e633e"/>' +
      '<circle cx="55" cy="25" r="4" fill="#8e633e"/><path d="M56 21l4-5 1 7" fill="#65432c"/>' +
      '<path d="M20 48l-3 8M39 49l3 7M48 47l6 7" stroke="#4c3323" stroke-width="3"/>' +
      '<path d="M25 31l4-15 11 1 2 17z" fill="#496147"/>' +
      '<circle cx="35" cy="11" r="7" fill="url(#skin)"/>' +
      '<path d="M29 9q7-9 13 0v4H29z" fill="#6c4930"/>' +
      '<path d="M28 27l-8 8M41 27l9 6" stroke="#b4784d" stroke-width="3" stroke-linecap="round"/>' +
      '</g>'
    )
  };

  const TERRAIN = {
    plains: svg('<g opacity=".92"><path d="M5 48Q18 34 31 47T59 45v14H5z" fill="#76a653"/><path d="M8 55q9-13 18 0M25 58q10-16 22-1M43 55q6-10 15-2" fill="none" stroke="#b9d878" stroke-width="2"/><path d="M15 46l2-10m-2 5l-5-4m7 1l5-5M42 47l1-13m0 5l-5-5m6 2l5-5" stroke="#587f40" stroke-width="2" stroke-linecap="round"/></g>'),
    forest: svg('<g filter="url(#shadow)"><path d="M8 54h48" stroke="#263a2c" stroke-width="5" opacity=".35"/><path d="M16 50V31" stroke="#6e4930" stroke-width="4"/><path d="M8 35l8-20 9 20zM5 43l11-21 12 21z" fill="#315d3d"/><path d="M39 52V28" stroke="#6e4930" stroke-width="4"/><path d="M29 32l10-24 11 24zM25 42l14-26 16 26z" fill="#244e34"/><path d="M51 52V37" stroke="#6e4930" stroke-width="3"/><path d="M44 39l7-17 8 17z" fill="#3b6b45"/></g>'),
    hill: svg('<g filter="url(#shadow)"><path d="M4 55l16-26 9 12L40 17l20 38z" fill="#8d7d60"/><path d="M20 29l5 7-8 2M40 17l6 10-10 3" fill="#d6c59b"/><path d="M12 51l9-9 8 8 10-15 12 16" fill="none" stroke="#675a46" stroke-width="3"/></g>'),
    water: svg('<g opacity=".95"><path d="M4 18q8-7 16 0t16 0t16 0t8 0M4 32q8-7 16 0t16 0t16 0t8 0M4 46q8-7 16 0t16 0t16 0t8 0" fill="none" stroke="#b5e2e2" stroke-width="3" stroke-linecap="round"/><path d="M11 25q6-4 12 0M37 39q7-5 15 0" fill="none" stroke="#5fa6b8" stroke-width="4"/></g>'),
    desert: svg('<g filter="url(#shadow)"><path d="M3 50q14-18 29-5 14-17 29 1v13H3z" fill="#d6b86f"/><path d="M5 50q13-12 25-3M31 45q14-10 27 3" fill="none" stroke="#f2d993" stroke-width="3"/><path d="M45 41V20m0 8l-7-6m7 10l7-7" stroke="#64834c" stroke-width="4" stroke-linecap="round"/></g>'),
    swamp: svg('<g><path d="M4 49q10-8 20 0t20 0t16 0v10H4z" fill="#506d61"/><ellipse cx="22" cy="47" rx="14" ry="5" fill="#315b5d"/><ellipse cx="47" cy="52" rx="10" ry="4" fill="#315b5d"/><path d="M11 49V30m0 8l-5-7m5 10l7-9M36 52V28m0 9l-6-8m6 12l7-10M53 52V35" stroke="#9aac65" stroke-width="2.5" stroke-linecap="round"/></g>'),
    dead: svg('<g filter="url(#shadow)"><path d="M4 55l12-12 11 5 12-14 21 21z" fill="#59575b"/><path d="M31 48V18m0 10l-9-8m9 14l11-12m-11 21l-8 6" stroke="#302e32" stroke-width="5" stroke-linecap="round"/><path d="M10 53l8-9M43 51l9-13" stroke="#807c79" stroke-width="2"/></g>')
  };

  const FEATURE = {
    wheat: svg('<g filter="url(#shadow)" stroke="#6f5428" stroke-width="2" stroke-linecap="round"><path d="M24 57V14M34 57V9M43 57V18"/><path d="M24 22l-7-5m7 12l8-6m2-5l-7-5m7 13l8-7m1 8l-6-5m6 13l7-6"/><g fill="#e5bd55" stroke="none"><ellipse cx="18" cy="17" rx="4" ry="7"/><ellipse cx="31" cy="13" rx="4" ry="7"/><ellipse cx="40" cy="19" rx="4" ry="7"/><ellipse cx="49" cy="28" rx="4" ry="7"/></g></g>'),
    ore: svg('<g filter="url(#shadow)"><path d="M10 51l10-29 18-8 17 21-8 20H21z" fill="#6d7375"/><path d="M20 22l8 14 10-22M28 36l19 19M38 14l2 23 15-2" fill="none" stroke="#b7c1c2" stroke-width="3"/><circle cx="27" cy="35" r="4" fill="#d0a958"/></g>'),
    gems: svg('<g filter="url(#glow)"><path d="M32 7l20 18-20 32L12 25z" fill="#9459bc" stroke="#efd6ff" stroke-width="2"/><path d="M12 25h40M32 7l-8 18 8 32 9-32z" fill="none" stroke="#f6eaff" stroke-width="2"/></g>'),
    fish: svg('<g filter="url(#shadow)"><path d="M12 34q15-20 35-3l10-9-1 20-10-7q-18 16-34-1z" fill="#dbe9df" stroke="#447d89" stroke-width="2"/><circle cx="23" cy="30" r="2" fill="#20383e"/><path d="M29 24l8-9 4 12" fill="#85aeb1"/></g>'),
    ruins: svg('<g filter="url(#shadow)"><path d="M10 53h45v6H10z" fill="#897e6a"/><path d="M16 48V20h9v28M37 48V13h10v35" fill="#aaa18d"/><path d="M13 20h15v5H13M34 13h16v5H34" fill="#c8bea5"/><path d="M8 52l11-8 9 8 12-6 15 7" fill="#746b5e"/></g>')
  };

  const IMPROVEMENT = {
    farm: svg('<g filter="url(#shadow)"><path d="M4 52l29-25 27 23-27 10z" fill="#a87943"/><path d="M9 50l25-19M17 54l23-18M29 57l20-15" stroke="#e7c978" stroke-width="3"/><path d="M43 40V18m0 8l-6-5m6 9l7-6" stroke="#63824a" stroke-width="3"/></g>'),
    lumber: svg('<g filter="url(#shadow)"><path d="M9 52h45" stroke="#2b3e2c" stroke-width="5" opacity=".35"/><rect x="12" y="38" width="38" height="10" rx="5" fill="url(#wood)"/><rect x="18" y="29" width="35" height="10" rx="5" fill="#8d592f"/><circle cx="49" cy="43" r="5" fill="#d8ae70" stroke="#6e4529"/><path d="M49 39v8m-4-4h8" stroke="#8a5b33"/><path d="M10 25l14-13 4 4-14 14z" fill="url(#iron)"/><path d="M25 14l20 23" stroke="#75482b" stroke-width="4"/></g>'),
    mine: svg('<g filter="url(#shadow)"><path d="M6 54l10-31 17-13 19 14 7 30z" fill="#766f62"/><path d="M16 54V28l17-12 17 12v26" fill="#2b3030" stroke="#b68a4c" stroke-width="4"/><path d="M33 17v37M17 30h33" stroke="#8f6337" stroke-width="3"/><path d="M11 53h45" stroke="#c2a56a" stroke-width="3"/></g>'),
    tradingpost: svg('<g filter="url(#shadow)"><path d="M9 51h46v8H9z" fill="#755032"/><path d="M13 50V28h38v22" fill="#d3b06e"/><path d="M10 28l8-15h29l8 15z" fill="#9b4938"/><path d="M18 13v15m10-15v15m10-15v15m9-15v15" stroke="#f0d89b" stroke-width="3"/><rect x="22" y="35" width="11" height="15" fill="#5d3e2b"/><circle cx="43" cy="40" r="6" fill="#d5aa50"/></g>'),
    harbor: svg('<g filter="url(#shadow)"><path d="M5 47h54v10H5z" fill="#5b91a0"/><path d="M8 45h42" stroke="#9c6a3b" stroke-width="7"/><path d="M13 31v17M28 26v22M44 33v15" stroke="#6e482d" stroke-width="4"/><path d="M32 10v31" stroke="#5d4431" stroke-width="3"/><path d="M33 12l16 15H33z" fill="#e8d39b"/><path d="M31 25L18 38h13z" fill="#b85e46"/></g>')
  };

  const POI = {
    ruins: FEATURE.ruins,
    depot: svg('<g filter="url(#shadow)"><path d="M7 52h50v7H7z" fill="#5b4632"/><rect x="10" y="26" width="22" height="25" fill="#9a6a38" stroke="#5f3e26" stroke-width="3"/><path d="M10 37h22M21 26v25" stroke="#d1a663" stroke-width="2"/><rect x="34" y="18" width="19" height="33" fill="#7e5937" stroke="#4d3524" stroke-width="3"/><path d="M34 34h19M43 18v33" stroke="#c59b5f" stroke-width="2"/></g>'),
    grove: svg('<g filter="url(#glow)"><ellipse cx="32" cy="55" rx="22" ry="5" fill="#23422e" opacity=".5"/><path d="M31 52V25" stroke="#6c4c31" stroke-width="6"/><circle cx="32" cy="20" r="15" fill="#64a75e"/><circle cx="20" cy="27" r="11" fill="#4b8a50"/><circle cx="44" cy="28" r="12" fill="#76b969"/><circle cx="32" cy="18" r="5" fill="#fff1a5" opacity=".9"/></g>'),
    mine: IMPROVEMENT.mine,
    caravan: svg('<g filter="url(#shadow)"><path d="M8 48h43l5 7H8z" fill="#6e4a31"/><circle cx="19" cy="53" r="7" fill="#3e3228" stroke="#caa060" stroke-width="2"/><circle cx="45" cy="53" r="7" fill="#3e3228" stroke="#caa060" stroke-width="2"/><path d="M12 46V27h34l7 19z" fill="#b8793f"/><path d="M15 27q13-19 27 0" fill="#d9c08d" stroke="#7b5937" stroke-width="3"/><path d="M52 38l7-5" stroke="#6c452d" stroke-width="3"/></g>'),
    cave: svg('<g filter="url(#shadow)"><path d="M4 56L14 25 32 8l20 17 8 31z" fill="#777064"/><path d="M15 56q0-29 17-31 17 2 17 31z" fill="#171b1b"/><path d="M23 51q3-16 10-16 8 2 9 16" fill="#342d31"/><circle cx="31" cy="39" r="2" fill="#d9b655" filter="url(#glow)"/></g>'),
    tower: svg('<g filter="url(#shadow)"><path d="M18 55h30l-3-37H21z" fill="#8b8790"/><path d="M17 18h32v7H17z" fill="#c1bac0"/><path d="M18 18l4-10 5 10 6-10 5 10 6-10 5 10" fill="#9a91a0"/><rect x="29" y="35" width="9" height="20" rx="4" fill="#302d35"/><circle cx="33" cy="29" r="4" fill="#9272d6" filter="url(#glow)"/></g>'),
    temple: svg('<g filter="url(#shadow)"><path d="M7 53h50v7H7z" fill="#847a69"/><path d="M12 48h40v6H12zM10 20h44v7H10z" fill="#bcb29d"/><path d="M14 20L32 7l20 13z" fill="#d3c8ad"/><path d="M17 27v21M27 27v21M37 27v21M47 27v21" stroke="#a29886" stroke-width="5"/><circle cx="32" cy="16" r="4" fill="#d8aa4d" filter="url(#glow)"/></g>')
  };

  const OBJECT = {
    city: svg('<g filter="url(#shadow)"><ellipse cx="32" cy="57" rx="26" ry="5" fill="#193020" opacity=".35"/><path d="M8 53h48v6H8z" fill="#8d6b3f"/><path d="M12 51V31h17v20M34 51V24h18v27" fill="#d1b06e" stroke="#755034" stroke-width="2"/><path d="M9 31l12-12 11 12M31 24l12-15 12 15" fill="#8f4d3d"/><rect x="18" y="38" width="6" height="13" fill="#513a2b"/><rect x="41" y="34" width="6" height="17" fill="#513a2b"/><path d="M14 36h4M37 30h5M48 30h3" stroke="#f7df94" stroke-width="3"/></g>'),
    capital: svg('<g filter="url(#shadow)"><ellipse cx="32" cy="58" rx="28" ry="5" fill="#193020" opacity=".35"/><path d="M5 54h54v6H5z" fill="#8b683b"/><path d="M9 52V31h14v21M25 52V20h18v32M45 52V31h12v21" fill="#d8bd7b" stroke="#795032" stroke-width="2"/><path d="M7 31l9-10 9 10M23 20L34 7l11 13M43 31l8-10 8 10" fill="#914a39"/><path d="M34 7V2m0 1l10 4-10 4" stroke="#68472c" stroke-width="2" fill="#e2b34f"/><rect x="31" y="36" width="7" height="16" fill="#4d372a"/><circle cx="34" cy="27" r="4" fill="#efcf6a"/></g>'),
    camp: svg('<g filter="url(#shadow)"><ellipse cx="32" cy="56" rx="27" ry="5" fill="#1c251d" opacity=".4"/><path d="M6 52l14-27 14 27z" fill="#8b4b38" stroke="#492c24" stroke-width="2"/><path d="M30 53l12-23 15 23z" fill="#6d4933" stroke="#3f2d23" stroke-width="2"/><path d="M20 25l-5-10M42 30l5-12" stroke="#5e3d28" stroke-width="3"/><path d="M27 54q5-15 10 0" fill="#211b19"/><path d="M32 55q-8-5-2-11 2-5 5-9 1 7 5 10 4 7-8 10z" fill="#e39a3e"/><path d="M34 53q-3-4 1-9 5 5 2 9z" fill="#ffe07a"/></g>'),
    outpost: svg('<g filter="url(#shadow)"><ellipse cx="32" cy="56" rx="22" ry="4" fill="#193020" opacity=".35"/><path d="M12 51l18-29 18 29z" fill="#d1b17c" stroke="#6e4c33" stroke-width="3"/><path d="M30 22V8m0 2l17 6-17 7" fill="#c06549" stroke="#68432b" stroke-width="2"/><path d="M29 51q4-12 9 0" fill="#3c2d25"/></g>'),
    barbarian: baseFigure('<path d="M20 50l6-23 15 1 5 22-12 5z" fill="#513f37"/><circle cx="33" cy="18" r="8" fill="#9b6a4d"/><path d="M24 16q9-12 18 1l-4 5-13-1z" fill="#2d292a"/><path d="M18 31l-9 17M44 31l10 15" stroke="#835437" stroke-width="4" stroke-linecap="round"/><path d="M8 47l8-17 5 3-7 17z" fill="#6c7272"/><path d="M50 43l7 9M51 50l6-7" stroke="#c3b47f" stroke-width="3"/>')
  };

  const SHORT_POI = {
    ruins: "Руины", depot: "Склад", grove: "Роща", mine: "Шахта",
    caravan: "Караван", cave: "Пещера", tower: "Башня", temple: "Храм"
  };

  function setSprite(element, markup) {
    if (!element || !markup) return;
    element.style.setProperty("--art-sprite", url(markup));
    element.classList.add("has-art-sprite");
  }

  function playerUnitAt(gs, x, y, selectedId) {
    const list = (gs.units || []).filter(function (unit) { return unit.x === x && unit.y === y && unit.hp > 0; });
    return list.find(function (unit) { return unit.id === selectedId; }) || list[0] || null;
  }

  function rivalUnitAt(gs, x, y) {
    for (const civ of (gs.rivals || [])) {
      const unit = (civ.units || []).find(function (item) { return item.x === x && item.y === y && item.hp > 0; });
      if (unit) return { civ: civ, unit: unit };
    }
    return null;
  }

  function markArrival(piece, unit, tileSpan) {
    const previous = previousPositions.get(unit.id);
    if (!previous || (previous.x === unit.x && previous.y === unit.y)) return;
    const dx = unit.x - previous.x;
    const dy = unit.y - previous.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) return;
    piece.style.setProperty("--arrival-x", (-dx * tileSpan) + "px");
    piece.style.setProperty("--arrival-y", (-dy * tileSpan) + "px");
    piece.classList.add("unit-arriving");
  }

  function setBrand() {
    document.title = "Эпохи: Люди — визуальная демка";
    document.querySelectorAll(".menu-version").forEach(function (element) {
      element.textContent = "v1.5.1-visual-demo";
    });
  }

  function decorate() {
    setBrand();
    const debug = typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
    const gs = debug && debug.state;
    const map = document.getElementById("map");
    if (!gs || !map) return;

    const selectedId = typeof debug.getSelectedUnitId === "function" ? debug.getSelectedUnitId() : null;
    const tileSpan = 47;
    const currentPositions = new Map();

    map.querySelectorAll(".tile").forEach(function (tileElement) {
      const x = Number(tileElement.dataset.x);
      const y = Number(tileElement.dataset.y);
      const tile = gs.map[y] && gs.map[y][x];
      if (!tile) return;

      tileElement.classList.add("painted-tile");
      if (tile.revealed && TERRAIN[tile.terrain]) {
        tileElement.style.setProperty("--terrain-sprite", url(TERRAIN[tile.terrain]));
      }

      const feature = tileElement.querySelector(".feature");
      if (feature && tile.feature && FEATURE[tile.feature]) {
        feature.dataset.artKind = tile.feature;
        setSprite(feature, FEATURE[tile.feature]);
      }

      const improvement = tileElement.querySelector(".improvement");
      if (improvement && tile.improvement && IMPROVEMENT[tile.improvement]) {
        improvement.dataset.artKind = tile.improvement;
        setSprite(improvement, IMPROVEMENT[tile.improvement]);
      }

      const poi = tileElement.querySelector(".piece.poi");
      if (poi && tile.poi && !tile.poi.used && POI[tile.poi.type]) {
        poi.dataset.artKind = tile.poi.type;
        poi.dataset.artLabel = SHORT_POI[tile.poi.type] || "Находка";
        setSprite(poi, POI[tile.poi.type]);
      }

      const camp = tileElement.querySelector(".piece.camp");
      if (camp) {
        camp.dataset.artLabel = "Лагерь";
        setSprite(camp, OBJECT.camp);
      }

      const city = tileElement.querySelector(".piece.city");
      if (city) setSprite(city, city.classList.contains("player-capital") ? OBJECT.capital : OBJECT.city);
      const aiCity = tileElement.querySelector(".piece.ai-city");
      if (aiCity) setSprite(aiCity, aiCity.classList.contains("ai-capital") ? OBJECT.capital : OBJECT.city);
      const outpost = tileElement.querySelector(".piece.outpost");
      if (outpost) setSprite(outpost, OBJECT.outpost);

      const ownPiece = tileElement.querySelector(".piece.unit");
      const ownUnit = playerUnitAt(gs, x, y, selectedId);
      if (ownPiece && ownUnit && UNIT[ownUnit.type]) {
        ownPiece.dataset.artKind = ownUnit.type;
        ownPiece.dataset.unitId = ownUnit.id;
        setSprite(ownPiece, UNIT[ownUnit.type]);
        markArrival(ownPiece, ownUnit, tileSpan);
        currentPositions.set(ownUnit.id, { x: ownUnit.x, y: ownUnit.y });
      }

      const aiPiece = tileElement.querySelector(".piece.ai-unit");
      const rival = rivalUnitAt(gs, x, y);
      if (aiPiece && rival && UNIT[rival.unit.type]) {
        aiPiece.dataset.artKind = rival.unit.type;
        aiPiece.dataset.unitId = rival.unit.id;
        aiPiece.style.setProperty("--faction-color", rival.civ.color || "#bd5b4d");
        setSprite(aiPiece, UNIT[rival.unit.type]);
        markArrival(aiPiece, rival.unit, tileSpan);
        currentPositions.set(rival.unit.id, { x: rival.unit.x, y: rival.unit.y });
      }

      const enemy = tileElement.querySelector(".piece.enemy");
      if (enemy) setSprite(enemy, OBJECT.barbarian);
    });

    previousPositions.clear();
    currentPositions.forEach(function (position, id) { previousPositions.set(id, position); });
    document.body.classList.add("painted-world-ready");
  }

  function install() {
    decorate();
  }

  window.EpohiHumansVisuals = {
    version: 2,
    decorate: decorate,
    unitSprites: Object.keys(UNIT),
    terrainSprites: Object.keys(TERRAIN),
    poiSprites: Object.keys(POI),
    improvementSprites: Object.keys(IMPROVEMENT)
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();