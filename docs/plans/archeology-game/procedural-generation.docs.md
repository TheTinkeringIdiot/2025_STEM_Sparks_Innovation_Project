# Procedural Generation Research for 2D Tile-Based Archaeology Game

## Summary

For a 2D tile-based archaeology game with Roman theme, the recommended approach combines **Poisson Disc Sampling** for POI placement with minimum spacing constraints, **A* pathfinding** for connectivity validation, and **cellular automata** or **noise-based generation** for obstacle placement. This approach ensures navigable paths between player spawn and all POIs while maintaining aesthetic variety. Seed-based PRNGs enable reproducible generation, and tile-coordinate-based collision detection provides efficient obstacle handling for 40x40px tiles.

## 1. Recommended Obstacle Placement Algorithm

### Primary Approach: Noise-Based Placement with Connectivity Validation

**Algorithm: Perlin/Simplex Noise + Flood Fill Validation**

This two-phase approach generates natural-looking obstacle distributions while ensuring navigability:

#### Phase 1: Generate Obstacle Density Map
```typescript
interface NoiseConfig {
  seed: number;
  scale: number;      // Typically 0.05-0.15 for organic patterns
  octaves: number;    // 2-4 for varied detail
  persistence: number; // 0.5 typical
  lacunarity: number;  // 2.0 typical
}

// Use noise function to determine obstacle probability per tile
function shouldPlaceObstacle(x: number, y: number, config: NoiseConfig): boolean {
  const noiseValue = perlinNoise(x * config.scale, y * config.scale, config);
  const threshold = 0.6; // Tune for desired density (0.5-0.7 typical)
  return noiseValue > threshold;
}
```

#### Phase 2: Validate and Prune
```typescript
function validateConnectivity(
  grid: Tile[][],
  playerSpawn: Point,
  pois: Point[]
): boolean {
  // Flood fill from player spawn
  const reachable = floodFill(grid, playerSpawn);

  // Verify all POIs are reachable
  return pois.every(poi => reachable.has(pointToKey(poi)));
}

// If validation fails, iteratively remove obstacles along failed paths
function pruneObstacles(
  grid: Tile[][],
  start: Point,
  unreachableTarget: Point
): void {
  // Find path ignoring obstacles (Manhattan or A*)
  const idealPath = findPathIgnoringObstacles(start, unreachableTarget);

  // Remove random subset of obstacles along path (30-50%)
  for (const point of idealPath) {
    if (grid[point.y][point.x].isObstacle && Math.random() < 0.4) {
      grid[point.y][point.x].isObstacle = false;
    }
  }
}
```

### Alternative Approach: Cellular Automata

For more organic, clustered obstacles (good for ruins/rock formations):

```typescript
function cellularAutomata(
  grid: boolean[][],
  iterations: number = 4,
  birthLimit: number = 4,
  deathLimit: number = 3
): void {
  for (let i = 0; i < iterations; i++) {
    const newGrid = grid.map(row => [...row]);

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const neighbors = countNeighbors(grid, x, y);

        if (grid[y][x]) {
          // Cell is alive
          newGrid[y][x] = neighbors >= deathLimit;
        } else {
          // Cell is dead
          newGrid[y][x] = neighbors > birthLimit;
        }
      }
    }

    grid = newGrid;
  }
}
```

### Obstacle Type Distribution for Roman Theme

```typescript
interface ObstacleType {
  type: 'ruin' | 'tree' | 'rock';
  walkable: boolean;
  weight: number; // Probability weight
}

const romanThemeObstacles: ObstacleType[] = [
  { type: 'ruin', walkable: false, weight: 0.4 },  // 40% - broken columns, walls
  { type: 'tree', walkable: false, weight: 0.35 }, // 35% - cypress, olive trees
  { type: 'rock', walkable: false, weight: 0.25 }  // 25% - limestone boulders
];

function selectObstacleType(obstacles: ObstacleType[]): string {
  const totalWeight = obstacles.reduce((sum, o) => sum + o.weight, 0);
  let random = Math.random() * totalWeight;

  for (const obstacle of obstacles) {
    random -= obstacle.weight;
    if (random <= 0) return obstacle.type;
  }

  return obstacles[0].type;
}
```

