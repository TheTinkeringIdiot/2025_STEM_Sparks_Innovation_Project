# HTML5 Canvas Architecture for 2D Tile-Based Game

## Summary

This document outlines best practices for building a 2D tile-based game using HTML5 Canvas with TypeScript. The architecture uses multi-layer canvas rendering, a fixed 60fps game loop with delta time, efficient input handling, and optimized rendering techniques for a 1440x960 viewport displaying 40x40px tiles. Key patterns include separating rendering layers, culling off-screen tiles, pre-rendering static content, and maintaining frame-rate independent physics.

## Recommended File Structure

```
src/
├── core/
│   ├── Engine.ts                 # Main game engine coordinating all systems
│   ├── GameLoop.ts               # RequestAnimationFrame loop with delta time
│   └── Time.ts                   # Time tracking and frame-rate management
├── rendering/
│   ├── CanvasManager.ts          # Multi-layer canvas setup and management
│   ├── Camera.ts                 # Viewport/camera with scrolling logic
│   ├── Renderer.ts               # Main rendering coordinator
│   ├── TileRenderer.ts           # Tile rendering with culling
│   ├── EntityRenderer.ts         # Entity/sprite rendering
│   └── UIRenderer.ts             # UI overlay rendering
├── input/
│   ├── InputManager.ts           # Centralized input state tracking
│   ├── KeyboardHandler.ts        # Keyboard event handling
│   └── MouseHandler.ts           # Mouse event handling
├── state/
│   ├── GameState.ts              # Overall game state (menu, playing, paused)
│   ├── LevelState.ts             # Current level data and tile map
│   ├── PlayerState.ts            # Player position, inventory, stats
│   └── StateManager.ts           # State transition management
├── entities/
│   ├── Entity.ts                 # Base entity interface
│   ├── Player.ts                 # Player entity implementation
│   └── Artifact.ts               # Artifact entities
├── types/
│   ├── coordinates.types.ts      # World vs screen coordinate types
│   ├── tile.types.ts             # Tile data structures
│   └── input.types.ts            # Input event types
└── main.ts                       # Entry point
```

## Multi-Layer Rendering Pattern

### Layer Architecture

Multiple canvas elements stacked with CSS positioning provide optimal performance by separating static and dynamic content. Only changed layers need repainting.

**Recommended Layers:**
1. **Background Layer**: Static tile map (rarely changes)
2. **Entities Layer**: Player, artifacts, NPCs (updates every frame)
3. **UI Layer**: Health, inventory, messages (updates on state change)
4. **Fog-of-War Overlay**: Visibility mask (updates when player moves)

### Implementation Example

```typescript
// rendering/CanvasManager.ts

interface CanvasLayer {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  zIndex: number;
  needsRedraw: boolean;
}

class CanvasManager {
  private layers: Map<string, CanvasLayer> = new Map();
  private container: HTMLElement;

  constructor(containerId: string, width: number, height: number) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container ${containerId} not found`);
    }
    this.container = container;
    this.container.style.position = 'relative';

    // Create layers in order
    this.createLayer('background', 0, width, height);
    this.createLayer('entities', 1, width, height);
    this.createLayer('ui', 2, width, height);
    this.createLayer('fog', 3, width, height);
  }

  private createLayer(
    name: string,
    zIndex: number,
    width: number,
    height: number
  ): void {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.zIndex = zIndex.toString();

    // Disable image smoothing for pixel-perfect rendering
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error(`Failed to get 2D context for layer ${name}`);
    }
    context.imageSmoothingEnabled = false;

    this.container.appendChild(canvas);

    this.layers.set(name, {
      canvas,
      context,
      zIndex,
      needsRedraw: true
    });
  }

  getLayer(name: string): CanvasLayer {
    const layer = this.layers.get(name);
    if (!layer) {
      throw new Error(`Layer ${name} not found`);
    }
    return layer;
  }

  markDirty(layerName: string): void {
    const layer = this.layers.get(layerName);
    if (!layer) {
      throw new Error(`Layer ${layerName} not found`);
    }
    layer.needsRedraw = true;
  }

  clearLayer(name: string): void {
    const layer = this.getLayer(name);
    layer.context.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
  }
}
```

### Offscreen Canvas for Pre-rendering

Use offscreen canvases to pre-render static or infrequently changing content:

```typescript
// rendering/TileRenderer.ts

