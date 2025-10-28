# Archeology Game - Shared Architecture Reference

This browser-based Roman archeology game uses HTML5 Canvas with vanilla JavaScript, procedural generation, and tile-based movement. The architecture employs multi-layer rendering, frame-rate independent animation, and seeded randomization for reproducible levels. No build process required - runs directly via file:// protocol.

## Relevant Files

Core game files will be structured as:
- `/index.html`: Entry point with canvas container and inline script tags
- `/game.js`: Core game loop, state management, input handling
- `/renderer.js`: Multi-layer canvas management, camera system
- `/levelGenerator.js`: Procedural terrain and POI generation with pathfinding validation
- `/fogOfWar.js`: Visibility tracking with circular reveal (200px radius)
- `/animator.js`: Sprite sheet animation state machine
- `/styles.css`: UI styling for HUD, minimap, modal screens

## Relevant Patterns

**Multi-Layer Canvas Rendering**: Use 4 stacked canvas elements (background, entities, UI, fog) with CSS absolute positioning. Only redraw layers when changed. Background layer renders once per level load. Entities layer clears/redraws at 60 FPS. Fog layer updates on player movement. Example: `/docs/plans/archeology-game/canvas-architecture.docs.md:44-136`

**Frame-Rate Independent Game Loop**: Use `requestAnimationFrame` with deltaTime tracking. Physics/movement calculations multiply by deltaTime to maintain consistent speed across 60Hz/120Hz/144Hz displays. Example: `/docs/plans/archeology-game/canvas-architecture.docs.md:213-279`

**Seeded Procedural Generation**: Use Mulberry32 PRNG initialized with level-specific seed for reproducible levels. Generate terrain with Perlin noise, place POIs via Poisson disc sampling (8-12 tile spacing), validate connectivity with flood fill, carve paths if needed. Example: `/docs/plans/archeology-game/procedural-generation.docs.md:774-1007`

**Fog-of-War with Uint8Array**: Track three states (unexplored=0, explored=1, visible=2) in 1D typed array indexed by `y * width + x`. Pre-calculate circular reveal offsets at initialization, apply on player movement, render semi-transparent overlay. Example: `/docs/plans/archeology-game/fog-of-war.docs.md:8-137`

**Sprite Sheet Animation State Machine**: 40x40px frames organized in rows by direction/action. Update animation frames using accumulated frameTime vs frameDuration. Non-looping tool animations block movement until complete. Example: `/docs/plans/archeology-game/sprite-animation.docs.md:119-199`

**Tile-Based Collision Detection**: Convert pixel coordinates to tile coordinates via `Math.floor(pixelX / TILE_SIZE)`. Check `grid[tileY][tileX].isWalkable` before movement. Use AABB overlap testing for smooth pixel movement. Example: `/docs/plans/archeology-game/procedural-generation.docs.md:499-563`

**Input State Tracking**: Centralize keyboard/mouse state in single object updated by event listeners. Game loop reads state snapshot each frame rather than responding to events inline. Prevents missed inputs and simplifies state machine logic. Example: `/docs/plans/archeology-game/canvas-architecture.docs.md:346-534`

**Viewport Culling**: Calculate visible tile range from camera position: `startCol = floor(cameraX / tileSize)`, `endCol = ceil((cameraX + viewportWidth) / tileSize)`. Only iterate/render tiles within range. Example: `/docs/plans/archeology-game/canvas-architecture.docs.md:837-889`

## Relevant Technical Constraints

**Canvas Configuration**: Must disable image smoothing (`ctx.imageSmoothingEnabled = false`) and set CSS `image-rendering: pixelated` for crisp 40x40px sprites. Sub-pixel rendering causes severe performance degradation - always round coordinates to integers.

**Tile Size**: Fixed 40x40px tiles. Viewport displays 36×24 tiles (1440×960px). Character sprite 40x40px with 8-10px body, rest padding. POI markers 20x20px rhombus with glow effect.

**Game State Structure**:
```javascript
{
  player: { position: {x, y}, money: 100, inventory: ['stadia_rod', 'magnifying_glass'], currentTool, direction },
  level: { island: 'roman', number: 1-10, pois: [{id, x, y, toolRequired, artifact, wrongAttempts}], revealedTiles: Set(), obstacles: [] },
  museum: { collection: [artifactIds] }
}
```

**POI Requirements**: Exactly 15 POIs per level (10 valuable artifacts worth $100, 5 junk worth $0-10). Minimum 8-12 tile spacing enforced. Two wrong tool attempts removes POI permanently without reward.

**Tool Unlock Progression**: Level 1=shovel, Level 2=pickaxe, Level 3=brush, Level 4=hammer&chisel. Stadia rod and magnifying glass always available. Tool animations 500ms, non-interruptible.

**Performance Targets**: 60 FPS sustained, level generation <500ms, fog update <5ms, load saved state <200ms. Use typed arrays (`Uint8Array`) for fog data, offscreen canvas caching for static backgrounds, priority queues for A* pathfinding.

**Save System**: Persist to localStorage after each level completion. Save key `archeology_game_save` contains: player money, current level, tool unlocks, museum collection (artifact IDs only).

## Relevant Docs

**docs/plans/archeology-game/requirements.md**: You must read this for game mechanics, user flow, tool-to-artifact mapping, Roman artifact catalog, level progression rules, and success criteria.

**docs/plans/archeology-game/canvas-architecture.docs.md**: You must read this when working on rendering pipeline, game loop implementation, input handling, camera system, state management, or performance optimization.

**docs/plans/archeology-game/fog-of-war.docs.md**: You must read this when implementing visibility system, minimap fog rendering, or optimizing fog update performance.

**docs/plans/archeology-game/procedural-generation.docs.md**: You must read this when implementing level generation, obstacle placement, POI distribution, pathfinding validation, or collision detection.

**docs/plans/archeology-game/sprite-animation.docs.md**: You must read this when creating sprite sheets, implementing character animations, tool use animations, visual effects (glow, confetti, red flash), or particle systems.