## 2. POI Placement with Spacing Constraints

### Recommended Algorithm: Poisson Disc Sampling

Poisson Disc Sampling generates evenly-distributed points with guaranteed minimum spacing, ideal for placing 15 POIs.

```typescript
interface PoissonConfig {
  minDistance: number;  // Minimum tiles between POIs (e.g., 8-12 tiles)
  maxAttempts: number;  // Rejection sampling attempts (typically 30)
  gridWidth: number;
  gridHeight: number;
}

function poissonDiscSampling(
  config: PoissonConfig,
  targetCount: number,
  excludedZones: Rect[] // Player spawn area, etc.
): Point[] {
  const cellSize = config.minDistance / Math.sqrt(2);
  const gridCols = Math.ceil(config.gridWidth / cellSize);
  const gridRows = Math.ceil(config.gridHeight / cellSize);

  // Spatial grid for O(1) neighbor lookup
  const grid: (Point | null)[][] = Array(gridRows)
    .fill(null)
    .map(() => Array(gridCols).fill(null));

  const points: Point[] = [];
  const activeList: Point[] = [];

  // Start with random initial point
  const initial = randomPoint(config.gridWidth, config.gridHeight);
  points.push(initial);
  activeList.push(initial);
  insertIntoGrid(grid, initial, cellSize);

  while (activeList.length > 0 && points.length < targetCount) {
    const randomIndex = Math.floor(Math.random() * activeList.length);
    const point = activeList[randomIndex];
    let found = false;

    // Try to place new point around current point
    for (let i = 0; i < config.maxAttempts; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = config.minDistance * (1 + Math.random());

      const candidate: Point = {
        x: Math.round(point.x + radius * Math.cos(angle)),
        y: Math.round(point.y + radius * Math.sin(angle))
      };

      // Validate candidate
      if (
        isInBounds(candidate, config) &&
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

  return points;
}

function hasNearbyPoints(
  grid: (Point | null)[][],
  point: Point,
  minDistance: number,
  cellSize: number
): boolean {
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
        const existingPoint = grid[checkY][checkX]!;
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
```

### Alternative: Relaxation Method (Lloyd's Algorithm)

For more uniformly distributed POIs:

```typescript
function relaxPOIs(
  points: Point[],
  iterations: number,
  bounds: Rect
): Point[] {
  let current = [...points];

  for (let iter = 0; iter < iterations; iter++) {
    const voronoi = computeVoronoi(current, bounds);

    // Move each point toward centroid of its Voronoi cell
    current = current.map((point, i) => {
      const cell = voronoi.cells[i];
      return computeCentroid(cell);
    });
  }

  return current;
}
```

### POI Type Assignment

```typescript
interface POI {
  position: Point;
  type: 'artifact' | 'inscription' | 'mosaic' | 'statue' | 'structure';
  discoveryRadius: number; // Tiles within which player can discover
  points: number;
}

function assignPOITypes(positions: Point[], seed: number): POI[] {
  const rng = new SeededRandom(seed);

  const types: POI['type'][] = [
    'artifact',     // 30%
    'inscription',  // 25%
    'mosaic',       // 20%
    'statue',       // 15%
    'structure'     // 10%
  ];

  return positions.map(pos => ({
    position: pos,
    type: rng.weightedChoice(types),
    discoveryRadius: 2, // 2 tiles
    points: rng.intBetween(10, 50)
  }));
}
```

## 3. Pathfinding Validation Approach

### A* Pathfinding for Validation

A* is the industry-standard algorithm for tile-based pathfinding validation. Use it to verify connectivity after generation.

