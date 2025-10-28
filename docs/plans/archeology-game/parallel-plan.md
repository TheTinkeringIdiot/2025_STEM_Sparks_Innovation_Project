# Archeology Game - Parallel Implementation Plan

This browser-based Roman archeology game requires building a vanilla JavaScript HTML5 Canvas game with procedural generation, fog-of-war, sprite animation, and save/load functionality. The architecture uses multi-layer canvas rendering, seeded random generation, and tile-based collision detection for 40x40px tiles in a 1440x960px viewport (displaying 36×24 tiles of a 72×48 tile world). No build process - runs directly from file:// protocol.

## Critically Relevant Files and Documentation

**Core Game Files (To Be Created)**
- `/index.html` - Entry point with canvas container
- `/game.js` - Core game loop, state management, input handling
- `/renderer.js` - Multi-layer canvas management, camera system
- `/levelGenerator.js` - Procedural terrain and POI generation
- `/fogOfWar.js` - Visibility tracking with circular reveal
- `/animator.js` - Sprite sheet animation state machine
- `/styles.css` - UI styling for HUD, minimap, modal screens

**Documentation References**
- `/docs/plans/archeology-game/shared.md` - Architecture patterns and technical constraints
- `/docs/plans/archeology-game/requirements.md` - Game mechanics, artifacts, tool mapping, success criteria
- `/docs/plans/archeology-game/canvas-architecture.docs.md` - Multi-layer rendering, game loop, input handling, camera system
- `/docs/plans/archeology-game/procedural-generation.docs.md` - Level generation algorithms, POI placement, pathfinding validation
- `/docs/plans/archeology-game/fog-of-war.docs.md` - Visibility tracking, circular reveal, minimap integration
- `/docs/plans/archeology-game/sprite-animation.docs.md` - Animation state machine, sprite sheets, visual effects

## Implementation Plan

### Phase 1: Foundation

#### Task 1.1: HTML Entry Point and Canvas Setup [Depends on: none]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/shared.md` - Lines 6-14 (file structure)
- `/docs/plans/archeology-game/canvas-architecture.docs.md` - Lines 56-136 (multi-layer canvas)
- `/docs/plans/archeology-game/canvas-architecture.docs.md` - Lines 893-897 (image smoothing config)

**Instructions**

Files to Create:
- `/index.html`
- `/styles.css`

Create HTML document with:
- Canvas container div (1440x960px viewport)
- Four stacked canvas layers with CSS absolute positioning and proper z-index:
  - background (z-index: 0)
  - entities (z-index: 1)
  - fog (z-index: 2)
  - ui (z-index: 3)
- Script tags linking to game modules (game.js, renderer.js, levelGenerator.js, fogOfWar.js, animator.js)
- HUD elements (money display, tool inventory bar, minimap container)

CSS must:
- Set `image-rendering: pixelated` on all canvas elements
- Configure canvas container with `position: relative`
- Style HUD overlay elements (top-left money, bottom-center tool bar, bottom-right minimap)

**Gotchas**: Disable image smoothing in canvas context (`imageSmoothingEnabled = false`), not just CSS. Canvas elements must have explicit width/height attributes, not just CSS dimensions. Z-index order critical: UI must render above fog.

---

#### Task 1.2: Core Game State Structure [Depends on: none]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/shared.md` - Lines 40-47 (game state structure)
- `/docs/plans/archeology-game/requirements.md` - Lines 102-121 (state management example)
- `/docs/plans/archeology-game/requirements.md` - Lines 186-212 (artifact and tool data)

**Instructions**

Files to Create:
- `/gameState.js`

Implement game state data structure with:
- Player state: position {x, y}, money (starting $100), inventory array, currentTool, direction
- Level state: island ('roman'), number (1-10), pois array, revealedTiles Set, obstacles array
- Museum state: collection array (artifact IDs)

Define artifact catalog (10 valuable @ $100 each, 5 junk @ $0-10) with tool-to-artifact mappings:
- Shovel: Amphora, Oil Lamp, Votive Statue
- Pickaxe: Mosaic Tile, Fresco Fragment
- Brush: Denarius Coin, Signet Ring, Fibula
- Hammer & Chisel: Strigil, Gladius Pommel

Include localStorage save/load functions with key `archeology_game_save`.