class TileRenderer {
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenContext: CanvasRenderingContext2D;
  private tileSize: number = 40;

  constructor(mapWidth: number, mapHeight: number, tileSize: number) {
    this.tileSize = tileSize;

    // Create offscreen canvas for full map
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = mapWidth * tileSize;
    this.offscreenCanvas.height = mapHeight * tileSize;

    const context = this.offscreenCanvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to create offscreen canvas context');
    }
    context.imageSmoothingEnabled = false;
    this.offscreenContext = context;
  }

  // Pre-render entire map once
  prerenderMap(tileMap: TileData[][], tileImages: Map<number, HTMLImageElement>): void {
    for (let y = 0; y < tileMap.length; y++) {
      for (let x = 0; x < tileMap[y].length; x++) {
        const tile = tileMap[y][x];
        const image = tileImages.get(tile.id);
        if (!image) {
          throw new Error(`Tile image ${tile.id} not found`);
        }

        this.offscreenContext.drawImage(
          image,
          x * this.tileSize,
          y * this.tileSize,
          this.tileSize,
          this.tileSize
        );
      }
    }
  }

  // Render only visible portion to main canvas
  renderVisible(
    targetContext: CanvasRenderingContext2D,
    camera: { x: number; y: number; width: number; height: number }
  ): void {
    targetContext.drawImage(
      this.offscreenCanvas,
      camera.x,
      camera.y,
      camera.width,
      camera.height,
      0,
      0,
      camera.width,
      camera.height
    );
  }
}
```

## Game Loop Architecture

### Fixed 60fps Loop with Delta Time

The game loop must handle variable refresh rates while maintaining consistent physics at 60fps:

```typescript
// core/GameLoop.ts

type UpdateCallback = (deltaTime: number) => void;
type RenderCallback = () => void;

class GameLoop {
  private targetFPS: number = 60;
  private frameInterval: number;
  private lastFrameTime: number = 0;
  private animationFrameId: number = 0;
  private isRunning: boolean = false;

  private updateCallback: UpdateCallback;
  private renderCallback: RenderCallback;

  constructor(updateCallback: UpdateCallback, renderCallback: RenderCallback) {
    this.frameInterval = 1000 / this.targetFPS; // 16.67ms for 60fps
    this.updateCallback = updateCallback;
    this.renderCallback = renderCallback;
  }

  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.loop(this.lastFrameTime);
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private loop = (currentTime: number): void => {
    if (!this.isRunning) {
      return;
    }

    // Request next frame early for browser optimization
    this.animationFrameId = requestAnimationFrame(this.loop);

    // Calculate time since last frame
    const deltaTime = currentTime - this.lastFrameTime;

    // Cap physics updates at target FPS
    if (deltaTime >= this.frameInterval) {
      // Account for frame interval excess to maintain accuracy
      this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);

      // Convert to seconds for easier calculations
      const deltaSeconds = deltaTime / 1000;

      // Update game logic (capped at 60fps)
      this.updateCallback(deltaSeconds);
    }

    // Always render at display refresh rate
    this.renderCallback();
  }
}
```

### Time-Independent Movement

All movement must use delta time for frame-rate independence:

```typescript
// entities/Player.ts

interface Position {
  x: number;
  y: number;
}

class Player {
  private position: Position;
  private velocity: Position = { x: 0, y: 0 };
  private speed: number = 200; // pixels per second

  constructor(startX: number, startY: number) {
    this.position = { x: startX, y: startY };
  }

  update(deltaTime: number, input: InputState): void {
    // Reset velocity
    this.velocity.x = 0;
    this.velocity.y = 0;

    // Calculate velocity based on input
    if (input.keys.up || input.keys.w) {
      this.velocity.y = -1;
    }
    if (input.keys.down || input.keys.s) {
      this.velocity.y = 1;
    }
    if (input.keys.left || input.keys.a) {
      this.velocity.x = -1;
    }
    if (input.keys.right || input.keys.d) {
      this.velocity.x = 1;
    }

    // Normalize diagonal movement
    if (this.velocity.x !== 0 && this.velocity.y !== 0) {
      const magnitude = Math.sqrt(
        this.velocity.x * this.velocity.x +
        this.velocity.y * this.velocity.y
      );
      this.velocity.x /= magnitude;
      this.velocity.y /= magnitude;
    }

    // Apply time-independent movement
    this.position.x += this.velocity.x * this.speed * deltaTime;
    this.position.y += this.velocity.y * this.speed * deltaTime;
  }