```typescript
interface PathNode {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // Total: g + h
  parent: PathNode | null;
}

function aStar(
  grid: Tile[][],
  start: Point,
  goal: Point
): Point[] | null {
  const openSet = new PriorityQueue<PathNode>((a, b) => a.f - b.f);
  const closedSet = new Set<string>();

  const startNode: PathNode = {
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
    const current = openSet.pop()!;
    const key = `${current.x},${current.y}`;

    // Goal reached
    if (current.x === goal.x && current.y === goal.y) {
      return reconstructPath(current);
    }

    closedSet.add(key);

    // Check 4-directional neighbors (or 8 for diagonal)
    const neighbors = getNeighbors(grid, current.x, current.y);

    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;

      if (closedSet.has(neighborKey) || !isWalkable(grid, neighbor.x, neighbor.y)) {
        continue;
      }

      const tentativeG = current.g + 1; // Assume uniform cost

      const neighborNode: PathNode = {
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

function manhattanDistance(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function reconstructPath(node: PathNode): Point[] {
  const path: Point[] = [];
  let current: PathNode | null = node;

  while (current !== null) {
    path.unshift({ x: current.x, y: current.y });
    current = current.parent;
  }

  return path;
}
```

### Efficient Batch Validation

Instead of running A* 15 times (once per POI), use flood fill once:

```typescript
function validateAllPOIsReachable(
  grid: Tile[][],
  playerSpawn: Point,
  pois: Point[]
): { reachable: boolean; unreachablePOIs: Point[] } {
  const reachableTiles = floodFill(grid, playerSpawn);
  const unreachablePOIs: Point[] = [];

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

function floodFill(grid: Tile[][], start: Point): Set<string> {
  const visited = new Set<string>();
  const queue: Point[] = [start];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.x},${current.y}`;

    if (visited.has(key)) continue;
    if (!isWalkable(grid, current.x, current.y)) continue;

    visited.add(key);

    // Add 4-directional neighbors
    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 }
    ];

    for (const neighbor of neighbors) {
      if (isInBounds(grid, neighbor.x, neighbor.y)) {
        queue.push(neighbor);
      }
    }
  }

  return visited;
}
```

### Regeneration Strategy

```typescript
function generateLevelWithValidation(config: LevelConfig): Level {
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate level
    const grid = initializeGrid(config.width, config.height);
    const pois = generatePOIs(config);
    const playerSpawn = generatePlayerSpawn(config);

    // Place obstacles
    placeObstacles(grid, config);

    // Validate connectivity
    const validation = validateAllPOIsReachable(grid, playerSpawn, pois);

    if (validation.reachable) {
      return { grid, pois, playerSpawn };
    }

    // Attempt to fix by carving paths
    for (const unreachablePOI of validation.unreachablePOIs) {
      carvePath(grid, playerSpawn, unreachablePOI);
    }

    // Re-validate
    const revalidation = validateAllPOIsReachable(grid, playerSpawn, pois);
    if (revalidation.reachable) {
      return { grid, pois, playerSpawn };
    }
  }

  throw new Error('Failed to generate valid level after maximum attempts');
}

function carvePath(grid: Tile[][], start: Point, end: Point): void {
  // Use A* ignoring obstacles to find ideal path
  const path = aStarIgnoringObstacles(grid, start, end);

  // Clear obstacles along path with some randomness
  for (const point of path) {
    if (Math.random() < 0.5) { // 50% chance to keep some obstacles
      grid[point.y][point.x].isObstacle = false;
    }
  }
}
```

## 4. Collision Detection Pattern for 40x40px Tiles

### Tile-Coordinate-Based Collision (Most Efficient)

For discrete tile-based movement (player snaps to grid):

```typescript
interface Entity {
  tileX: number;
  tileY: number;
  pixelX: number; // For smooth rendering
  pixelY: number;
}

interface Tile {
  x: number;
  y: number;
  type: TileType;
  isWalkable: boolean;
  obstacle: ObstacleType | null;
}

const TILE_SIZE = 40;

// Convert pixel coordinates to tile coordinates
function pixelToTile(pixelX: number, pixelY: number): Point {
  return {
    x: Math.floor(pixelX / TILE_SIZE),
    y: Math.floor(pixelY / TILE_SIZE)
  };
}

