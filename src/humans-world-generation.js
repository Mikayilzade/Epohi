(function (root) {
  "use strict";

  const LAND = ["plains", "forest", "hill", "desert", "swamp", "dead"];
  const WATER_KINDS = ["coast", "sea", "lake", "river"];
  const PROFILES = Object.freeze({
    balanced: Object.freeze({ land: [52, 18, 11, 13, 4, 2], marineBlobs: 5, lakes: 2, ridges: 2, ridgeLength: 5, forestPatches: 5, resourceScale: 1 }),
    woodland: Object.freeze({ land: [41, 32, 10, 9, 5, 3], marineBlobs: 5, lakes: 2, ridges: 2, ridgeLength: 5, forestPatches: 9, resourceScale: 1 }),
    highland: Object.freeze({ land: [44, 16, 24, 10, 3, 3], marineBlobs: 5, lakes: 1, ridges: 5, ridgeLength: 8, forestPatches: 4, resourceScale: 1.12 }),
    coastal: Object.freeze({ land: [51, 19, 10, 12, 5, 3], marineBlobs: 10, lakes: 1, ridges: 1, ridgeLength: 5, forestPatches: 5, resourceScale: 1.25 }),
    marshland: Object.freeze({ land: [46, 23, 9, 7, 12, 3], marineBlobs: 6, lakes: 6, ridges: 1, ridgeLength: 4, forestPatches: 6, resourceScale: 1 }),
    arid: Object.freeze({ land: [50, 10, 13, 20, 2, 5], marineBlobs: 4, lakes: 1, ridges: 3, ridgeLength: 6, forestPatches: 2, resourceScale: 1.12 })
  });

  function hashSeed(value) {
    const text = String(value);
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    return hash >>> 0;
  }
  function createRng(seed) {
    let state = hashSeed(seed);
    return function () {
      state = (state + 0x6D2B79F5) >>> 0;
      let t = state;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function pickWeighted(weights, rng) {
    const total = weights.reduce((sum, value) => sum + value, 0);
    let roll = rng() * total;
    for (let i = 0; i < weights.length; i++) if ((roll -= weights[i]) < 0) return LAND[i];
    return LAND[LAND.length - 1];
  }
  function tile(terrain) {
    return { terrain, revealed: false, improvement: null, feature: null, poi: null, camp: null, pillaged: false };
  }
  function paintBlob(map, cx, cy, rx, ry, rng) {
    const size = map.length;
    for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(size - 1, Math.ceil(cy + ry)); y++) {
      for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(size - 1, Math.ceil(cx + rx)); x++) {
        const distance = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
        if (distance < .75 || (distance < 1.1 && rng() < .65)) map[y][x] = tile("water");
      }
    }
  }
  function neighbors4(x, y, size) {
    return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < size && b < size);
  }
  function classifyWater(map, preserveExisting) {
    const size = map.length, seen = new Set();
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (map[y][x].terrain !== "water" || seen.has(y * size + x)) continue;
      const queue = [[x, y]], component = [];
      let marine = false;
      seen.add(y * size + x);
      for (let i = 0; i < queue.length; i++) {
        const [px, py] = queue[i];
        component.push([px, py]);
        if (px === 0 || py === 0 || px === size - 1 || py === size - 1) marine = true;
        for (const [nx, ny] of neighbors4(px, py, size)) {
          const key = ny * size + nx;
          if (map[ny][nx].terrain === "water" && !seen.has(key)) { seen.add(key); queue.push([nx, ny]); }
        }
      }
      for (const [px, py] of component) {
        const current = map[py][px];
        if (preserveExisting && WATER_KINDS.includes(current.waterKind)) continue;
        current.waterKind = marine
          ? (neighbors4(px, py, size).some(([nx, ny]) => map[ny][nx].terrain !== "water") ? "coast" : "sea")
          : "lake";
      }
    }
    return map;
  }
  function clusterMax(map, terrain) {
    const size = map.length, seen = new Set(); let largest = 0;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const key = y * size + x;
      if (seen.has(key) || map[y][x].terrain !== terrain) continue;
      const queue = [[x, y]]; seen.add(key);
      for (let i = 0; i < queue.length; i++) for (const [nx, ny] of neighbors4(...queue[i], size)) {
        const nk = ny * size + nx;
        if (!seen.has(nk) && map[ny][nx].terrain === terrain) { seen.add(nk); queue.push([nx, ny]); }
      }
      largest = Math.max(largest, queue.length);
    }
    return largest;
  }
  function diagnose(map) {
    const size = map.length, terrain = {}, waterKind = {}, resources = {}, start = {};
    let land = 0, invalid = 0, poi = 0;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const item = map[y][x];
      terrain[item.terrain] = (terrain[item.terrain] || 0) + 1;
      if (!LAND.includes(item.terrain) && item.terrain !== "water") invalid++;
      if (item.terrain !== "water") land++;
      if (item.waterKind) waterKind[item.waterKind] = (waterKind[item.waterKind] || 0) + 1;
      if (item.feature) resources[item.feature] = (resources[item.feature] || 0) + 1;
      if (item.poi) poi++;
      if (Math.abs(x - Math.floor(size / 2)) <= 2 && Math.abs(y - Math.floor(size / 2)) <= 2) start[item.terrain] = (start[item.terrain] || 0) + 1;
      if (item.feature === "fish" && item.terrain !== "water") invalid++;
      if (item.terrain === "water" && !WATER_KINDS.includes(item.waterKind)) invalid++;
    }
    const cx = Math.floor(size / 2), cy = Math.floor(size / 2), queue = [[cx, cy]], reachable = new Set([cy * size + cx]);
    for (let i = 0; i < queue.length; i++) for (const [nx, ny] of neighbors4(...queue[i], size)) {
      const key = ny * size + nx;
      if (map[ny][nx].terrain !== "water" && !reachable.has(key)) { reachable.add(key); queue.push([nx, ny]); }
    }
    if (map[cy][cx].terrain !== "plains" || reachable.size < Math.min(25, land * .25)) invalid++;
    return { size, terrain, landPercent: Object.fromEntries(LAND.map(id => [id, Math.round(1000 * (terrain[id] || 0) / Math.max(1, land)) / 10])), waterKind, largestForest: clusterMax(map, "forest"), largestHill: clusterMax(map, "hill"), reachableLand: reachable.size, start, resources, poi, invalid };
  }
  function placePois(map, ids, rng) {
    if (!ids || !ids.length) return;
    const size = map.length, cx = Math.floor(size / 2), cy = Math.floor(size / 2), target = Math.round(size * size / 39);
    let placed = 0, tries = 0;
    while (placed < target && tries++ < size * size * 4) {
      const x = 2 + Math.floor(rng() * (size - 4)), y = 2 + Math.floor(rng() * (size - 4));
      if (map[y][x].terrain === "water" || Math.max(Math.abs(x - cx), Math.abs(y - cy)) < 4) continue;
      let near = false;
      for (let yy = Math.max(0, y - 3); yy <= Math.min(size - 1, y + 3) && !near; yy++)
        for (let xx = Math.max(0, x - 3); xx <= Math.min(size - 1, x + 3); xx++) if (map[yy][xx].poi) { near = true; break; }
      if (!near) { map[y][x].poi = { type: ids[placed % ids.length], used: false }; placed++; }
    }
  }
  function generate(options) {
    const size = options.size || 28, profileId = Object.prototype.hasOwnProperty.call(PROFILES, options.profileId) ? options.profileId : "balanced";
    const profile = PROFILES[profileId], seed = options.seed == null ? Math.floor(Math.random() * 0x100000000) : options.seed;
    const rng = createRng(seed + ":" + size + ":" + profileId);
    const map = Array.from({ length: size }, () => Array.from({ length: size }, () => tile(pickWeighted(profile.land, rng))));
    const scale = size / 28;
    for (let i = 0; i < Math.round(profile.marineBlobs * scale); i++) {
      const side = Math.floor(rng() * 4), along = Math.floor(rng() * size);
      const x = side === 0 ? 0 : side === 1 ? size - 1 : along;
      const y = side === 2 ? 0 : side === 3 ? size - 1 : along;
      const radius = Math.max(2, size * (.09 + rng() * .07));
      paintBlob(map, x, y, radius * (1.1 + rng() * .5), radius * (1.1 + rng() * .5), rng);
    }
    for (let i = 0; i < Math.round(profile.lakes * scale); i++) {
      const x = 3 + Math.floor(rng() * (size - 6)), y = 3 + Math.floor(rng() * (size - 6));
      const radius = Math.max(1.4, size * (.055 + rng() * .035));
      paintBlob(map, x, y, radius, radius * (.7 + rng() * .6), rng);
    }
    for (let i = 0; i < Math.round(profile.forestPatches * scale); i++) {
      const x = 2 + Math.floor(rng() * (size - 4)), y = 2 + Math.floor(rng() * (size - 4));
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
        if (map[y + dy][x + dx].terrain !== "water" && rng() < (dx === 0 && dy === 0 ? .86 : .53)) map[y + dy][x + dx].terrain = "forest";
    }
    for (let i = 0; i < Math.round(profile.ridges * scale); i++) {
      let x = 2 + Math.floor(rng() * (size - 4)), y = 2 + Math.floor(rng() * (size - 4));
      let dx = rng() < .5 ? -1 : 1, dy = rng() < .5 ? -1 : 1;
      for (let step = 0; step < profile.ridgeLength; step++) {
        if (Math.max(Math.abs(x - size / 2), Math.abs(y - size / 2)) > 3 && map[y][x].terrain !== "water") map[y][x].terrain = "hill";
        x = Math.max(1, Math.min(size - 2, x + (rng() < .62 ? dx : 0)));
        y = Math.max(1, Math.min(size - 2, y + (rng() < .62 ? dy : 0)));
        if (rng() < .18) dx *= -1;
        if (rng() < .18) dy *= -1;
      }
    }
    const cx = Math.floor(size / 2), cy = Math.floor(size / 2);
    const start = [[0, 0, "plains"], [-1, 0, "forest"], [1, 0, "hill"], [0, -1, "plains"], [0, 1, "plains"], [1, -1, "forest"], [-1, 1, "hill"], [1, 1, "desert"], [-2, 0, "plains"], [0, 2, "forest"], [2, 0, "hill"]];
    for (const [dx, dy, terrain] of start) map[cy + dy][cx + dx] = tile(terrain);
    if (map[cy - 1][cx - 1].terrain === "water") map[cy - 1][cx - 1].feature = "fish";
    map[cy][cx - 1].feature = "ore"; map[cy][cx + 1].feature = "ore"; map[cy - 1][cx].feature = "wheat";
    classifyWater(map, false);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (Math.abs(x - cx) <= 2 && Math.abs(y - cy) <= 2) continue;
      const item = map[y][x], r = rng() / profile.resourceScale;
      if (item.terrain === "water" && r < .18) item.feature = "fish";
      else if (item.terrain === "plains" && r < .13) item.feature = "wheat";
      else if (item.terrain === "hill" && r < .055) item.feature = "gems";
      else if (item.terrain === "hill" && r < .225) item.feature = "ore";
      else if (item.terrain === "desert" && r < .055) item.feature = "gems";
    }
    placePois(map, options.poiIds, rng);
    return { map, seed, profileId, rng, diagnostics: diagnose(map) };
  }
  const api = { PROFILES, LAND, WATER_KINDS, createRng, generate, classifyWater, diagnose };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.EpohiWorldGeneration = api;
})(typeof window !== "undefined" ? window : globalThis);