  getPosition(): Position {
    return { ...this.position };
  }
}
```

## Input Handling Pattern

### Centralized Input State

Track all input as state rather than handling events inline:

```typescript
// types/input.types.ts

interface KeyState {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
}

interface MouseState {
  x: number;
  y: number;
  leftButton: boolean;
  rightButton: boolean;
}

interface InputState {
  keys: KeyState;
  mouse: MouseState;
}
```

```typescript
// input/InputManager.ts

class InputManager {
  private state: InputState = {
    keys: {
      w: false,
      a: false,
      s: false,
      d: false,
      up: false,
      down: false,
      left: false,
      right: false,
      space: false
    },
    mouse: {
      x: 0,
      y: 0,
      leftButton: false,
      rightButton: false
    }
  };

  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.attachListeners();
  }

  private attachListeners(): void {
    // Keyboard events on window
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Mouse events on canvas
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);

    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();

    switch (key) {
      case 'w':
        this.state.keys.w = true;
        break;
      case 'a':
        this.state.keys.a = true;
        break;
      case 's':
        this.state.keys.s = true;
        break;
      case 'd':
        this.state.keys.d = true;
        break;
      case 'arrowup':
        this.state.keys.up = true;
        event.preventDefault(); // Prevent page scroll
        break;
      case 'arrowdown':
        this.state.keys.down = true;
        event.preventDefault();
        break;
      case 'arrowleft':
        this.state.keys.left = true;
        event.preventDefault();
        break;
      case 'arrowright':
        this.state.keys.right = true;
        event.preventDefault();
        break;
      case ' ':
        this.state.keys.space = true;
        event.preventDefault();
        break;
    }
  }

  private handleKeyUp = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();

    switch (key) {
      case 'w':
        this.state.keys.w = false;
        break;
      case 'a':
        this.state.keys.a = false;
        break;
      case 's':
        this.state.keys.s = false;
        break;
      case 'd':
        this.state.keys.d = false;
        break;
      case 'arrowup':
        this.state.keys.up = false;
        break;
      case 'arrowdown':
        this.state.keys.down = false;
        break;
      case 'arrowleft':
        this.state.keys.left = false;
        break;
      case 'arrowright':
        this.state.keys.right = false;
        break;
      case ' ':
        this.state.keys.space = false;
        break;
    }
  }

  private handleMouseDown = (event: MouseEvent): void => {
    if (event.button === 0) {
      this.state.mouse.leftButton = true;
    } else if (event.button === 2) {
      this.state.mouse.rightButton = true;
    }
  }

  private handleMouseUp = (event: MouseEvent): void => {
    if (event.button === 0) {
      this.state.mouse.leftButton = false;
    } else if (event.button === 2) {
      this.state.mouse.rightButton = false;
    }
  }

  private handleMouseMove = (event: MouseEvent): void => {
    // Convert to canvas coordinates
    const rect = this.canvas.getBoundingClientRect();
    this.state.mouse.x = event.clientX - rect.left;
    this.state.mouse.y = event.clientY - rect.top;
  }

  getState(): InputState {
    // Return a copy to prevent external mutation
    return {
      keys: { ...this.state.keys },
      mouse: { ...this.state.mouse }
    };
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
  }
}
```

## State Management Pattern

### State Pattern for Game Screens

Use the State pattern for managing different game screens (menu, playing, paused):

```typescript
// state/GameState.ts

enum GameStateType {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

interface GameStateHandler {
  enter(): void;
  exit(): void;
  update(deltaTime: number, input: InputState): void;
  render(canvasManager: CanvasManager): void;
}

class StateManager {
  private currentState: GameStateHandler | null = null;
  private states: Map<GameStateType, GameStateHandler> = new Map();

  registerState(type: GameStateType, state: GameStateHandler): void {
    this.states.set(type, state);
  }

