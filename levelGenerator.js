/**
 * Level Generator Core
 * Phase-based procedural generation with validation for archeology game
 * Generates 72×48 tile maps with terrain, POIs, spawn, and obstacles
 */

// Constants
const MAP_WIDTH_TILES = 72;
const MAP_HEIGHT_TILES = 48;
const POI_COUNT = 15;
const MIN_POI_SPACING = 8;
const MAX_POI_SPACING = 12;
const SPAWN_RADIUS_TILES = 3;
const MAX_VALIDATION_ATTEMPTS = 10;

// Tile types
const TileType = {
  STONE: 'stone',
  DIRT: 'dirt',
  GRASS: 'grass',
  SAND: 'sand'
};

// Obstacle types with Roman theme
const ObstacleType = {
  RUIN_COLUMN: 'ruin_column',
  RUIN_WALL: 'ruin_wall',
  TREE_CYPRESS: 'tree_cypress',
  TREE_OLIVE: 'tree_olive',
  ROCK_SMALL: 'rock_small',
  ROCK_LARGE: 'rock_large'
};

// POI types
const POIType = {
  ARTIFACT: 'artifact',
  INSCRIPTION: 'inscription',
  MOSAIC: 'mosaic',
  STATUE: 'statue',
  STRUCTURE: 'structure'
};

// Generation phases
const GenerationPhase = {
  INIT: 'init',
  TERRAIN: 'terrain',
  POIS: 'pois',
  SPAWN: 'spawn',
  OBSTACLES: 'obstacles',
  VALIDATION: 'validation',
  FINALIZATION: 'finalization',
  COMPLETE: 'complete'
};

/**
 * Level Generator Class
 * Implements phase-based generation with validation
 */
class LevelGenerator {
  constructor(config) {
    this.config = {
      seed: config.seed || Date.now(),
      levelNumber: config.levelNumber || 1,
      width: MAP_WIDTH_TILES,
      height: MAP_HEIGHT_TILES,
      poiCount: POI_COUNT,
      minPOISpacing: config.minPOISpacing || MIN_POI_SPACING
    };

    this.rng = new SeededRandom(this.config.seed);

    this.state = {
      phase: GenerationPhase.INIT,
      grid: null,
      pois: null,
      playerSpawn: null,
      validationAttempts: 0,
      errors: []
    };
  }

  /**
   * Main generation method - orchestrates all phases
   * @returns {Object} Complete Level object
   */
  generate() {
    this.initializeGrid();
    this.generateTerrain();
    this.placePOIs();
    this.placePlayerSpawn();
    this.placeObstacles();
    this.validate();
    return this.finalize();
  }

  /**
   * PHASE 1: Initialize grid with all walkable tiles
   */
  initializeGrid() {
    this.state.phase = GenerationPhase.INIT;
    this.state.grid = Array(this.config.height)
      .fill(null)
      .map((_, y) =>
        Array(this.config.width)
          .fill(null)
          .map((_, x) => ({
            x,
            y,
            type: TileType.GRASS,
            isWalkable: true,
            obstacle: null,
            spriteIndex: 0
          }))
      );
  }