// Convert tile coordinates to pixel coordinates (top-left corner)
function tileToPixel(tileX: number, tileY: number): Point {
  return {
    x: tileX * TILE_SIZE,
    y: tileY * TILE_SIZE
  };
}

// Check if tile is walkable
function canMoveTo(grid: Tile[][], tileX: number, tileY: number): boolean {
  // Bounds check
  if (tileY < 0 || tileY >= grid.length || tileX < 0 || tileX >= grid[0].length) {
    return false;
  }

  return grid[tileY][tileX].isWalkable;
}

// Handle player movement
function movePlayer(
  player: Entity,
  direction: Direction,
  grid: Tile[][]
): boolean {
  const nextTileX = player.tileX + direction.dx;
  const nextTileY = player.tileY + direction.dy;

  if (canMoveTo(grid, nextTileX, nextTileY)) {
    player.tileX = nextTileX;
    player.tileY = nextTileY;
    player.pixelX = nextTileX * TILE_SIZE;
    player.pixelY = nextTileY * TILE_SIZE;
    return true;
  }

  return false;
}
```

### AABB Collision for Smooth Movement

For smooth, pixel-based movement with tile-based collision:

```typescript
interface AABB {
  x: number;      // Top-left pixel X
  y: number;      // Top-left pixel Y
  width: number;  // Typically 30-36 (smaller than tile for tight fit)
  height: number;
}

interface Entity {
  x: number;      // Pixel coordinates
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
}

function getAABB(entity: Entity): AABB {
  return {
    x: entity.x,
    y: entity.y,
    width: entity.width,
    height: entity.height
  };
}

// Get all tiles that entity's AABB overlaps
function getOverlappingTiles(aabb: AABB): Point[] {
  const tiles: Point[] = [];

  const leftTile = Math.floor(aabb.x / TILE_SIZE);
  const rightTile = Math.floor((aabb.x + aabb.width - 1) / TILE_SIZE);
  const topTile = Math.floor(aabb.y / TILE_SIZE);
  const bottomTile = Math.floor((aabb.y + aabb.height - 1) / TILE_SIZE);

  for (let y = topTile; y <= bottomTile; y++) {
    for (let x = leftTile; x <= rightTile; x++) {
      tiles.push({ x, y });
    }
  }

  return tiles;
}

// Update player with collision detection
function updatePlayer(
  player: Entity,
  grid: Tile[][],
  deltaTime: number
): void {
  // Calculate desired movement
  const desiredX = player.x + player.velocityX * deltaTime;
  const desiredY = player.y + player.velocityY * deltaTime;

  // Test X movement
  const testX: AABB = {
    x: desiredX,
    y: player.y,
    width: player.width,
    height: player.height
  };

  if (!hasCollision(testX, grid)) {
    player.x = desiredX;
  } else {
    player.velocityX = 0;
  }

  // Test Y movement
  const testY: AABB = {
    x: player.x,
    y: desiredY,
    width: player.width,
    height: player.height
  };

  if (!hasCollision(testY, grid)) {
    player.y = desiredY;
  } else {
    player.velocityY = 0;
  }
}

function hasCollision(aabb: AABB, grid: Tile[][]): boolean {
  const tiles = getOverlappingTiles(aabb);

  for (const tile of tiles) {
    if (!canMoveTo(grid, tile.x, tile.y)) {
      return true;
    }
  }

  return false;
}
```

### POI Discovery Collision

```typescript
function checkPOIDiscovery(
  player: Entity,
  pois: POI[],
  discoveredPOIs: Set<number>
): POI | null {
  const playerTile = pixelToTile(player.x + player.width / 2, player.y + player.height / 2);

  for (let i = 0; i < pois.length; i++) {
    if (discoveredPOIs.has(i)) continue;

    const poi = pois[i];
    const distance = Math.sqrt(
      Math.pow(playerTile.x - poi.position.x, 2) +
      Math.pow(playerTile.y - poi.position.y, 2)
    );

    if (distance <= poi.discoveryRadius) {
      discoveredPOIs.add(i);
      return poi;
    }
  }

  return null;
}
```

## 5. Example Data Structures for Level Generation

### Core Type Definitions

```typescript
// Basic types
type Point = { x: number; y: number };
type Rect = { x: number; y: number; width: number; height: number };