  transition(type: GameStateType): void {
    const newState = this.states.get(type);
    if (!newState) {
      throw new Error(`State ${type} not registered`);
    }

    if (this.currentState) {
      this.currentState.exit();
    }

    this.currentState = newState;
    this.currentState.enter();
  }

  update(deltaTime: number, input: InputState): void {
    if (!this.currentState) {
      throw new Error('No active game state');
    }
    this.currentState.update(deltaTime, input);
  }

  render(canvasManager: CanvasManager): void {
    if (!this.currentState) {
      throw new Error('No active game state');
    }
    this.currentState.render(canvasManager);
  }
}
```

### Typed Game Data State

Separate data state from behavior state:

```typescript
// state/LevelState.ts

interface TileData {
  id: number;
  walkable: boolean;
  discovered: boolean;
}

interface LevelState {
  width: number;
  height: number;
  tiles: TileData[][];
  artifacts: Array<{ x: number; y: number; type: string }>;
}

class LevelStateManager {
  private state: LevelState;

  constructor(width: number, height: number) {
    this.state = {
      width,
      height,
      tiles: this.initializeTiles(width, height),
      artifacts: []
    };
  }

  private initializeTiles(width: number, height: number): TileData[][] {
    const tiles: TileData[][] = [];

    for (let y = 0; y < height; y++) {
      tiles[y] = [];
      for (let x = 0; x < width; x++) {
        tiles[y][x] = {
          id: 0,
          walkable: true,
          discovered: false
        };
      }
    }

    return tiles;
  }

  getTile(x: number, y: number): TileData {
    if (x < 0 || x >= this.state.width || y < 0 || y >= this.state.height) {
      throw new Error(`Tile coordinates out of bounds: (${x}, ${y})`);
    }
    return this.state.tiles[y][x];
  }

  setTileDiscovered(x: number, y: number): void {
    const tile = this.getTile(x, y);
    tile.discovered = true;
  }

  getState(): Readonly<LevelState> {
    return this.state;
  }
}
```

```typescript
// state/PlayerState.ts

interface PlayerData {
  position: { x: number; y: number };
  health: number;
  maxHealth: number;
  inventory: string[];
  discoveredArtifacts: number;
}

class PlayerStateManager {
  private state: PlayerData;

  constructor(startX: number, startY: number) {
    this.state = {
      position: { x: startX, y: startY },
      health: 100,
      maxHealth: 100,
      inventory: [],
      discoveredArtifacts: 0
    };
  }

  updatePosition(x: number, y: number): void {
    this.state.position.x = x;
    this.state.position.y = y;
  }

  takeDamage(amount: number): void {
    this.state.health = Math.max(0, this.state.health - amount);
  }

  heal(amount: number): void {
    this.state.health = Math.min(this.state.maxHealth, this.state.health + amount);
  }

  addToInventory(item: string): void {
    this.state.inventory.push(item);
  }

  discoverArtifact(): void {
    this.state.discoveredArtifacts++;
  }

  getState(): Readonly<PlayerData> {
    return {
      ...this.state,
      position: { ...this.state.position },
      inventory: [...this.state.inventory]
    };
  }
}
```

## Camera and Coordinate Systems

### World vs Screen Coordinates

Separate world coordinates (absolute tile positions) from screen coordinates (viewport pixels):

```typescript
// types/coordinates.types.ts

interface WorldCoordinates {
  x: number;
  y: number;
}

interface ScreenCoordinates {
  x: number;
  y: number;
}

interface TileCoordinates {
  col: number;
  row: number;
}
```

```typescript
// rendering/Camera.ts

class Camera {
  private worldX: number = 0;
  private worldY: number = 0;
  private viewportWidth: number;
  private viewportHeight: number;
  private worldWidth: number;
  private worldHeight: number;
  private tileSize: number;

  constructor(
    viewportWidth: number,
    viewportHeight: number,
    worldWidth: number,
    worldHeight: number,
    tileSize: number
  ) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.worldWidth = worldWidth * tileSize;
    this.worldHeight = worldHeight * tileSize;
    this.tileSize = tileSize;
  }

  // Center camera on a world position
  centerOn(worldX: number, worldY: number): void {
    this.worldX = worldX - this.viewportWidth / 2;
    this.worldY = worldY - this.viewportHeight / 2;

    // Clamp to world bounds
    this.clampToWorld();
  }

