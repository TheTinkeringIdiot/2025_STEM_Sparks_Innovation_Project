/**
 * Pathfinding and Connectivity Validation
 * Provides flood fill validation and A* pathfinding for level generation
 * Ensures all POIs are reachable from player spawn point
 */

// ============================================================================
// Priority Queue (Min-Heap)
// ============================================================================

/**
 * Priority queue implementation using binary min-heap
 * Used for efficient A* pathfinding open set management
 */
class PriorityQueue {
  constructor(compareFn) {
    this.items = [];
    this.compareFn = compareFn;
  }

  push(item) {
    this.items.push(item);
    this.bubbleUp(this.items.length - 1);
  }

  pop() {
    if (this.items.length === 0) return undefined;

    const result = this.items[0];
    const end = this.items.pop();

    if (this.items.length > 0) {
      this.items[0] = end;
      this.bubbleDown(0);
    }

    return result;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  bubbleUp(index) {
    const element = this.items[index];

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.items[parentIndex];

      if (this.compareFn(element, parent) >= 0) break;

      this.items[index] = parent;
      index = parentIndex;
    }

    this.items[index] = element;
  }

  bubbleDown(index) {
    const length = this.items.length;
    const element = this.items[index];

    while (true) {
      let swapIndex = -1;
      const leftIndex = 2 * index + 1;
      const rightIndex = 2 * index + 2;

      if (leftIndex < length) {
        const left = this.items[leftIndex];
        if (this.compareFn(left, element) < 0) {
          swapIndex = leftIndex;
        }
      }

      if (rightIndex < length) {
        const right = this.items[rightIndex];
        if (
          this.compareFn(right, swapIndex === -1 ? element : this.items[swapIndex]) < 0
        ) {
          swapIndex = rightIndex;
        }
      }

      if (swapIndex === -1) break;

      this.items[index] = this.items[swapIndex];
      index = swapIndex;
    }

    this.items[index] = element;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate Manhattan distance between two points
 * Used as heuristic for A* pathfinding
 */
function manhattanDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Check if coordinates are within grid bounds
 */
function isInBounds(grid, x, y) {
  return y >= 0 && y < grid.length && x >= 0 && x < grid[0].length;
}

/**
 * Check if a tile is walkable (not an obstacle)
 */
function isWalkable(grid, x, y) {
  if (!isInBounds(grid, x, y)) return false;
  return !grid[y][x].isObstacle;
}

/**
 * Get 4-directional neighbors of a position
 */
function getNeighbors(x, y) {
  return [
    { x: x + 1, y: y },
    { x: x - 1, y: y },
    { x: x, y: y + 1 },
    { x: x, y: y - 1 }
  ];
}

// ============================================================================
// Flood Fill Algorithm
// ============================================================================

/**
 * Perform flood fill BFS from start position
 * Returns Set of reachable tile keys in "x,y" format
 *
 * This is cheaper than running A* 15 times (once per POI)
 *
 * @param {Array<Array>} grid - 2D array of tile objects
 * @param {Object} start - Starting point {x, y}
 * @returns {Set<string>} Set of reachable tile keys
 */
function floodFill(grid, start) {
  const visited = new Set();
  const queue = [start];

  while (queue.length > 0) {
    const current = queue.shift();
    const key = `${current.x},${current.y}`;

    if (visited.has(key)) continue;
    if (!isWalkable(grid, current.x, current.y)) continue;

    visited.add(key);

    // Add 4-directional neighbors
    const neighbors = getNeighbors(current.x, current.y);

    for (const neighbor of neighbors) {
      if (isInBounds(grid, neighbor.x, neighbor.y)) {
        queue.push(neighbor);
      }
    }
  }

  return visited;
}

// ============================================================================
// Connectivity Validation
// ============================================================================

/**
 * Validate that all POIs are reachable from player spawn
 * Uses flood fill for efficient batch validation
 *
 * @param {Array<Array>} grid - 2D array of tile objects
 * @param {Object} playerSpawn - Player spawn point {x, y}
 * @param {Array<Object>} pois - Array of POI objects with {x, y} coords
 * @returns {Object} { reachable: boolean, unreachablePOIs: Array }
 */
function validateAllPOIsReachable(grid, playerSpawn, pois) {
  const reachableTiles = floodFill(grid, playerSpawn);
  const unreachablePOIs = [];

  for (const poi of pois) {
    const key = `${poi.x},${poi.y}`;
    if (!reachableTiles.has(key)) {
      unreachablePOIs.push(poi);
    }
  }

  return {
    reachable: unreachablePOIs.length === 0,
    unreachablePOIs
  };
}

// ============================================================================
// A* Pathfinding
// ============================================================================

/**
 * A* pathfinding algorithm
 * Can ignore obstacles when carving paths to unreachable POIs
 *
 * @param {Array<Array>} grid - 2D array of tile objects
 * @param {Object} start - Start point {x, y}
 * @param {Object} goal - Goal point {x, y}
 * @param {boolean} ignoreObstacles - If true, treat all tiles as walkable
 * @returns {Array<Object>|null} Path as array of {x, y} points, or null if no path
 */
function aStar(grid, start, goal, ignoreObstacles = false) {
  const openSet = new PriorityQueue((a, b) => a.f - b.f);
  const closedSet = new Set();

  const startNode = {
    x: start.x,
    y: start.y,
    g: 0,
    h: manhattanDistance(start, goal),
    f: 0,
    parent: null
  };
  startNode.f = startNode.g + startNode.h;

  openSet.push(startNode);

  while (!openSet.isEmpty()) {
    const current = openSet.pop();
    const key = `${current.x},${current.y}`;

    // Goal reached
    if (current.x === goal.x && current.y === goal.y) {
      return reconstructPath(current);
    }

    closedSet.add(key);

    // Check 4-directional neighbors
    const neighbors = getNeighbors(current.x, current.y);

    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;

      if (closedSet.has(neighborKey)) continue;
      if (!isInBounds(grid, neighbor.x, neighbor.y)) continue;
      if (!ignoreObstacles && !isWalkable(grid, neighbor.x, neighbor.y)) continue;

      const tentativeG = current.g + 1; // Uniform cost

      const neighborNode = {
        x: neighbor.x,
        y: neighbor.y,
        g: tentativeG,
        h: manhattanDistance(neighbor, goal),
        f: 0,
        parent: current
      };
      neighborNode.f = neighborNode.g + neighborNode.h;

      openSet.push(neighborNode);
    }
  }

  return null; // No path found
}

/**
 * Reconstruct path from A* node chain
 */
function reconstructPath(node) {
  const path = [];
  let current = node;

  while (current !== null) {
    path.unshift({ x: current.x, y: current.y });
    current = current.parent;
  }

  return path;
}

// ============================================================================
// Path Carving
// ============================================================================

/**
 * Carve a path between two points by removing obstacles
 * Uses A* ignoring obstacles to find ideal path, then removes 40-50% of obstacles
 *
 * @param {Array<Array>} grid - 2D array of tile objects
 * @param {Object} start - Start point {x, y}
 * @param {Object} end - End point {x, y}
 * @param {Object} rng - Seeded random number generator (optional, uses Math.random if not provided)
 */
function carvePath(grid, start, end, rng = null) {
  // Use A* ignoring obstacles to find ideal path
  const path = aStar(grid, start, end, true);

  if (!path) return; // No path possible (shouldn't happen)

  // Get random function (seeded or Math.random)
  const random = rng ? () => rng.random() : () => Math.random();

  // Clear 40-50% of obstacles along path randomly
  // This creates a more natural-looking carved path
  const clearChance = 0.4 + random() * 0.1; // 40-50%

  for (const point of path) {
    if (grid[point.y][point.x].isObstacle) {
      if (random() < clearChance) {
        grid[point.y][point.x].isObstacle = false;
      }
    }
  }
}

/**
 * Attempt to fix connectivity by carving paths to unreachable POIs
 *
 * @param {Array<Array>} grid - 2D array of tile objects
 * @param {Object} playerSpawn - Player spawn point {x, y}
 * @param {Array<Object>} unreachablePOIs - Array of unreachable POI objects
 * @param {Object} rng - Seeded random number generator (optional)
 */
function fixConnectivity(grid, playerSpawn, unreachablePOIs, rng = null) {
  for (const poi of unreachablePOIs) {
    carvePath(grid, playerSpawn, poi, rng);
  }
}

// ============================================================================
// Exports
// ============================================================================

// For use in browser via script tag
if (typeof window !== 'undefined') {
  window.PriorityQueue = PriorityQueue;
  window.floodFill = floodFill;
  window.validateAllPOIsReachable = validateAllPOIsReachable;
  window.aStar = aStar;
  window.carvePath = carvePath;
  window.fixConnectivity = fixConnectivity;
  window.manhattanDistance = manhattanDistance;
  window.isWalkable = isWalkable;
  window.isInBounds = isInBounds;
}