// Tile types
enum TileType {
  GROUND = 'ground',
  GRASS = 'grass',
  DIRT = 'dirt',
  STONE = 'stone',
  SAND = 'sand'
}

enum ObstacleType {
  RUIN_COLUMN = 'ruin_column',
  RUIN_WALL = 'ruin_wall',
  TREE_CYPRESS = 'tree_cypress',
  TREE_OLIVE = 'tree_olive',
  ROCK_SMALL = 'rock_small',
  ROCK_LARGE = 'rock_large'
}

// Tile definition
interface Tile {
  x: number;
  y: number;
  type: TileType;
  isWalkable: boolean;
  obstacle: ObstacleType | null;
  spriteIndex: number; // For texture variation
}

// POI definition
interface POI {
  id: number;
  position: Point;
  type: 'artifact' | 'inscription' | 'mosaic' | 'statue' | 'structure';
  name: string;
  description: string;
  discoveryRadius: number;
  points: number;
  discovered: boolean;
}

// Level configuration
interface LevelConfig {
  seed: number;
  width: number;          // Grid width in tiles
  height: number;         // Grid height in tiles
  poiCount: number;       // Number of POIs (typically 15)
  minPOISpacing: number;  // Minimum tiles between POIs
  obstacleDensity: number; // 0.0 to 1.0
  theme: 'roman';
}

// Complete level
interface Level {
  config: LevelConfig;
  grid: Tile[][];
  pois: POI[];
  playerSpawn: Point;
  discoveredPOIs: Set<number>;
  metadata: LevelMetadata;
}

interface LevelMetadata {
  generationTime: number;
  attempts: number;
  seed: number;
  version: string;
}
```

### Level Generation State Machine

```typescript
enum GenerationPhase {
  INIT = 'init',
  TERRAIN = 'terrain',
  POIS = 'pois',
  SPAWN = 'spawn',
  OBSTACLES = 'obstacles',
  VALIDATION = 'validation',
  FINALIZATION = 'finalization',
  COMPLETE = 'complete'
}

interface GenerationState {
  phase: GenerationPhase;
  grid: Tile[][] | null;
  pois: Point[] | null;
  playerSpawn: Point | null;
  validationAttempts: number;
  errors: string[];
}

class LevelGenerator {
  private state: GenerationState;
  private config: LevelConfig;
  private rng: SeededRandom;

  constructor(config: LevelConfig) {
    this.config = config;
    this.rng = new SeededRandom(config.seed);
    this.state = {
      phase: GenerationPhase.INIT,
      grid: null,
      pois: null,
      playerSpawn: null,
      validationAttempts: 0,
      errors: []
    };
  }

  generate(): Level {
    this.initializeGrid();
    this.generateTerrain();
    this.placePOIs();
    this.placePlayerSpawn();
    this.placeObstacles();
    this.validate();
    return this.finalize();
  }

  private initializeGrid(): void {
    this.state.phase = GenerationPhase.INIT;
    this.state.grid = Array(this.config.height)
      .fill(null)
      .map((_, y) =>
        Array(this.config.width)
          .fill(null)
          .map((_, x) => ({
            x,
            y,
            type: TileType.GROUND,
            isWalkable: true,
            obstacle: null,
            spriteIndex: 0
          }))
      );
  }