  private clampToWorld(): void {
    this.worldX = Math.max(0, Math.min(
      this.worldWidth - this.viewportWidth,
      this.worldX
    ));
    this.worldY = Math.max(0, Math.min(
      this.worldHeight - this.viewportHeight,
      this.worldY
    ));

    // Round to avoid sub-pixel rendering artifacts
    this.worldX = Math.round(this.worldX);
    this.worldY = Math.round(this.worldY);
  }

  // Convert world coordinates to screen coordinates
  worldToScreen(worldPos: WorldCoordinates): ScreenCoordinates {
    return {
      x: worldPos.x - this.worldX,
      y: worldPos.y - this.worldY
    };
  }

  // Convert screen coordinates to world coordinates
  screenToWorld(screenPos: ScreenCoordinates): WorldCoordinates {
    return {
      x: screenPos.x + this.worldX,
      y: screenPos.y + this.worldY
    };
  }

  // Get visible tile range for culling
  getVisibleTileRange(): {
    startCol: number;
    endCol: number;
    startRow: number;
    endRow: number;
  } {
    return {
      startCol: Math.floor(this.worldX / this.tileSize),
      endCol: Math.ceil((this.worldX + this.viewportWidth) / this.tileSize),
      startRow: Math.floor(this.worldY / this.tileSize),
      endRow: Math.ceil((this.worldY + this.viewportHeight) / this.tileSize)
    };
  }

  getPosition(): { x: number; y: number } {
    return { x: this.worldX, y: this.worldY };
  }
}
```

## Performance Optimization

### Tile Culling

Only render tiles visible in the viewport:

```typescript
// rendering/TileRenderer.ts (extended)

class OptimizedTileRenderer {
  private tileSize: number = 40;
  private tileImages: Map<number, HTMLImageElement>;

  constructor(tileImages: Map<number, HTMLImageElement>) {
    this.tileImages = tileImages;
  }

  render(
    context: CanvasRenderingContext2D,
    levelState: LevelState,
    camera: Camera
  ): void {
    const visibleRange = camera.getVisibleTileRange();
    const cameraPos = camera.getPosition();

    // Only iterate through visible tiles
    for (let row = visibleRange.startRow; row < visibleRange.endRow; row++) {
      if (row < 0 || row >= levelState.height) continue;

      for (let col = visibleRange.startCol; col < visibleRange.endCol; col++) {
        if (col < 0 || col >= levelState.width) continue;

        const tile = levelState.tiles[row][col];
        if (!tile.discovered) continue; // Skip undiscovered tiles

        const worldX = col * this.tileSize;
        const worldY = row * this.tileSize;

        // Convert to screen coordinates
        const screenX = worldX - cameraPos.x;
        const screenY = worldY - cameraPos.y;

        const image = this.tileImages.get(tile.id);
        if (!image) {
          throw new Error(`Tile image ${tile.id} not found`);
        }

        context.drawImage(
          image,
          screenX,
          screenY,
          this.tileSize,
          this.tileSize
        );
      }
    }
  }
}
```

### Canvas Optimization Checklist

1. **Disable Image Smoothing** for pixel-perfect rendering:
   ```typescript
   context.imageSmoothingEnabled = false;
   ```

2. **Use Sprite Sheets** instead of individual images:
   ```typescript
   // Draw from sprite sheet
   context.drawImage(
     spriteSheet,
     sourceX, sourceY, sourceWidth, sourceHeight, // source
     destX, destY, destWidth, destHeight // destination
   );
   ```

3. **Batch Similar Draw Calls** to minimize state changes

4. **Pre-render Static Content** to offscreen canvases

5. **Layer Management** - separate static and dynamic content:
   - Background layer: Redraw only on level load or camera movement
   - Entities layer: Clear and redraw every frame
   - UI layer: Update only on state changes
   - Fog layer: Update only when visibility changes

6. **Dirty Rectangle Tracking** for selective redraws:
   ```typescript
   // Only clear and redraw changed regions
   context.clearRect(dirtyX, dirtyY, dirtyWidth, dirtyHeight);
   ```

7. **Round Coordinates** to avoid sub-pixel rendering:
   ```typescript
   x = Math.round(x);
   y = Math.round(y);
   ```

### Performance Metrics

For a 1440x960 viewport with 40x40px tiles:
- Viewport displays: 36 tiles wide × 24 tiles high = 864 visible tiles
- With culling, you render ~900 tiles per frame (instead of full map)
- At 60fps with multi-layer: ~54,000 tile draws per second (easily achievable)
- Target: Keep frame time under 16ms for consistent 60fps

### Memory Optimization

```typescript
// Use typed arrays for large tile maps
class EfficientTileMap {
  private tiles: Uint16Array; // Supports tile IDs 0-65535
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.tiles = new Uint16Array(width * height);
  }

  getTile(x: number, y: number): number {
    return this.tiles[y * this.width + x];
  }

  setTile(x: number, y: number, tileId: number): void {
    this.tiles[y * this.width + x] = tileId;
  }
}
```

## Main Engine Integration

```typescript
// core/Engine.ts

