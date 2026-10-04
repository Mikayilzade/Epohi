(function () {
  "use strict";

  // Original, swappable visual assets. Gameplay IDs and tile geometry live elsewhere.
  const defs = '<defs>' +
    '<linearGradient id="grass" x2=".25" y2="1"><stop stop-color="#a8bd70"/><stop offset=".52" stop-color="#7e9f59"/><stop offset="1" stop-color="#567a45"/></linearGradient>' +
    '<linearGradient id="leaf" x2=".8" y2="1"><stop stop-color="#93b960"/><stop offset=".44" stop-color="#4b8148"/><stop offset="1" stop-color="#28553b"/></linearGradient>' +
    '<linearGradient id="pine" x2=".8" y2="1"><stop stop-color="#709b66"/><stop offset=".5" stop-color="#315e45"/><stop offset="1" stop-color="#1d4538"/></linearGradient>' +
    '<linearGradient id="stone" x2="1" y2="1"><stop stop-color="#e1d8b8"/><stop offset=".5" stop-color="#999785"/><stop offset="1" stop-color="#595f59"/></linearGradient>' +
    '<linearGradient id="sea" x2=".1" y2="1"><stop stop-color="#63b6ba"/><stop offset=".5" stop-color="#298296"/><stop offset="1" stop-color="#174f69"/></linearGradient>' +
    '<linearGradient id="roof" x2=".8" y2="1"><stop stop-color="#df9550"/><stop offset=".52" stop-color="#b85d36"/><stop offset="1" stop-color="#713b2d"/></linearGradient>' +
    '<linearGradient id="linen" x2=".7" y2="1"><stop stop-color="#f6e5b5"/><stop offset="1" stop-color="#b69a69"/></linearGradient>' +
    '</defs>';

  function svg(body, box) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (box || '0 0 64 64') + '">' + defs + body + '</svg>';
  }

  function stone(x, y, size) {
    return '<path d="M' + (x-size) + ' ' + y + 'l' + (size*.55) + ' -' + (size*.9) + ' ' + (size*.8) + ' -' + (size*.18) + ' ' + (size*.8) + ' ' + (size*.9) + ' -' + (size*.25) + ' ' + (size*.4) + 'z" fill="url(#stone)" stroke="#626956" stroke-width=".65"/>' +
      '<path d="M' + (x-size*.45) + ' ' + (y-size*.9) + 'l' + (size*.8) + ' -' + (size*.18) + ' -' + (size*.18) + ' ' + (size*.7) + 'z" fill="#eee1be" opacity=".48"/>';
  }

  function flowers(x, y) {
    return '<path d="M' + x + ' ' + y + 'v-3m-1 2l-2-2m3 1l2-2" fill="none" stroke="#3f6e3c" stroke-width=".8"/>' +
      '<circle cx="' + x + '" cy="' + (y-3) + '" r="1.2" fill="#f4d57c"/><circle cx="' + (x-2) + '" cy="' + (y-2) + '" r=".7" fill="#f5e8ca"/>';
  }

  function grass(x, y) {
    return '<path d="M' + (x-3) + ' ' + y + 'q1-4 2-3l1 3q1-5 3-5l-1 5q2-3 4-2" fill="none" stroke="#376b3e" stroke-width="1" stroke-linecap="round"/>';
  }

  function tree(x, y, s, pine) {
    if (pine) return '<ellipse cx="' + x + '" cy="' + (y+1) + '" rx="' + (s*.8) + '" ry="' + (s*.23) + '" fill="#203c2c" opacity=".42"/>' +
      '<path d="M' + x + ' ' + y + 'v-' + (s*1.8) + '" stroke="#5d4430" stroke-width="' + (s*.17) + '"/>' +
      '<path d="M' + (x-s*.7) + ' ' + (y-s*.55) + 'L' + x + ' ' + (y-s*2.25) + ' ' + (x+s*.7) + ' ' + (y-s*.55) + 'z" fill="url(#pine)" stroke="#244535" stroke-width=".75"/>' +
      '<path d="M' + (x-s*.48) + ' ' + (y-s*1.02) + 'L' + x + ' ' + (y-s*2.25) + ' ' + (x+s*.08) + ' ' + (y-s*1.02) + 'z" fill="#97ba78" opacity=".3"/>';
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + s + '" ry="' + (s*.26) + '" fill="#1d3929" opacity=".4"/>' +
      '<path d="M' + x + ' ' + y + 'v-' + (s*1.6) + '" stroke="#61472e" stroke-width="' + (s*.22) + '"/>' +
      '<circle cx="' + x + '" cy="' + (y-s*1.55) + '" r="' + (s*.82) + '" fill="url(#leaf)" stroke="#305e3d" stroke-width=".8"/>' +
      '<circle cx="' + (x-s*.58) + '" cy="' + (y-s*1.28) + '" r="' + (s*.58) + '" fill="#386d42"/>' +
      '<circle cx="' + (x+s*.5) + '" cy="' + (y-s*1.25) + '" r="' + (s*.54) + '" fill="#548a49"/>' +
      '<path d="M' + (x-s*.5) + ' ' + (y-s*1.9) + 'q' + (s*.48) + ' -' + (s*.46) + ' ' + s + ' 0" fill="none" stroke="#b9cb79" stroke-width="1.2" opacity=".7"/>';
  }

  function ground(kind, variant) {
    const palette = {
      plains: ['#779950','#779950'], forest: ['#4b7545','#4b7545'],
      hill: ['#7f8960','#7f8960'], water: ['#25798d','#25798d'],
      desert: ['#c8ae70','#d1b77a'], swamp: ['#597766','#617c65'], dead: ['#625f59','#69655f']
    };
    const color = palette[kind][variant % 2];
    return '<rect width="64" height="64" fill="' + color + '"/>' +
      '<path d="M-3 12Q13 ' + (6+variant*2) + ' 28 14T67 9v17Q45 29 25 23T-3 31z" fill="#e5dca4" opacity=".1"/>' +
      '<path d="M-4 46Q15 38 31 47T67 43v24H-4z" fill="#233f31" opacity=".12"/>';
  }

  function terrain(kind, variant) {
    const shift = [-2, 2, 0, 4][variant];
    let body = ground(kind, variant);
    if (kind === 'plains') {
      body += '<path d="M-4 42Q12 34 20 39T42 37Q51 32 68 39v8Q45 42 36 48T-4 51z" fill="#b6a16a" opacity=".35"/>' +
        '<path d="M-2 12Q16 3 29 12T68 5" fill="none" stroke="#c6d691" stroke-width="3" opacity=".18"/>' +
        stone(12+shift,24,5) + stone(51-shift,53,3) + flowers(23+shift,20) + flowers(47,43) +
        grass(9,53) + grass(38+shift,27) + grass(53,13);
    } else if (kind === 'forest') {
      body += '<path d="M-4 44Q14 29 31 41T68 36v30H-4z" fill="#254b34" opacity=".5"/>' +
        stone(10,49,5) + grass(17,54) + grass(51,55) +
        tree(8+shift,37,10,false) + tree(27-shift,31,12,true) + tree(45+shift,35,11,false) +
        tree(19+shift,57,9,false) + tree(55-shift,59,10,true) + flowers(35,55);
    } else if (kind === 'hill') {
      body += '<path d="M-4 46L10 35 20 38 33 19 44 25 55 17 69 43v22H-4z" fill="#555e4d" opacity=".45"/>' +
        '<path d="M0 43L15 29 24 34 34 15 46 28 57 19 66 36 66 52 45 43 31 50 13 45z" fill="url(#stone)" stroke="#666959" stroke-width="1.2"/>' +
        '<path d="M15 29l9 5 10-19 7 9-8 4-10 15-16-1z" fill="#eee1b9" opacity=".55"/>' +
        '<path d="M0 47q14-8 25-2t23-5q10-5 18-1v15q-17-2-27 6-18-7-39-2z" fill="url(#grass)"/>' +
        '<path d="M15 47l7-7 4 4M42 45l6-12 5 5" fill="none" stroke="#5d6257" stroke-width="2"/>' +
        stone(51+shift,56,5) + grass(8,54) + flowers(31,56);
    } else if (kind === 'water') {
      body = '<path d="M-4 19Q10 10 24 17T52 17T69 13M-6 46Q15 38 26 44T51 43T68 42" fill="none" stroke="#98d4d0" stroke-width="2" opacity=".32"/>' +
        '<path d="M5 29q8-4 16 0t15 0m3 23q9-4 20-1M1 57q12-2 19 1" fill="none" stroke="#d1e9d9" stroke-width="1.3" stroke-linecap="round" opacity=".72"/>' +
        '<path d="M' + (7+variant*4) + ' 8q5-3 10 0m20 26q5-3 10 0" fill="none" stroke="#163e58" stroke-width="2" opacity=".35"/>' +
        '<path d="M2 61q13-3 24-1t39-2" fill="none" stroke="#b6d5c9" stroke-width="2" opacity=".18"/>';
    } else if (kind === 'desert') {
      body += '<path d="M-4 43q16-14 31-4t38-11v36H-4z" fill="#e4ca8b" opacity=".75"/>' +
        '<path d="M-3 28q16-8 31 0t38-6M2 48q13-9 24-5t37-3" fill="none" stroke="#fff0b0" stroke-width="1.7" opacity=".5"/>' + stone(45,53,5) + grass(12,50);
    } else if (kind === 'swamp') {
      body += '<path d="M-3 28q14-10 28 2t42-3v35H-3z" fill="#365e5b" opacity=".6"/>' +
        '<ellipse cx="21" cy="38" rx="15" ry="7" fill="#477e7b"/><ellipse cx="52" cy="50" rx="12" ry="5" fill="#417277"/>' +
        '<path d="M13 39V19m0 12l-6-8m6 5l7-11M39 53V31m0 8l-5-7m5 9l7-8" fill="none" stroke="#bec582" stroke-width="2"/>' + tree(53,30,8,false) + stone(8,57,4);
    } else {
      body += '<path d="M-2 40l12-8 10 5 13-13 10 9 10-7 15 15v24H-2z" fill="#464b48" opacity=".55"/>' +
        '<path d="M19 53V24m0 10L9 29m10 10l9-11m-9 14l-8 6" fill="none" stroke="#342f30" stroke-width="3"/>' + stone(45,47,8) + stone(9,58,4);
    }
    return svg(body);
  }

  function person(role) {
    const gear = {
      worker: '<path d="M69 65L77 21" stroke="#6a4327" stroke-width="4"/><path d="M73 22l14 4-3 8-13-3z" fill="url(#stone)" stroke="#59625c" stroke-width="1.5"/><path d="M18 53l-9-9 8-11 8 9z" fill="#b99560" stroke="#5b4530" stroke-width="2"/>',
      scout: '<path d="M69 70l8-48" stroke="#69422b" stroke-width="4"/><path d="M18 34q-10 10-5 25l15 5 2-22z" fill="#7e633f" stroke="#4b3d2d" stroke-width="2"/><path d="M13 44h12m-11 8h12" stroke="#c9ab70" stroke-width="2"/>',
      warrior: '<path d="M66 58l16-32" stroke="#634029" stroke-width="3"/><path d="M77 28l7-16 5 7-9 14z" fill="url(#stone)" stroke="#6a6c69" stroke-width="1.5"/><path d="M10 42q10-13 22-2v25q-12 10-23-2z" fill="#355d66" stroke="#e5c16f" stroke-width="3"/><path d="M20 39v31m-10-15h21" stroke="#e0b766" stroke-width="2"/>',
      archer: '<path d="M15 31q-13 19 0 39" fill="none" stroke="#6e452c" stroke-width="4"/><path d="M15 31q21 18 0 39" fill="none" stroke="#dac394" stroke-width="1.3"/><path d="M8 49l53-13" stroke="#8a613a" stroke-width="2"/><path d="M61 36l-8-4 2 8z" fill="#d9d9c4"/><path d="M61 51l10-20m-8 22l10-18" stroke="#e4d1a3" stroke-width="2"/>',
      settler: '<path d="M12 32h19v29H12z" fill="#94754d" stroke="#5c4730" stroke-width="2"/><path d="M12 42h19m-10-10v29" stroke="#d7bd82" stroke-width="2"/><path d="M71 70V24" stroke="#705033" stroke-width="3"/><path d="M71 24l14 5-14 6z" fill="#d7ad61"/>',
      spearman: '<path d="M76 74L74 10" stroke="#714627" stroke-width="4"/><path d="M74 10l-6 14h12z" fill="url(#stone)"/><path d="M11 43q9-12 20 1v20q-12 7-20-2z" fill="#6c5942" stroke="#d5bb7f" stroke-width="2"/>',
      barbarian: '<path d="M69 68l13-38" stroke="#64412a" stroke-width="5"/><path d="M77 32l13-2-5 15-13-6z" fill="#85877a" stroke="#494f49" stroke-width="2"/><path d="M9 45q11-9 21 0l-1 20q-10 7-20-4z" fill="#67483b" stroke="#9d7952" stroke-width="3"/>'
    };
    const raider = role === 'barbarian';
    const tunic = raider ? '#6d4437' : role === 'warrior' ? '#4f6c73' : role === 'worker' ? '#9d7446' : '#57734e';
    const cloak = raider ? '#4d332b' : role === 'scout' ? '#315641' : '#7b6a4b';
    return svg('<ellipse cx="48" cy="86" rx="29" ry="6" fill="#14251b" opacity=".38"/>' +
      '<path d="M30 64l-7 17 12 3 11-22m8 0l5 22 12-4-4-18" fill="#634a32" stroke="#342d25" stroke-width="2"/>' +
      '<path d="M22 72q-5-34 17-42l23 3q13 11 12 39l-17 3-5-30-9 28z" fill="' + cloak + '" stroke="#303c32" stroke-width="2"/>' +
      '<path d="M31 34q15-12 30 1l4 34q-17 9-36 0z" fill="' + tunic + '" stroke="#3c402e" stroke-width="2"/>' +
      '<path d="M28 49q18 7 36-1M39 35v35" fill="none" stroke="#e3c78c" stroke-width="2" opacity=".7"/>' +
      '<path d="M32 40l-8 22m40-22l8 20" stroke="#c58a5c" stroke-width="7" stroke-linecap="round"/>' +
      '<circle cx="46" cy="24" r="12" fill="#c89163" stroke="#6f4938" stroke-width="1.5"/>' +
      '<path d="M34 21q9-21 23-8l3 11q-13-8-25 2z" fill="' + (raider ? '#292725' : role === 'scout' ? '#355a3f' : '#5a4933') + '" stroke="#3b352b" stroke-width="1.5"/>' +
      '<path d="M41 25h2m11 0h2" stroke="#312b25" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M42 32q5 3 9 0" fill="none" stroke="#744e37" stroke-width="1.5"/>' +
      gear[role] +
      '<path d="M22 81q8-1 15 2m22 1q8-3 14-3" stroke="#2a2825" stroke-width="4" stroke-linecap="round"/>', '0 0 96 96');
  }

  function city(capital) {
    return svg('<ellipse cx="48" cy="84" rx="42" ry="8" fill="#1c3828" opacity=".4"/>' +
      '<path d="M7 69l40-13 42 12-3 13-40 8-38-9z" fill="#827b55" stroke="#4c573f" stroke-width="2"/>' +
      '<path d="M14 55l18-11 14 8v27l-32-5z" fill="url(#linen)" stroke="#705a3d" stroke-width="2"/>' +
      '<path d="M11 55l21-18 17 15-4 4-13-10-17 15z" fill="url(#roof)" stroke="#69442d" stroke-width="2"/>' +
      '<path d="M44 62l17-10 23 7v18l-38 5z" fill="#d2b780" stroke="#705a3d" stroke-width="2"/>' +
      '<path d="M42 62l17-17 26 11-2 6-23-10-16 15z" fill="url(#roof)" stroke="#69442d" stroke-width="2"/>' +
      '<path d="M37 65V30l11-8 11 8v38z" fill="url(#linen)" stroke="#69563e" stroke-width="2"/>' +
      '<path d="M35 31l13-16 13 16-3 4-10-12-10 12z" fill="url(#roof)" stroke="#6f452f" stroke-width="2"/>' +
      '<path d="M43 66V53q5-6 10 0v13M22 61h5m41 4h6M44 39h7" stroke="#6d4e35" stroke-width="3"/>' +
      '<path d="M48 16V4m0 2l17 5-17 6z" stroke="#5f4931" stroke-width="2" fill="' + (capital ? '#e2b44f' : '#73975a') + '"/>' +
      '<path d="M12 76l23 6 43-4" fill="none" stroke="#ece0ad" stroke-width="2" opacity=".65"/>', '0 0 96 96');
  }

  function farm() {
    return svg('<path d="M2 48l39-23 23 17-36 20z" fill="#8e673d" stroke="#614a30" stroke-width="1.5"/>' +
      '<path d="M7 48l34-18m-25 23l34-18m-25 23l33-18" stroke="#e5c36a" stroke-width="5"/>' +
      '<path d="M6 49l36-20m-28 24l37-20m-28 24l35-20" stroke="#5f7d42" stroke-width="1.2"/>' +
      '<path d="M38 37V19h17v25" fill="#e0c997" stroke="#6a5135" stroke-width="2"/>' +
      '<path d="M35 20l11-10 13 12z" fill="url(#roof)" stroke="#69452f" stroke-width="2"/>' +
      '<path d="M3 53l25 9 34-18M5 44l-2 10m25-1v10m33-25v8" fill="none" stroke="#765a37" stroke-width="2"/>');
  }

  function ruins() {
    return svg('<ellipse cx="32" cy="55" rx="29" ry="7" fill="#34563a" opacity=".45"/>' +
      '<path d="M6 52l18-6 32 4 4 8-50 2z" fill="#898d73" stroke="#5e6758" stroke-width="2"/>' +
      '<path d="M13 48V16h8v31m24 3V12h9v39" fill="url(#stone)" stroke="#687064" stroke-width="2"/>' +
      '<path d="M11 16h13v5H11m31-9h15v6H42" fill="#d5ceb0" stroke="#6d7166" stroke-width="1"/>' +
      '<path d="M21 24q12-10 25-1" fill="none" stroke="#a8a995" stroke-width="4"/>' +
      '<path d="M8 51l8-6 7 4m27-1l8-6 5 8" fill="#b0ae92" stroke="#6d7166" stroke-width="1.5"/>' +
      '<path d="M17 48q6-8 11-5m21 5q-2-7 4-10" fill="none" stroke="#5e8b4b" stroke-width="2"/>');
  }

  const terrainRegistry = {};
  ['plains','forest','hill','water','desert','swamp','dead'].forEach(function (kind) {
    terrainRegistry[kind] = Array.from({length: 4}, function (_, variant) { return terrain(kind, variant); });
  });

  window.EpohiCanonArt = Object.freeze({
    version: 1,
    terrain: terrainRegistry,
    units: { worker: person('worker'), scout: person('scout'), warrior: person('warrior'),
      archer: person('archer'), settler: person('settler'), spearman: person('spearman'), barbarian: person('barbarian') },
    landmarks: { city: city(false), capital: city(true), farm: farm(), ruins: ruins() }
  });
})();