  private generateTerrain(): void {
    this.state.phase = GenerationPhase.TERRAIN;
    // Use Perlin noise for terrain variation
    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        const noise = this.rng.perlin(x * 0.1, y * 0.1);

        // Assign terrain type based on noise
        if (noise < -0.3) {
          this.state.grid![y][x].type = TileType.STONE;
        } else if (noise < 0.0) {
          this.state.grid![y][x].type = TileType.DIRT;
        } else if (noise < 0.3) {
          this.state.grid![y][x].type = TileType.GRASS;
        } else {
          this.state.grid![y][x].type = TileType.SAND;
        }

        // Add sprite variation
        this.state.grid![y][x].spriteIndex = this.rng.intBetween(0, 3);
      }
    }
  }

  private placePOIs(): void {
    this.state.phase = GenerationPhase.POIS;
    this.state.pois = poissonDiscSampling(
      {
        minDistance: this.config.minPOISpacing,
        maxAttempts: 30,
        gridWidth: this.config.width,
        gridHeight: this.config.height
      },
      this.config.poiCount,
      [] // No excluded zones yet
    );
  }

  private placePlayerSpawn(): void {
    this.state.phase = GenerationPhase.SPAWN;
    // Place in center or corner, far from edges
    this.state.playerSpawn = {
      x: Math.floor(this.config.width / 2),
      y: Math.floor(this.config.height / 2)
    };
  }

  private placeObstacles(): void {
    this.state.phase = GenerationPhase.OBSTACLES;
    // Use noise-based placement
    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        // Skip POI tiles and spawn area
        if (this.isTileReserved(x, y)) continue;

        const noise = this.rng.perlin(x * 0.05, y * 0.05);
        if (noise > 0.6) {
          const obstacleType = this.selectObstacleType();
          this.state.grid![y][x].obstacle = obstacleType;
          this.state.grid![y][x].isWalkable = false;
        }
      }
    }
  }

  private validate(): void {
    this.state.phase = GenerationPhase.VALIDATION;
    const maxAttempts = 10;

    while (this.state.validationAttempts < maxAttempts) {
      const validation = validateAllPOIsReachable(
        this.state.grid!,
        this.state.playerSpawn!,
        this.state.pois!
      );

      if (validation.reachable) {
        return; // Success!
      }

      // Attempt to fix
      for (const poi of validation.unreachablePOIs) {
        carvePath(this.state.grid!, this.state.playerSpawn!, poi);
      }

      this.state.validationAttempts++;
    }

    throw new Error('Failed validation after maximum attempts');
  }

  private finalize(): Level {
    this.state.phase = GenerationPhase.COMPLETE;

    const pois: POI[] = this.state.pois!.map((pos, i) => ({
      id: i,
      position: pos,
      type: this.assignPOIType(),
      name: this.generatePOIName(i),
      description: this.generatePOIDescription(i),
      discoveryRadius: 2,
      points: this.rng.intBetween(10, 50),
      discovered: false
    }));

    return {
      config: this.config,
      grid: this.state.grid!,
      pois,
      playerSpawn: this.state.playerSpawn!,
      discoveredPOIs: new Set(),
      metadata: {
        generationTime: Date.now(),
        attempts: this.state.validationAttempts,
        seed: this.config.seed,
        version: '1.0.0'
      }
    };
  }

  private isTileReserved(x: number, y: number): boolean {
    // Check if tile is POI or near spawn
    const spawnDistance = Math.abs(x - this.state.playerSpawn!.x) +
                         Math.abs(y - this.state.playerSpawn!.y);
    if (spawnDistance < 3) return true;

    for (const poi of this.state.pois!) {
      if (poi.x === x && poi.y === y) return true;
    }

    return false;
  }

  private selectObstacleType(): ObstacleType {
    const types = [
      { type: ObstacleType.RUIN_COLUMN, weight: 0.2 },
      { type: ObstacleType.RUIN_WALL, weight: 0.2 },
      { type: ObstacleType.TREE_CYPRESS, weight: 0.2 },
      { type: ObstacleType.TREE_OLIVE, weight: 0.15 },
      { type: ObstacleType.ROCK_SMALL, weight: 0.15 },
      { type: ObstacleType.ROCK_LARGE, weight: 0.1 }
    ];

    return this.rng.weightedChoice(types);
  }

  private assignPOIType(): POI['type'] {
    const types: POI['type'][] = [
      'artifact',
      'inscription',
      'mosaic',
      'statue',
      'structure'
    ];
    return types[this.rng.intBetween(0, types.length - 1)];
  }

  private generatePOIName(id: number): string {
    const prefixes = ['Ancient', 'Lost', 'Hidden', 'Forgotten', 'Sacred'];
    const suffixes = ['Altar', 'Column', 'Inscription', 'Mosaic', 'Statue', 'Temple'];
    return `${this.rng.choice(prefixes)} ${this.rng.choice(suffixes)} ${id + 1}`;
  }

  private generatePOIDescription(id: number): string {
    return `A remarkable Roman artifact waiting to be discovered.`;
  }
}
```

### Seeded Random Number Generator

```typescript
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Mulberry32 PRNG
  next(): number {
    let t = (this.seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  intBetween(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  choice<T>(array: T[]): T {
    return array[this.intBetween(0, array.length - 1)];
  }

  weightedChoice<T extends { weight: number }>(items: T[]): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = this.next() * totalWeight;

    for (const item of items) {
      random -= item.weight;
      if (random <= 0) return item;
    }

    return items[0];
  }

  // Simplified Perlin noise (use proper library in production)
  perlin(x: number, y: number): number {
    // Use seed to offset coordinates
    x += this.seed * 0.1;
    y += this.seed * 0.1;

    // Simple noise approximation
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;

    const hash = (a: number, b: number) => {
      let h = this.seed + a * 374761393 + b * 668265263;
      h = (h ^ (h >>> 13)) * 1274126177;
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };

    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);

    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);

    const lerp = (a: number, b: number, t: number) => a + t * (b - a);

    return lerp(lerp(a, b, u), lerp(c, d, u), v) * 2 - 1;
  }
}
```

### Priority Queue for A* (Heap-based)

```typescript
class PriorityQueue<T> {
  private items: T[] = [];
  private compareFn: (a: T, b: T) => number;

