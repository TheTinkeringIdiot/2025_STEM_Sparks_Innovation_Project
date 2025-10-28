/**
 * Poisson Disc Sampling for POI Placement
 * Generates evenly-distributed points with guaranteed minimum spacing
 * Uses seeded RNG for reproducible level generation
 */

/**
 * Configuration for Poisson disc sampling
 * @typedef {Object} PoissonConfig
 * @property {number} minDistance - Minimum tiles between POIs (8-12 tiles)
 * @property {number} maxAttempts - Rejection sampling attempts (typically 30)
 * @property {number} gridWidth - Grid width in tiles
 * @property {number} gridHeight - Grid height in tiles
 */

/**
 * Point in 2D space
 * @typedef {Object} Point
 * @property {number} x - X coordinate in tiles
 * @property {number} y - Y coordinate in tiles
 */

/**
 * Rectangular exclusion zone
 * @typedef {Object} Rect
 * @property {number} x - Center X coordinate
 * @property {number} y - Center Y coordinate
 * @property {number} radius - Radius in tiles
 */

/**
 * Generate POI positions using Poisson disc sampling
 * @param {PoissonConfig} config - Sampling configuration
 * @param {number} targetCount - Number of POIs to generate (typically 15)
 * @param {Rect[]} excludedZones - Array of exclusion zones (player spawn, etc.)
 * @param {SeededRandom} rng - Seeded random number generator
 * @returns {Point[]} Array of POI positions with guaranteed minimum spacing
 * @throws {Error} If fewer than targetCount POIs generated after all attempts
 */
function poissonDiscSampling(config, targetCount, excludedZones, rng) {
  // Pre-calculate spatial grid cell size for O(1) neighbor lookup
  const cellSize = config.minDistance / Math.sqrt(2);
  const gridCols = Math.ceil(config.gridWidth / cellSize);
  const gridRows = Math.ceil(config.gridHeight / cellSize);

  // Spatial grid for O(1) neighbor lookup
  const grid = Array(gridRows)
    .fill(null)
    .map(() => Array(gridCols).fill(null));

  const points = [];
  const activeList = [];

  // Start with random initial point outside excluded zones
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

  if (initial === null) {
    throw new Error('Failed to find initial point outside excluded zones');
  }

  points.push(initial);
  activeList.push(initial);
  insertIntoGrid(grid, initial, cellSize);

  // Generate points using Poisson disc sampling
  while (activeList.length > 0 && points.length < targetCount) {
    const randomIndex = Math.floor(rng.next() * activeList.length);
    const point = activeList[randomIndex];
    let found = false;

    // Try to place new point around current point
    for (let i = 0; i < config.maxAttempts; i++) {
      const angle = rng.next() * Math.PI * 2;
      const radius = config.minDistance * (1 + rng.next());

      const candidate = {
        x: Math.round(point.x + radius * Math.cos(angle)),
        y: Math.round(point.y + radius * Math.sin(angle))
      };

      // Validate candidate
      if (
        isPointInBounds(candidate, config) &&
        !isInExcludedZone(candidate, excludedZones) &&
        !hasNearbyPoints(grid, candidate, config.minDistance, cellSize)
      ) {
        points.push(candidate);
        activeList.push(candidate);
        insertIntoGrid(grid, candidate, cellSize);
        found = true;
        break;
      }
    }

    if (!found) {
      activeList.splice(randomIndex, 1);
    }
  }

  // Ensure we generated the target number of POIs
  if (points.length < targetCount) {
    throw new Error(
      `Failed to generate ${targetCount} POIs. Only generated ${points.length} POIs. ` +
      `Try reducing minDistance or increasing grid size.`
    );
  }

  return points;
}

/**
 * Check if point has nearby points within minimum distance
 * @param {(Point|null)[][]} grid - Spatial grid
 * @param {Point} point - Point to check
 * @param {number} minDistance - Minimum distance threshold
 * @param {number} cellSize - Grid cell size
 * @returns {boolean} True if there are nearby points
 */
function hasNearbyPoints(grid, point, minDistance, cellSize) {
  const gridX = Math.floor(point.x / cellSize);
  const gridY = Math.floor(point.y / cellSize);

  // Check surrounding cells (5x5 neighborhood)
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const checkX = gridX + dx;
      const checkY = gridY + dy;

      if (
        checkY >= 0 && checkY < grid.length &&
        checkX >= 0 && checkX < grid[0].length &&
        grid[checkY][checkX] !== null
      ) {
        const existingPoint = grid[checkY][checkX];
        const distance = Math.sqrt(
          Math.pow(point.x - existingPoint.x, 2) +
          Math.pow(point.y - existingPoint.y, 2)
        );

        if (distance < minDistance) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Insert point into spatial grid
 * @param {(Point|null)[][]} grid - Spatial grid
 * @param {Point} point - Point to insert
 * @param {number} cellSize - Grid cell size
 */
function insertIntoGrid(grid, point, cellSize) {
  const gridX = Math.floor(point.x / cellSize);
  const gridY = Math.floor(point.y / cellSize);

  if (gridY >= 0 && gridY < grid.length && gridX >= 0 && gridX < grid[0].length) {
    grid[gridY][gridX] = point;
  }
}

/**
 * Check if point is within grid bounds
 * @param {Point} point - Point to check
 * @param {PoissonConfig} config - Grid configuration
 * @returns {boolean} True if point is in bounds
 */
function isPointInBounds(point, config) {
  return point.x >= 0 && point.x < config.gridWidth &&
         point.y >= 0 && point.y < config.gridHeight;
}

/**
 * Check if point is in any excluded zone
 * @param {Point} point - Point to check
 * @param {Rect[]} excludedZones - Array of exclusion zones
 * @returns {boolean} True if point is in excluded zone
 */
function isInExcludedZone(point, excludedZones) {
  for (const zone of excludedZones) {
    const distance = Math.sqrt(
      Math.pow(point.x - zone.x, 2) +
      Math.pow(point.y - zone.y, 2)
    );

    if (distance < zone.radius) {
      return true;
    }
  }

  return false;
}
