const world = require('../src/humans-world-generation');
const count = Number(process.argv[2] || 100);
for (const profileId of Object.keys(world.PROFILES)) {
  const sums = { water: 0, land: {}, waterKind: {}, start: {}, resources: {}, forestCluster: 0, hillCluster: 0, reachableLand: 0, poi: 0, invalid: 0 };
  for (let seed = 0; seed < count; seed++) {
    const result = world.generate({ size: 28, seed, profileId, poiIds: ['ruins', 'grove', 'mine', 'cave'] });
    const d = result.diagnostics;
    sums.water += (d.terrain.water || 0) / 784;
    for (const [id, value] of Object.entries(d.landPercent)) sums.land[id] = (sums.land[id] || 0) + value;
    for (const [id, value] of Object.entries(d.waterKind)) sums.waterKind[id] = (sums.waterKind[id] || 0) + value;
    for (const [id, value] of Object.entries(d.start)) sums.start[id] = (sums.start[id] || 0) + value;
    for (const [id, value] of Object.entries(d.resources)) sums.resources[id] = (sums.resources[id] || 0) + value;
    sums.forestCluster += d.largestForest;
    sums.hillCluster += d.largestHill;
    sums.reachableLand += d.reachableLand;
    sums.poi += d.poi;
    sums.invalid += d.invalid;
  }
  const average = object => Object.fromEntries(Object.entries(object).map(([key, value]) => [key, Math.round(value / count * 10) / 10]));
  console.log(JSON.stringify({ profileId, seeds: count, waterPercent: Math.round(sums.water / count * 1000) / 10, landPercent: average(sums.land), waterKind: average(sums.waterKind), largestForest: Math.round(sums.forestCluster / count * 10) / 10, largestHill: Math.round(sums.hillCluster / count * 10) / 10, reachableLand: Math.round(sums.reachableLand / count * 10) / 10, start: average(sums.start), resources: average(sums.resources), poi: Math.round(sums.poi / count * 10) / 10, invalid: sums.invalid, regenerated: 0 }));
}