  constructor(compareFn: (a: T, b: T) => number) {
    this.compareFn = compareFn;
  }

  push(item: T): void {
    this.items.push(item);
    this.bubbleUp(this.items.length - 1);
  }

  pop(): T | undefined {
    if (this.items.length === 0) return undefined;

    const result = this.items[0];
    const end = this.items.pop()!;

    if (this.items.length > 0) {
      this.items[0] = end;
      this.bubbleDown(0);
    }

    return result;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  private bubbleUp(index: number): void {
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

  private bubbleDown(index: number): void {
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
```

## Summary of Recommendations

1. **Obstacle Placement**: Use Perlin/Simplex noise with threshold-based placement (density ~25-35%) for natural distribution. Validate connectivity and prune obstacles along failed paths.

2. **POI Placement**: Implement Poisson Disc Sampling with minimum spacing of 8-12 tiles between the 15 POIs. This ensures even distribution without clustering.

3. **Pathfinding Validation**: Use flood fill from player spawn for efficient batch validation of all POIs. Fall back to A* for path carving when unreachable POIs are detected.

4. **Collision Detection**: For 40x40px tiles, use tile-coordinate-based collision for snappy grid movement, or AABB collision for smooth pixel-based movement. Convert between pixel and tile coordinates as needed.

5. **Data Structures**: Implement a state-machine-based `LevelGenerator` class with a seeded PRNG for reproducibility. Use typed interfaces for `Tile`, `POI`, `Level`, and `LevelConfig` to maintain type safety.

6. **Performance**: Spatial grid optimization for Poisson sampling, priority queue for A*, and flood fill for connectivity validation ensure O(n) to O(n log n) performance for level generation.

## Next Steps

1. Implement `SeededRandom` class with Mulberry32 PRNG
2. Create `LevelGenerator` with phase-based generation pipeline
3. Integrate Poisson Disc Sampling for POI placement
4. Add A* pathfinding and flood fill validation
5. Implement tile-based collision system
6. Add terrain variation using noise functions
7. Create Roman-themed asset mapping (sprites for obstacles/terrain)
8. Test with various seeds to ensure quality and navigability
