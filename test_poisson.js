// Load the required files
const fs = require('fs');
eval(fs.readFileSync('seededRandom.js', 'utf8'));
eval(fs.readFileSync('poissonDisc.js', 'utf8'));

// Instrumented version to track what's happening
function poissonDiscSamplingDebug(config, targetCount, excludedZones, rng) {
  const cellSize = config.minDistance / Math.sqrt(2);
  const gridCols = Math.ceil(config.gridWidth / cellSize);
  const gridRows = Math.ceil(config.gridHeight / cellSize);

  console.log(`Cell size: ${cellSize}, Grid: ${gridCols}x${gridRows}`);

  const grid = Array(gridRows)
    .fill(null)
    .map(() => Array(gridCols).fill(null));

  const points = [];
  const activeList = [];

  // Find initial point
  let initial = null;
  let initialAttempts = 0;
  const maxInitialAttempts = 1000;

  while (initial === null && initialAttempts < maxInitialAttempts) {
    const candidate = {
      x: Math.floor(rng.next() * config.gridWidth),
      y: Math.floor(rng.next() * config.gridHeight)
    };

    if (!isInExcludedZone(candidate, excludedZones)) {
      initial = candidate;
    }
    initialAttempts++;
  }

  console.log(`Initial point found after ${initialAttempts} attempts:`, initial);

  points.push(initial);
  activeList.push(initial);
  insertIntoGrid(grid, initial, cellSize);

  // Main loop
  let iterations = 0;
  while (activeList.length > 0 && points.length < targetCount) {
    iterations++;
    const randomIndex = Math.floor(rng.next() * activeList.length);
    const point = activeList[randomIndex];
    let found = false;

    console.log(`\n--- Iteration ${iterations} ---`);
    console.log(`Active list size: ${activeList.length}, Points: ${points.length}`);
    console.log(`Trying from point:`, point);

    // Try to place new point
    for (let i = 0; i < config.maxAttempts; i++) {
      const angle = rng.next() * Math.PI * 2;
      const radius = config.minDistance * (1 + rng.next());

      const candidate = {
        x: Math.round(point.x + radius * Math.cos(angle)),
        y: Math.round(point.y + radius * Math.sin(angle))
      };

      const inBounds = isInBounds(candidate, config);
      const inExcluded = isInExcludedZone(candidate, excludedZones);
      const hasNearby = hasNearbyPoints(grid, candidate, config.minDistance, cellSize);

      if (i < 3) {  // Log first 3 attempts
        console.log(`  Attempt ${i}: (${candidate.x}, ${candidate.y}) - bounds:${inBounds}, excluded:${inExcluded}, nearby:${hasNearby}`);
      }

      if (inBounds && !inExcluded && !hasNearby) {
        points.push(candidate);
        activeList.push(candidate);
        insertIntoGrid(grid, candidate, cellSize);
        found = true;
        console.log(`  ✓ Found valid point at (${candidate.x}, ${candidate.y})`);
        break;
      }
    }

    if (!found) {
      activeList.splice(randomIndex, 1);
      console.log(`  ✗ No valid point found, removed from active list`);
    }

    if (iterations > 100) {
      console.log('Stopping after 100 iterations for debugging');
      break;
    }
  }

  console.log(`\nFinal: ${points.length} points generated`);
  return points;
}

// Test
const rng = new SeededRandom(12345);
const config = {
  minDistance: 5,
  maxAttempts: 50,
  gridWidth: 72,
  gridHeight: 48
};
const excludedZones = [{ x: 36, y: 24, radius: 1 }];

try {
  const points = poissonDiscSamplingDebug(config, 15, excludedZones, rng);
  console.log('\nSUCCESS: Generated', points.length, 'points');
} catch (e) {
  console.log('\nERROR:', e.message);
}