**Gotchas**: Tool unlocks are level-based (L1=shovel, L2=pickaxe, L3=brush, L4=hammer&chisel). Stadia rod and magnifying glass always available from start.

---

#### Task 1.3: Input Management System [Depends on: none]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/canvas-architecture.docs.md` - Lines 343-534 (input handling pattern)
- `/docs/plans/archeology-game/requirements.md` - Lines 95-98 (control scheme)

**Instructions**

Files to Create:
- `/inputManager.js`

Implement centralized input state tracking:
- Keyboard state: WASD + arrow keys for movement, spacebar for tool activation
- Mouse state: x, y coordinates, left button (for tool selection in inventory bar)
- Event listeners on window (keyboard) and canvas (mouse)
- `preventDefault()` on arrow keys to prevent page scrolling
- Context menu disabled on canvas (right-click)
- Return immutable state snapshot via `getState()`

**Gotchas**: Attach keyboard listeners to `window`, not canvas (canvas doesn't receive focus by default). Mouse coordinates must be converted from client to canvas coordinates using `getBoundingClientRect()`.

---

### Phase 2: Rendering Pipeline

#### Task 2.1: Multi-Layer Canvas Manager [Depends on: 1.1]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/canvas-architecture.docs.md` - Lines 42-136 (multi-layer architecture)
- `/docs/plans/archeology-game/shared.md` - Lines 18 (multi-layer pattern reference)

**Instructions**

Files to Create:
- `/canvasManager.js`

Implement CanvasManager class:
- Create and manage four canvas layers:
  - background (z-index: 0)
  - entities (z-index: 1)
  - fog (z-index: 2)
  - ui (z-index: 3)
- Each layer has: canvas element, 2D context, needsRedraw flag
- `getLayer(name)` retrieves layer by name
- `markDirty(layerName)` sets needsRedraw flag
- `clearLayer(name)` clears entire layer
- Disable image smoothing on all contexts

**Gotchas**: Create canvas elements programmatically and append to container. Background layer only redraws on level load. Entities layer clears/redraws every frame. Fog and UI layers update on state changes only. Z-index order ensures UI renders above fog overlay.

---

#### Task 2.2: Camera System [Depends on: 1.1]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/canvas-architecture.docs.md` - Lines 719-829 (camera and coordinates)
- `/docs/plans/archeology-game/shared.md` - Lines 38 (tile size: 40x40px, viewport: 1440x960px)

**Instructions**

Files to Create:
- `/camera.js`

Implement Camera class:
- Viewport: 1440x960px (displays 36×24 tiles)
- World size: 72×48 tiles (2880×1920 pixels with 40px tiles)
- World coordinates tracking (worldX, worldY)
- `centerOn(worldX, worldY)` centers camera on position
- `clampToWorld()` prevents camera from showing out-of-bounds area (world is 72×48 tiles)
- `worldToScreen()` and `screenToWorld()` coordinate conversions
- `getVisibleTileRange()` returns startCol, endCol, startRow, endRow for viewport culling
- Round all coordinates to integers to avoid sub-pixel rendering

**Gotchas**: Clamp camera to world bounds (72×48 tiles, 2880×1920 pixels). Always round camera position to whole pixels for performance. Viewport shows 36×24 tiles at once, allowing camera to scroll across larger world.

---

#### Task 2.3: Tile Renderer with Viewport Culling [Depends on: 2.1, 2.2]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/canvas-architecture.docs.md` - Lines 837-889 (tile culling)
- `/docs/plans/archeology-game/canvas-architecture.docs.md` - Lines 139-206 (offscreen canvas pre-rendering)
- `/docs/plans/archeology-game/procedural-generation.docs.md` - Lines 698-730 (tile data structures)

**Instructions**

Files to Modify:
- `/renderer.js` (create new file)

Implement tile rendering:
- Use offscreen canvas for pre-rendering entire map once per level load
- Main render loop: `drawImage()` from offscreen canvas to background layer showing only visible viewport
- Viewport culling: Only iterate tiles within camera's visible range (calculate from camera.getVisibleTileRange())
- Tile types: ground, grass, dirt, stone, sand (procedurally assigned, different visual sprites)
- Obstacles rendered with tile grid (ruins, trees, rocks)

**Gotchas**: Pre-render entire map to offscreen canvas on level generation. Don't redraw tiles every frame - composite from cached offscreen canvas. Use camera.worldToScreen() for positioning.

---

### Phase 3: Procedural Generation

#### Task 3.1: Seeded Random Number Generator [Depends on: none]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/procedural-generation.docs.md` - Lines 1010-1079 (Mulberry32 PRNG)
- `/docs/plans/archeology-game/shared.md` - Lines 22 (seeded procedural generation pattern)

**Instructions**

Files to Create:
- `/seededRandom.js`

Implement SeededRandom class with Mulberry32 algorithm:
- Constructor takes seed number
- `next()` returns float 0.0-1.0
- `intBetween(min, max)` returns random integer in range
- `choice(array)` returns random element
- `weightedChoice(items)` selects based on weight property
- `perlin(x, y)` simplified noise function using seed offset

**Gotchas**: Mulberry32 is deterministic - same seed always produces same sequence. Critical for reproducible level generation. Don't use Math.random() anywhere in level generation.

---

#### Task 3.2: Poisson Disc Sampling for POI Placement [Depends on: 3.1]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/procedural-generation.docs.md` - Lines 127-235 (Poisson disc algorithm)
- `/docs/plans/archeology-game/shared.md` - Lines 49 (POI requirements: 15 POIs, 8-12 tile spacing)

**Instructions**

Files to Create:
- `/poissonDisc.js`

Implement Poisson Disc Sampling:
- Config: minDistance (8-12 tiles), maxAttempts (30), grid dimensions
- Use spatial grid for O(1) neighbor lookup (cell size = minDistance / √2)
- Generate exactly 15 POI positions with guaranteed minimum spacing
- Exclude zones: player spawn area (3 tile radius)
- Return array of {x, y} tile coordinates

**Gotchas**: Use seeded RNG, not Math.random(). Pre-calculate spatial grid cell size. Check 5x5 neighborhood for nearby points. If fewer than 15 POIs generated after all attempts, throw error (don't silently return fewer).

---

#### Task 3.3: Level Generator Core [Depends on: 3.1, 3.2]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/procedural-generation.docs.md` - Lines 772-1007 (level generation state machine)
- `/docs/plans/archeology-game/shared.md` - Lines 22 (procedural generation pattern with validation)

**Instructions**

Files to Modify:
- `/levelGenerator.js` (create new file)

Implement LevelGenerator class with phase-based generation:
1. INIT: Create grid (72×48 tiles, all walkable - 2880×1920 pixels at 40px/tile)
2. TERRAIN: Use Perlin noise to assign tile types (stone, dirt, grass, sand)
3. POIS: Use Poisson disc sampling to place 15 POIs with 8-12 tile spacing
4. SPAWN: Place player at center of map (36, 24 tile coordinates)
5. OBSTACLES: Use noise-based placement (threshold > 0.6) for ruins/trees/rocks
6. VALIDATION: Flood fill from spawn, verify all POIs reachable
7. FINALIZATION: Assign POI types/artifacts, return complete Level object

Obstacle types (Roman theme): ruin_column (20%), ruin_wall (20%), tree_cypress (20%), tree_olive (15%), rock_small (15%), rock_large (10%).

**Gotchas**: Map size is 72×48 tiles (2× viewport size) to accommodate 15 POIs with 8-12 tile spacing. Skip obstacle placement on POI tiles and spawn area (3 tile radius). If validation fails, carve paths by removing obstacles along A* path to unreachable POIs. Max 10 validation attempts before throwing error.

---

#### Task 3.4: Pathfinding and Connectivity Validation [Depends on: 3.3]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/procedural-generation.docs.md` - Lines 293-492 (A* and flood fill)
- `/docs/plans/archeology-game/procedural-generation.docs.md` - Lines 1080-1165 (priority queue)

**Instructions**

Files to Create:
- `/pathfinding.js`

Implement:
1. Flood fill algorithm: BFS from spawn point, returns Set of reachable tile keys
2. Validation function: Check all 15 POIs exist in reachable set
3. A* pathfinding: For carving paths to unreachable POIs (ignoring obstacles)
4. Priority queue: Min-heap for A* open set

Path carving: Use A* to find ideal path, remove 40-50% of obstacles along path randomly.

**Gotchas**: Flood fill is cheaper than 15× A* searches. Use Manhattan distance heuristic for A*. Convert tile coords to string keys "x,y" for Set storage. Only carve paths if validation fails.

---

### Phase 4: Fog-of-War System

#### Task 4.1: Fog-of-War Data Structure [Depends on: none]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/fog-of-war.docs.md` - Lines 8-53 (fog data structure)
- `/docs/plans/archeology-game/shared.md` - Lines 24 (fog-of-war pattern with Uint8Array)

**Instructions**

Files to Create:
- `/fogOfWar.js`

Implement FogOfWar class:
- Three-state system: UNEXPLORED (0), EXPLORED (1), VISIBLE (2)
- Use Uint8Array for fog data (length = mapWidth × mapHeight)
- Index tiles as `y * width + x`
- Pre-calculate visibility circle offsets at initialization (200px radius, ~16 tiles)
- Track dirty region (minX, minY, maxX, maxY) for optimized rendering

**Gotchas**: Use typed array (Uint8Array) for memory efficiency. Pre-calculate circle offsets once - don't recalculate per frame. 200px radius ≈ 5 tiles (200 / 40 = 5).

---

#### Task 4.2: Fog Update and Circular Reveal [Depends on: 4.1]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/fog-of-war.docs.md` - Lines 56-137 (circular reveal algorithm)
- `/docs/plans/archeology-game/shared.md` - Lines 12 (200px reveal radius)

**Instructions**

Files to Modify:
- `/fogOfWar.js`

Implement fog update logic:
- On player movement: Convert pixel position to tile coordinates
- First pass: Change all VISIBLE tiles to EXPLORED
- Second pass: Apply pre-calculated visibility offsets to mark tiles VISIBLE
- Track dirty region (min/max bounds of affected tiles)
- Throttle updates: Only update if player moved >16 pixels since last update

**Gotchas**: Two-pass update required (mark all as explored, then reveal circle). Use pre-calculated offsets array for circle. Round player position to tile coords with Math.floor(). Bounds-check all tiles before marking.

---

#### Task 4.3: Fog Renderer [Depends on: 4.1, 4.2, 2.1, 2.2]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/fog-of-war.docs.md` - Lines 140-264 (fog rendering)
- `/docs/plans/archeology-game/fog-of-war.docs.md` - Lines 286-404 (optimization techniques)

**Instructions**

Files to Create:
- `/fogRenderer.js`

Implement fog rendering:
- Render to fog layer (z-index: 2) only when fog state changes
- Use dirty rectangle optimization: only redraw changed region
- UNEXPLORED tiles: `rgba(0, 0, 0, 0.9)` nearly opaque black
- EXPLORED tiles: `rgba(0, 0, 0, 0.4)` semi-transparent gray
- VISIBLE tiles: no fog drawn (fully transparent)
- Batch draw calls by state to minimize fillStyle changes
- Viewport culling: only render fog tiles within camera view (36×24 of 72×48 total tiles)

**Gotchas**: Fog layer renders below UI layer (z=2 < z=3) so HUD remains visible. Fog layer doesn't clear/redraw every frame - only when dirty. Use camera coordinates for positioning. Group tiles by fog state before drawing to reduce context state changes.

---

#### Task 4.4: Minimap with Fog Integration [Depends on: 4.1, 4.2]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/fog-of-war.docs.md` - Lines 413-540 (minimap rendering)
- `/docs/plans/archeology-game/requirements.md` - Lines 176 (minimap: 150x100px)

**Instructions**

Files to Create:
- `/minimap.js`

Implement minimap rendering:
- Offscreen canvas 150x100px (downsampled from full map)
- Use ImageData API for pixel-level fog rendering (faster than fillRect per tile)
- Scale: Calculate from map size to fit 150x100px
- Update throttled: 500ms interval, not every frame
- Render fog states: UNEXPLORED (black 90%), EXPLORED (black 30%), VISIBLE (transparent)
- Show player position (small colored dot) and POI markers (if revealed)

**Gotchas**: Use ImageData putPixel for performance with large maps. Update less frequently than main fog (throttle to 500ms). Cache minimap between updates. Scale must maintain aspect ratio.

---

### Phase 5: Animation System

#### Task 5.1: Sprite Sheet Generation [Depends on: none]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/sprite-animation.docs.md` - Lines 9-106 (sprite structure)
- `/docs/plans/archeology-game/requirements.md` - Lines 75-78 (character sprite: 40x40px)

**Instructions**

Files to Create:
- `/spriteGenerator.js`

Generate procedural sprite sheet (200x240px):
- Layout: 5 columns × 6 rows, 40x40px per frame
- Row 0: UP (idle + 4 walk frames)
- Row 1: DOWN (idle + 4 walk frames)
- Row 2: LEFT (idle + 4 walk frames)
- Row 3: RIGHT (idle + 4 walk frames)
- Row 4: Tool animations (dig 3 frames, pickaxe 2 frames)
- Row 5: Tool animations (brush 2 frames, chisel 2 frames)

Use symmetry-based generation: create half-sprite, mirror horizontally. Apply color palette (3-5 colors), add black outline.

**Gotchas**: Character body should be 8-10px within 40x40px frame (rest is padding). Walk cycle: 4 frames is standard. Save to canvas/ImageData, not external file.

---

#### Task 5.2: Animation State Machine [Depends on: 5.1]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/sprite-animation.docs.md` - Lines 119-199 (animation controller)
- `/docs/plans/archeology-game/sprite-animation.docs.md` - Lines 239-277 (frame-rate independence)

**Instructions**

Files to Create:
- `/animator.js`

Implement CharacterAnimator class:
- State: currentState (idle/walking/tool), currentDirection (up/down/left/right), currentFrame, frameTime, frameDuration
- `update(deltaTime)`: Accumulate frameTime, advance frame when threshold reached
  - **CRITICAL**: Use `frameTime -= frameDuration` (not `frameTime = 0`) to preserve timing remainder and prevent drift
  - Use `while` loop (not `if`) to handle frame skipping on lag spikes
- Walking/idle animations loop, tool animations play once
- `setState(state, direction)`: Reset frame counter, set loop flag
- `render(ctx, x, y)`: Draw current frame from sprite sheet

Frame durations: Walk 100-150ms, tool 80ms per frame.

**Gotchas**: Tool animations block movement (don't loop). Use deltaTime for frame-rate independence. Round x, y coordinates to integers. Track frameTime accumulation, not frame count. Must use `frameTime -= frameDuration` to avoid 500ms timing drift over 30 minutes.

---

#### Task 5.3: Visual Effects [Depends on: 2.1]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/sprite-animation.docs.md` - Lines 436-526 (glow effect)
- `/docs/plans/archeology-game/sprite-animation.docs.md` - Lines 528-671 (flash and confetti)

**Instructions**

Files to Create:
- `/visualEffects.js`

Implement visual effects:
1. GlowingPOIMarker: Pre-render 20x20px rhombus with gold glow to offscreen canvas. Optional pulse animation (scale 1.0-1.1 with sin wave).
2. FlashEffect: Red overlay on screen edges, fade out over 200ms. Trigger on wrong tool use.
3. Confetti: Particle system with 30-50 particles, physics (gravity, velocity), fade over 2 seconds. Trigger on correct artifact extraction.

**Gotchas**: Pre-render glowing POI once to offscreen canvas, reuse every frame. Flash effect uses globalAlpha for fade. Confetti particles need position, velocity, color, life (0-1), rotation.

---

### Phase 6: Game Loop and Integration

#### Task 6.1: Core Game Loop [Depends on: 1.2, 1.3, 2.1, 2.2, 5.2]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/canvas-architecture.docs.md` - Lines 208-279 (game loop with delta time)
- `/docs/plans/archeology-game/canvas-architecture.docs.md` - Lines 964-1018 (engine integration)

**Instructions**

Files to Modify:
- `/game.js` (create new file)

Implement game loop:
- Use `requestAnimationFrame` with deltaTime tracking
- Cap physics updates at 60fps (frameInterval = 16.67ms)
- Separate update and render phases
- Update phase: input processing, player movement, animation updates, fog updates
- Render phase: render background, entities, UI, fog (only dirty layers)
- Time-independent movement: velocity × deltaTime

**Gotchas**: Calculate deltaTime as `currentTime - lastTime`. Always render at display refresh rate, but cap physics at 60fps. Convert deltaTime to seconds for movement (divide by 1000), keep as ms for animations.

---

#### Task 6.2: Player Movement and Collision [Depends on: 6.1, 3.3]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/canvas-architecture.docs.md` - Lines 282-340 (time-independent movement)
- `/docs/plans/archeology-game/procedural-generation.docs.md` - Lines 494-663 (tile collision detection)

**Instructions**

Files to Create:
- `/player.js`

Implement Player class:
- Position (pixel coordinates), velocity, speed (200 px/second), direction
- `update(deltaTime, input, levelGrid)`: Calculate velocity from input, normalize diagonal movement, apply speed × deltaTime
- Tile-based collision: Convert new position to tile coords, check `grid[tileY][tileX].isWalkable`
- Separate X and Y collision tests (allows sliding along walls)
- Update fog-of-war on movement
- Center camera on player

**Gotchas**: Normalize diagonal velocity (divide by magnitude). Test X and Y movement separately to allow wall sliding. Always check walkable flag before moving. Speed in pixels/second, multiply by deltaTime (in seconds).

---

#### Task 6.3: Tool System and POI Interaction [Depends on: 1.2, 5.2, 6.2]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/requirements.md` - Lines 19-48 (core gameplay loop)
- `/docs/plans/archeology-game/requirements.md` - Lines 206-212 (tool-to-artifact mapping)
- `/docs/plans/archeology-game/shared.md` - Lines 51 (tool animations 500ms, non-interruptible)

**Instructions**

Files to Create:
- `/toolSystem.js`

Implement tool interaction system:
- Stadia rod: No-op (always active for exploration)
- Magnifying glass: Show hint text for correct tool when at POI
- Excavation tools: Play animation, check if correct tool, update POI state
- Wrong tool (1st attempt): Red flash effect, increment wrongAttempts
- Wrong tool (2nd attempt): Remove POI, no artifact
- Correct tool: Play confetti, add artifact to inventory, remove POI

Tool unlocks: L1=shovel, L2=pickaxe, L3=brush, L4=hammer&chisel. Block movement during tool animations (500ms).

**Gotchas**: Check player is within 1 tile of POI for interaction. Track wrongAttempts per POI (max 2). Tool animation must complete before resolving outcome. Magnifying glass gives hint, doesn't extract.

---

#### Task 6.4: Museum and Level Progression [Depends on: 1.2, 6.3]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/requirements.md` - Lines 43-53 (museum phase and progression)
- `/docs/plans/archeology-game/requirements.md` - Lines 178-183 (museum screen UI)

**Instructions**

Files to Create:
- `/museum.js`
- `/levelProgression.js`

Implement museum screen:
- Display collected artifacts as icons (names/descriptions hidden until donated)
- "Donate All" button: Transfer artifacts to permanent collection, add money ($100 per valuable, $0-10 per junk)
- Show full artifact details (name, description) for donated items
- "Continue to Next Level" button: Increment level number, regenerate map, reset inventory (keep tools/money)

Level progression:
- After all 15 POIs processed (collected or destroyed), show "Level Complete" modal
- Level 10 completion: Show congratulations with confetti, unlock next island (placeholder)

**Gotchas**: Artifacts in inventory are temporary until donated. Museum collection persists across levels. Level 10 special case: show congratulations screen. Regenerate level with new seed (level number as seed).

---

#### Task 6.5: HUD and UI Rendering [Depends on: 1.2, 2.1, 4.4, 6.3]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/requirements.md` - Lines 172-176 (HUD components)
- `/docs/plans/archeology-game/canvas-architecture.docs.md` - Lines 911-916 (UI layer management)

**Instructions**

Files to Create:
- `/hudRenderer.js`

Implement HUD rendering to UI layer (z-index: 3):
- Top-left: Money display "$XXX" in pixel font
- Bottom-center: Tool inventory bar (6 slots: stadia rod, magnifying glass, 4 excavation tools)
  - Highlight current tool selection
  - Gray out locked tools
  - Mouse click to select tool
- Bottom-right: Minimap (150x100px) showing revealed area, POIs (if visible), player dot

Only redraw UI layer when state changes (money update, tool selection, level load).

**Gotchas**: UI layer renders above fog (z=3 > z=2) to remain visible. Inventory bar uses mouse input for selection. Tools gray out if not unlocked yet. Minimap updates throttled (500ms). UI layer doesn't redraw every frame.

---

### Phase 7: Save System and Polish

#### Task 7.1: LocalStorage Save/Load [Depends on: 1.2]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/requirements.md` - Lines 140-143 (save system)
- `/docs/plans/archeology-game/shared.md` - Lines 55 (save key and data)

**Instructions**

Files to Modify:
- `/gameState.js`

Implement save/load system:
- Save after level completion: player money, current level number, unlocked tools, museum collection (artifact IDs)
- Save key: `archeology_game_save`
- Load on game start: Restore state or initialize new game ($100, level 1, starter tools)
- Serialize to JSON, store in localStorage
- Handle missing/corrupted save (reset to defaults)

**Gotchas**: Don't save level-specific data (POI positions, fog state) - regenerate on load. Save after museum donation, not mid-level. Validate loaded data structure before applying.

---

#### Task 7.2: Tutorial and Error Handling [Depends on: 6.4]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/requirements.md` - Lines 15-17 (Level 1 tutorial)
- `/docs/plans/archeology-game/requirements.md` - Lines 237-240 (breaking changes allowed)

**Instructions**

Files to Create:
- `/tutorial.js`

Implement Level 1 tutorial:
- On first game start: Show overlay with instructions
  1. "Use WASD to move and explore"
  2. "Find glowing POI markers"
  3. "Use magnifying glass at POI for hint"
  4. "Use correct tool to extract artifact"
- Dismiss tutorial after first successful extraction

Error handling:
- Fail early on generation errors (throw, don't fallback)
- Log errors to console with clear messages
- Don't use `any` types - explicit types required

**Gotchas**: Tutorial overlay blocks game until dismissed. Only show once (store flag in localStorage). Don't handle errors silently - throw and crash.

---

#### Task 7.3: Performance Optimization Pass [Depends on: all previous tasks]

**READ THESE BEFORE TASK**
- `/docs/plans/archeology-game/canvas-architecture.docs.md` - Lines 891-937 (performance checklist)
- `/docs/plans/archeology-game/shared.md` - Lines 53 (performance targets)

**Instructions**

Files to Modify:
- All rendering files

Optimization checklist:
1. Verify viewport culling on all renderers (tiles, fog, entities)
2. Confirm dirty rectangle tracking (only redraw changed regions)
3. Round all coordinates to integers (Math.round)
4. Batch draw calls by fill color
5. Profile with DevTools: target 60fps sustained, level generation <500ms, fog update <5ms
6. Use typed arrays (Uint8Array) for fog data
7. Cache offscreen canvases for static content

**Gotchas**: Sub-pixel rendering kills performance - always round. Large maps need viewport culling or FPS drops. Don't redraw static layers every frame.

---

## Advice

**Critical Architecture Decisions**
- Multi-layer canvas is non-negotiable: background rarely redraws, entities every frame, fog/UI on change only. Without layering, performance will fail on large maps.
- Z-index ordering matters: background(0) → entities(1) → fog(2) → ui(3). UI must render above fog or HUD becomes obscured.
- World size (72×48 tiles) is 2× viewport (36×24 tiles): Required to fit 15 POIs with 8-12 tile spacing. Smaller maps mathematically cannot accommodate POI distribution.
- Seeded RNG for all generation: Same level seed must produce identical map. Never use Math.random() in generation code or levels won't be reproducible.
- Tile-coordinate collision over pixel-perfect: 40x40px tiles with isWalkable flag is simpler and faster than pixel masks or complex polygons.

**Performance Landmines**
- Sub-pixel rendering: Always Math.round() sprite positions. Fractional pixels cause 2-4x slowdown on macOS/Safari.
- Image smoothing: Must disable both in context (`imageSmoothingEnabled = false`) AND CSS (`image-rendering: pixelated`). Missing either makes pixel art blurry.
- Fog rendering without culling: Rendering 10k+ fog tiles per frame kills FPS. Viewport culling + dirty rectangles mandatory.
- fillStyle churn: Changing fillStyle is expensive. Batch tiles by color before drawing.

**Data Structure Gotchas**
- Uint8Array for fog: Object-per-tile uses 80% more memory. Use typed array with 1D indexing (`y * width + x`).
- Set for revealed tiles: Arrays have O(n) lookup. Use Set with string keys "x,y" for O(1) contains checks.
- Pre-calculated circle offsets: Computing visibility circle per frame wastes CPU. Calculate once at initialization.

**Generation Edge Cases**
- POI spacing enforcement: Poisson disc sampling can fail to place all 15 POIs if minDistance too high or map too small. Validate count after generation.
- Unreachable POIs: Flood fill validation catches this. Carve paths by removing 40-50% obstacles along A* path (don't clear entire path or map looks unnatural).
- Spawn point blocking: Always exclude 3-tile radius around spawn from obstacle placement or player can spawn trapped.

**Animation Timing Pitfalls**
- deltaTime units: Movement uses seconds (divide by 1000), animations use milliseconds. Mix-up causes 1000x speed errors.
- frameTime -= frameDuration is mandatory: Using `frameTime = 0` discards timing remainder, causing 500ms drift over 30 minutes. Always use subtraction to preserve accumulator.
- while loop for frame advance: Use `while (frameTime >= frameDuration)` not `if`. Prevents visual stuttering on lag spikes.
- Tool animation blocking: If movement isn't blocked during tool animation, player can move mid-swing and logic breaks. Lock movement until animation completes.
- Frame accumulation: Track frameTime accumulation, not frame count. Missing frames on low-end devices causes animations to skip.

**State Management**
- Don't save level data: POI positions, fog state, obstacles regenerate from seed. Only save progression (money, level number, museum).
- Tool unlock ordering matters: Players expect linear progression. Unlocking all tools at once breaks difficulty curve.
- Wrong attempt counter per POI: Shared counter allows player to exhaust attempts across different POIs. Each POI needs separate wrongAttempts field.

**Rendering Order Matters**
1. Background layer (z=0): Terrain tiles (cached offscreen canvas)
2. Entities layer (z=1): POI markers, player sprite (animated)
3. Fog layer (z=2): Semi-transparent overlay (unexplored/explored)
4. UI layer (z=3): HUD (money, inventory, minimap)

Wrong order causes fog to cover UI or player to render behind tiles. UI must be highest z-index to remain visible above fog.

**Testing Priorities**
- Different refresh rates: Test on 60Hz, 120Hz, 144Hz displays. DeltaTime bugs only show on non-60Hz.
- localStorage edge cases: Full storage, corrupted JSON, missing keys. Handle gracefully.
- Map generation stress test: Generate 100 levels with random seeds. Catch rare unreachable POI cases.
- Tool mapping validation: Ensure all 15 artifacts have exactly one correct tool. Missing mapping = unwinnable level.

**No-Build Constraint Implications**
- All code must run in browser without transpilation: Use ES6 modules with explicit `.js` extensions in imports.
- No npm dependencies in runtime: Libraries like canvas-confetti must be loaded via CDN or inlined.
- File protocol loading: Relative paths work, absolute paths fail. Use `./file.js` not `/file.js`.

**Fog-of-War Specific**
- Three states required: UNEXPLORED (never seen), EXPLORED (seen before), VISIBLE (currently visible). Two states don't provide enough visual feedback.
- Minimap fog update throttling: Updating minimap every frame is wasteful. 500ms throttle imperceptible to player.
- Dirty region tracking: Without it, redrawing 36×24 = 864 tiles every frame tanks FPS. Track min/max bounds of changed tiles.

**Procedural Generation Philosophy**
- Poisson disc > random placement: Even distribution prevents POI clustering, ensures exploration covers whole map.
- Noise-based obstacles > random: Creates natural-looking clusters (ruins grouped together, tree groves) vs scattered random tiles.
- Validation before finalization: Don't return invalid levels. Throw error if can't generate valid map after 10 attempts.

**Museum Mechanics**
- Artifact reveal on donation: Showing names/descriptions before donation removes mystery. Icons-only until donated maintains engagement.
- Junk items add risk: All valuable artifacts = no strategy needed. Junk forces careful tool selection, punishes wrong guesses.

**Canvas Context Gotchas**
- Context state persists: fillStyle, globalAlpha, transforms remain between draw calls. Always ctx.save()/restore() or reset manually.
- Canvas size vs CSS size: Canvas resolution (width/height attributes) != display size (CSS). Mismatch causes blurry rendering.
- Layer z-index: CSS z-index controls stack order. Must be: background(0) → entities(1) → fog(2) → ui(3). Wrong order = fog covers UI.