  /**
   * PHASE 2: Generate terrain using Perlin noise
   */
  generateTerrain() {
    this.state.phase = GenerationPhase.TERRAIN;

    const thresholds = (this.config.theme && this.config.theme.terrainThresholds)
      ? this.config.theme.terrainThresholds
      : [-0.3, 0.0, 0.3];

    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        const noise = this.rng.perlin(x * 0.1, y * 0.1);

        // Assign terrain type based on theme-configurable noise thresholds
        if (noise < thresholds[0]) {
          this.state.grid[y][x].type = TileType.STONE;
        } else if (noise < thresholds[1]) {
          this.state.grid[y][x].type = TileType.DIRT;
        } else if (noise < thresholds[2]) {
          this.state.grid[y][x].type = TileType.GRASS;
        } else {
          this.state.grid[y][x].type = TileType.SAND;
        }

        // Add sprite variation (0-3)
        this.state.grid[y][x].spriteIndex = this.rng.intBetween(0, 3);
      }
    }
  }

  /**
   * PHASE 3: Place POIs using Poisson disc sampling
   */
  placePOIs() {
    this.state.phase = GenerationPhase.POIS;

    // Define spawn exclusion zone (will be set in next phase)
    const spawnX = Math.floor(this.config.width / 2);
    const spawnY = Math.floor(this.config.height / 2);

    const excludedZones = [
      {
        x: spawnX,
        y: spawnY,
        radius: 4  // 4 tiles to prevent POIs from spawning too close to player
      }
    ];

    this.state.pois = poissonDiscSampling(
      {
        minDistance: this.config.minPOISpacing,
        maxAttempts: 50,  // Increased from 30 to 50 for better coverage
        gridWidth: this.config.width,
        gridHeight: this.config.height
      },
      this.config.poiCount,
      excludedZones,
      this.rng
    );
  }

  /**
   * PHASE 4: Place player spawn at center of map
   */
  placePlayerSpawn() {
    this.state.phase = GenerationPhase.SPAWN;
    this.state.playerSpawn = {
      x: Math.floor(this.config.width / 2),
      y: Math.floor(this.config.height / 2)
    };
  }

  /**
   * PHASE 5: Place obstacles using noise-based placement
   */
  placeObstacles() {
    this.state.phase = GenerationPhase.OBSTACLES;

    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        // Skip POI tiles and spawn area
        if (this.isTileReserved(x, y)) {
          continue;
        }

        // Use noise with different scale for obstacle placement
        const noise = this.rng.perlin(x * 0.05, y * 0.05);

        if (noise > 0.6) {
          const obstacleType = this.selectObstacleType();
          this.state.grid[y][x].obstacle = obstacleType;
          this.state.grid[y][x].isWalkable = false;
        }
      }
    }
  }

  /**
   * PHASE 6: Validate connectivity and fix if needed
   */
  validate() {
    this.state.phase = GenerationPhase.VALIDATION;

    while (this.state.validationAttempts < MAX_VALIDATION_ATTEMPTS) {
      const validation = this.validateAllPOIsReachable();

      if (validation.reachable) {
        return; // Success!
      }

      // Attempt to fix by carving paths to unreachable POIs
      for (const poi of validation.unreachablePOIs) {
        this.carvePath(this.state.playerSpawn, poi);
      }

      this.state.validationAttempts++;
    }

    throw new Error(
      `Failed validation after ${MAX_VALIDATION_ATTEMPTS} attempts. ` +
      `Could not make all POIs reachable from spawn.`
    );
  }

  /**
   * PHASE 7: Finalize level with POI metadata
   * @returns {Object} Complete Level object
   */
  finalize() {
    this.state.phase = GenerationPhase.FINALIZATION;

    // Assign POI types and artifacts
    const pois = this.state.pois.map((pos, i) => {
      const artifact = this.assignArtifactToPOI(i);

      return {
        id: i,
        position: pos,
        type: this.assignPOIType(),
        name: this.generatePOIName(i),
        description: this.generatePOIDescription(i),
        discoveryRadius: 2,
        discovered: false,
        wrongAttempts: 0,
        artifact: artifact
      };
    });

    this.state.phase = GenerationPhase.COMPLETE;

    return {
      config: {
        seed: this.config.seed,
        width: this.config.width,
        height: this.config.height,
        poiCount: this.config.poiCount
      },
      grid: this.state.grid,
      pois,
      playerSpawn: this.state.playerSpawn,
      discoveredPOIs: new Set(),
      metadata: {
        generationTime: Date.now(),
        validationAttempts: this.state.validationAttempts,
        seed: this.config.seed,
        version: '1.0.0'
      }
    };
  }

  /**
   * Check if tile is reserved (POI or spawn area)
   * @param {number} x - Tile X coordinate
   * @param {number} y - Tile Y coordinate
   * @returns {boolean} True if tile is reserved
   */
  isTileReserved(x, y) {
    // Check spawn area (3 tile radius)
    const spawnDistance = Math.abs(x - this.state.playerSpawn.x) +
                         Math.abs(y - this.state.playerSpawn.y);
    if (spawnDistance < SPAWN_RADIUS_TILES) {
      return true;
    }

    // Check POI tiles
    for (const poi of this.state.pois) {
      if (poi.x === x && poi.y === y) {
        return true;
      }
    }

    return false;
  }

  /**
   * Select random obstacle type with weighted distribution
   * @returns {string} Obstacle type
   */
  selectObstacleType() {
    const defaultWeights = [
      { type: ObstacleType.RUIN_COLUMN, weight: 0.2 },
      { type: ObstacleType.RUIN_WALL, weight: 0.2 },
      { type: ObstacleType.TREE_CYPRESS, weight: 0.2 },
      { type: ObstacleType.TREE_OLIVE, weight: 0.15 },
      { type: ObstacleType.ROCK_SMALL, weight: 0.15 },
      { type: ObstacleType.ROCK_LARGE, weight: 0.1 }
    ];

    const types = (this.config.theme && this.config.theme.obstacleWeights)
      ? this.config.theme.obstacleWeights
      : defaultWeights;

    return this.rng.weightedChoice(types).type;
  }

  /**
   * Validate that all POIs are reachable from spawn using flood fill
   * @returns {Object} Validation result with reachable status and unreachable POIs
   */
  validateAllPOIsReachable() {
    const reachableTiles = this.floodFill(this.state.playerSpawn);
    const unreachablePOIs = [];

    for (const poi of this.state.pois) {
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

  /**
   * Flood fill algorithm to find all reachable tiles
   * @param {Object} start - Starting point {x, y}
   * @returns {Set<string>} Set of reachable tile keys "x,y"
   */
  floodFill(start) {
    const visited = new Set();
    const queue = [start];

    while (queue.length > 0) {
      const current = queue.shift();
      const key = `${current.x},${current.y}`;

      if (visited.has(key)) {
        continue;
      }

      // Check bounds
      if (
        current.x < 0 || current.x >= this.config.width ||
        current.y < 0 || current.y >= this.config.height
      ) {
        continue;
      }

      // Check walkability
      if (!this.state.grid[current.y][current.x].isWalkable) {
        continue;
      }

      visited.add(key);

      // Add 4-directional neighbors
      queue.push({ x: current.x + 1, y: current.y });
      queue.push({ x: current.x - 1, y: current.y });
      queue.push({ x: current.x, y: current.y + 1 });
      queue.push({ x: current.x, y: current.y - 1 });
    }

    return visited;
  }

  /**
   * Carve a path from start to end by removing obstacles
   * Uses A* to find ideal path, then clears obstacles along it
   * @param {Object} start - Starting point {x, y}
   * @param {Object} end - Ending point {x, y}
   */
  carvePath(start, end) {
    const path = this.aStarIgnoringObstacles(start, end);

    // Clear obstacles along path with some randomness for natural look
    for (const point of path) {
      if (!this.state.grid[point.y][point.x].isWalkable) {
        // 50% chance to remove obstacle (creates varied paths)
        if (this.rng.next() < 0.5) {
          this.state.grid[point.y][point.x].obstacle = null;
          this.state.grid[point.y][point.x].isWalkable = true;
        }
      }
    }
  }

  /**
   * A* pathfinding that ignores obstacles
   * Used to find ideal path for carving
   * @param {Object} start - Starting point {x, y}
   * @param {Object} goal - Goal point {x, y}
   * @returns {Array<Object>} Path as array of points [{x, y}, ...]
   */
  aStarIgnoringObstacles(start, goal) {
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const startKey = `${start.x},${start.y}`;
    gScore.set(startKey, 0);
    fScore.set(startKey, this.manhattanDistance(start, goal));
    openSet.push(start);

    while (openSet.length > 0) {
      // Find node with lowest fScore
      openSet.sort((a, b) => {
        const aKey = `${a.x},${a.y}`;
        const bKey = `${b.x},${b.y}`;
        return fScore.get(aKey) - fScore.get(bKey);
      });

      const current = openSet.shift();
      const currentKey = `${current.x},${current.y}`;

      // Goal reached
      if (current.x === goal.x && current.y === goal.y) {
        return this.reconstructPath(cameFrom, current);
      }

      closedSet.add(currentKey);

      // Check 4-directional neighbors
      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 }
      ];

      for (const neighbor of neighbors) {
        // Check bounds
        if (
          neighbor.x < 0 || neighbor.x >= this.config.width ||
          neighbor.y < 0 || neighbor.y >= this.config.height
        ) {
          continue;
        }

        const neighborKey = `${neighbor.x},${neighbor.y}`;

        if (closedSet.has(neighborKey)) {
          continue;
        }

        const tentativeGScore = gScore.get(currentKey) + 1;

        if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeGScore);
          fScore.set(neighborKey, tentativeGScore + this.manhattanDistance(neighbor, goal));

          // Add to open set if not already there
          const inOpenSet = openSet.some(n => n.x === neighbor.x && n.y === neighbor.y);
          if (!inOpenSet) {
            openSet.push(neighbor);
          }
        }
      }
    }

    // No path found - return straight line
    return this.straightLinePath(start, goal);
  }

  /**
   * Reconstruct path from A* result
   * @param {Map} cameFrom - Map of node -> parent node
   * @param {Object} current - Current node
   * @returns {Array<Object>} Path as array of points
   */
  reconstructPath(cameFrom, current) {
    const path = [current];
    let currentKey = `${current.x},${current.y}`;

    while (cameFrom.has(currentKey)) {
      current = cameFrom.get(currentKey);
      path.unshift(current);
      currentKey = `${current.x},${current.y}`;
    }

    return path;
  }

  /**
   * Manhattan distance heuristic
   * @param {Object} a - Point A
   * @param {Object} b - Point B
   * @returns {number} Manhattan distance
   */
  manhattanDistance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  /**
   * Generate straight line path as fallback
   * @param {Object} start - Start point
   * @param {Object} end - End point
   * @returns {Array<Object>} Path as array of points
   */
  straightLinePath(start, end) {
    const path = [];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      path.push({
        x: Math.round(start.x + dx * t),
        y: Math.round(start.y + dy * t)
      });
    }

    return path;
  }

  /**
   * Assign artifact to POI (10 valuable, 5 junk)
   * Only assigns artifacts that require tools available at current level
   * @param {number} poiIndex - POI index
   * @returns {Object} Artifact data
   */
  assignArtifactToPOI(poiIndex) {
    const isValuable = poiIndex < 10; // First 10 are valuable

    // Get available tools for this level
    const availableTools = this.getAvailableTools();

    // Use theme artifact pool if available, otherwise fall back to defaults
    const themePool = this.config.theme && this.config.theme.artifactPool;

    // Build list of artifacts that require only available tools
    let artifactIds = [];

    if (isValuable) {
      const valuableArtifacts = themePool
        ? themePool.valuable
        : {
            shovel: ['amphora', 'oil_lamp', 'votive_statue'],
            pickaxe: ['mosaic_tile', 'fresco_fragment'],
            brush: ['denarius_coin', 'signet_ring', 'fibula'],
            hammer_chisel: ['strigil', 'gladius_pommel']
          };

      for (const tool of availableTools) {
        if (valuableArtifacts[tool]) {
          artifactIds.push(...valuableArtifacts[tool]);
        }
      }
    } else {
      const junkArtifacts = themePool
        ? themePool.junk
        : {
            shovel: ['corroded_nail', 'animal_bone'],
            pickaxe: ['stone_fragment'],
            brush: ['broken_pottery'],
            hammer_chisel: ['weathered_brick']
          };

      for (const tool of availableTools) {
        if (junkArtifacts[tool]) {
          artifactIds.push(...junkArtifacts[tool]);
        }
      }
    }

    // Get random artifact from available pool
    const artifactId = this.rng.choice(artifactIds);

    // Return artifact reference (will be looked up in ARTIFACT_CATALOG)
    return {
      id: artifactId,
      isValuable
    };
  }

  /**
   * Get available excavation tools for current level
   * @returns {Array<string>} Array of tool IDs
   */
  getAvailableTools() {
    const level = this.config.levelNumber;

    // Tool unlock progression matches TOOL_UNLOCKS from gameState.js
    const tools = ['shovel']; // Level 1 always has shovel

    if (level >= 2) tools.push('pickaxe');
    if (level >= 3) tools.push('brush');
    if (level >= 4) tools.push('hammer_chisel');

    return tools;
  }

  /**
   * Assign random POI type
   * @returns {string} POI type
   */
  assignPOIType() {
    const types = [
      POIType.ARTIFACT,
      POIType.INSCRIPTION,
      POIType.MOSAIC,
      POIType.STATUE,
      POIType.STRUCTURE
    ];
    return this.rng.choice(types);
  }

  /**
   * Generate POI name
   * @param {number} id - POI ID
   * @returns {string} POI name
   */
  generatePOIName(id) {
    const defaultPrefixes = ['Ancient', 'Lost', 'Hidden', 'Forgotten', 'Sacred'];
    const defaultSuffixes = ['Altar', 'Column', 'Inscription', 'Mosaic', 'Statue', 'Temple'];

    const prefixes = (this.config.theme && this.config.theme.poiPrefixes) || defaultPrefixes;
    const suffixes = (this.config.theme && this.config.theme.poiSuffixes) || defaultSuffixes;

    return `${this.rng.choice(prefixes)} ${this.rng.choice(suffixes)} ${id + 1}`;
  }

  /**
   * Generate POI description
   * @param {number} id - POI ID
   * @returns {string} POI description
   */
  generatePOIDescription(id) {
    const defaultDescriptions = [
      'A remarkable Roman artifact waiting to be discovered.',
      'Evidence of ancient Roman civilization lies here.',
      'This site holds secrets from the Roman Empire.',
      'A place where Romans once walked and worked.',
      'Ancient history preserved in stone and earth.'
    ];

    const descriptions = (this.config.theme && this.config.theme.poiDescriptions) || defaultDescriptions;
    return this.rng.choice(descriptions);
  }
}