class Engine {
  private canvasManager: CanvasManager;
  private gameLoop: GameLoop;
  private inputManager: InputManager;
  private stateManager: StateManager;
  private camera: Camera;

  constructor(containerId: string) {
    // Initialize canvas system
    this.canvasManager = new CanvasManager(containerId, 1440, 960);

    // Initialize input
    const entitiesLayer = this.canvasManager.getLayer('entities');
    this.inputManager = new InputManager(entitiesLayer.canvas);

    // Initialize camera
    this.camera = new Camera(1440, 960, 100, 100, 40); // 100x100 tile world

    // Initialize state management
    this.stateManager = new StateManager();

    // Initialize game loop
    this.gameLoop = new GameLoop(
      this.update.bind(this),
      this.render.bind(this)
    );
  }

  private update = (deltaTime: number): void => {
    const input = this.inputManager.getState();
    this.stateManager.update(deltaTime, input);
  }

  private render = (): void => {
    this.stateManager.render(this.canvasManager);
  }

  start(): void {
    this.gameLoop.start();
  }

  stop(): void {
    this.gameLoop.stop();
    this.inputManager.destroy();
  }
}

// main.ts entry point
const engine = new Engine('game-container');
engine.start();
```

## Considerations

- **Canvas Focus**: Canvas elements don't receive keyboard focus by default. Attach keyboard listeners to `window` instead of canvas, or set `tabindex` on canvas and call `canvas.focus()`

- **High Refresh Rate Displays**: Without delta time capping, games run at double speed on 120Hz displays. Always separate physics updates (capped) from rendering (uncapped)

- **Sub-pixel Rendering**: Floating-point coordinates cause blurry sprites. Always round camera and entity positions to integers for pixel-perfect rendering

- **Memory with Large Maps**: A 1000×1000 tile map with object-per-tile uses significant memory. Use typed arrays (`Uint16Array`) for large maps to reduce memory footprint by 80%

- **Mouse Coordinate Conversion**: Mouse events provide client coordinates, not canvas coordinates. Always subtract `canvas.offsetLeft` and `canvas.offsetTop` or use `getBoundingClientRect()`

- **Context State Management**: Canvas context maintains state (fillStyle, strokeStyle, transforms). Always reset or use `save()`/`restore()` when switching between rendering systems

- **Image Loading**: Images load asynchronously. Never start the game loop before all assets are loaded or you'll render blank tiles

- **Prevention of Page Scrolling**: Arrow keys scroll the page by default. Call `event.preventDefault()` in keyboard handlers to prevent this

## Next Steps

1. **Asset Pipeline**: Create a resource loader for tile images and sprite sheets with loading progress tracking

2. **Collision System**: Implement tile-based collision detection using the level state's `walkable` property

3. **Fog of War**: Implement visibility calculation based on player position and render to fog layer using radial gradient or tile-based approach

4. **UI Rendering**: Build UI components (health bar, inventory) that render to the UI layer with dirty checking

5. **Save/Load System**: Implement serialization for game state, level state, and player state

6. **Performance Profiling**: Use browser DevTools Performance tab to identify bottlenecks and ensure consistent 60fps

7. **Entity System**: Extend entity base class with component pattern for artifacts, obstacles, and NPCs

8. **Audio System**: Add audio manager for background music and sound effects triggered by game events
