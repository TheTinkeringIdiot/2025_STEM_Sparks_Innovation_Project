# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Browser-based archeology game where players explore procedurally-generated Roman-themed levels, discover artifacts using specialized tools, and donate findings to a museum. Built with vanilla JavaScript and HTML5 Canvas (no build tools or frameworks).

**Key Mechanics:**
- Fog-of-war exploration with tool-based artifact discovery
- 15 POIs per level (10 valuable artifacts @$100, 5 junk @$0-10)
- Progressive tool unlocks (stadia rod → magnifying glass → shovel → pickaxe → brush → hammer/chisel)
- Wrong tool usage: 1st attempt = red flash, 2nd attempt = POI destroyed
- Museum donation system for level progression funding

## Architecture

**Module System:** Global namespace modules loaded via `<script>` tags in dependency order (see index.html:40-73). No ES6 modules or bundler.

**Core Game Loop (game.js):**
- Fixed 60fps physics updates with variable refresh rate rendering
- Delta time-independent movement (velocity × deltaTime)
- 4-layer canvas system: background (tiles) → entities (player/POIs) → fog → ui
- Dirty flag optimization: only redraws changed layers

**State Management (gameState.js):**
- Centralized game state with player/level/museum data
- localStorage persistence (save/load/clear functions)
- ARTIFACT_CATALOG: artifact definitions with tool mappings
- TOOL_UNLOCKS: progressive tool availability by level (1-10)

**Procedural Generation (levelGenerator.js):**
- Phase-based generation: init → terrain → POIs → spawn → obstacles → validation → finalize
- 72×48 tile grid (40px tiles = 2880×1920px world)
- Perlin noise terrain with 4 tile types (stone/dirt/grass/sand)
- Poisson disc POI placement with spawn exclusion zones
- A* pathfinding validation ensures all POIs reachable from spawn
- Automatic path carving when connectivity fails

**Rendering Systems:**
- `canvasManager.js`: Multi-layer canvas orchestration with dirty flags
- `renderer.js`: TileRenderer with tile prerendering optimization
- `fogOfWar.js`: Grid-based fog with circular reveal (200px radius)
- `fogRenderer.js`: Fog overlay with gradient edge smoothing
- `camera.js`: World/screen coordinate transforms and viewport culling
- `minimap.js`: Real-time minimap with fog integration
- `hudRenderer.js`: DOM-based HUD overlay for money/tools/minimap

**Input & Movement:**
- `inputManager.js`: WASD/arrow key state tracking
- `player.js`: Player state management
- `pathfinding.js`: A* implementation for NPC/validation
- Diagonal movement normalized (prevents faster diagonal speed)

**Sprites & Animation:**
- `spriteGenerator.js`: Programmatic pixel art generation (40×40px)
- `animator.js`: Frame-based character animation system
- `visualEffects.js`: Screen effects (red flash, particles, etc.)

## Development Commands

**Run the game:**
```bash
# Open in browser (no build step required)
python3 -m http.server 8000
# Navigate to http://localhost:8000
```

**Testing:**
- `test_poisson.html` - Poisson disc sampling visualization
- `test-spritesheet.html` - Sprite generation preview

**Debugging:**
- Game instance available as `window.game` in browser console
- Canvas imageSmoothingEnabled disabled for pixel-perfect rendering

## Code Conventions

**Coordinate Systems:**
- World coordinates: pixels (0,0 to 2880,1920)
- Grid coordinates: tiles (0,0 to 72,48)
- Screen coordinates: viewport pixels (0,0 to 1440,960)
- Use `camera.worldToScreen()` and `camera.screenToWorld()` for transforms

**Tile Indexing:**
- Grid accessed as `grid[y][x]` (row-major order)
- Tile keys as strings: `"x,y"` for Set/Map storage

**Random Generation:**
- Always use `SeededRandom` (seededRandom.js) for reproducible generation
- Never use `Math.random()` in generation code
- Seed format: level number or timestamp

**Canvas Layers (z-order bottom to top):**
1. `background-canvas` - Static prerendered tiles
2. `entities-canvas` - Player, POIs (redrawn every frame)
3. `fog-canvas` - Fog of war overlay
4. `ui-canvas` - Debug overlays
5. DOM HUD - Money, tools, minimap (positioned absolutely)

**Performance Patterns:**
- Mark layers dirty with `canvasManager.markDirty(layer)` when changed
- Prerender static content (tiles) to off-screen canvas
- Use viewport culling for large worlds
- Round positions to prevent sub-pixel jitter

## Game Constants

**Map:**
- World: 72×48 tiles (2880×1920 pixels)
- Tile size: 40×40 pixels
- Viewport: 1440×960 pixels (36×24 tiles visible)

**Player:**
- Speed: 160 px/s (4 tiles/second)
- Spawn: Center of map (tile 36,24)
- Fog reveal radius: 200px (5 tiles)

**POIs:**
- Count: 15 per level
- Spacing: 8-12 tiles (Poisson disc)
- Discovery radius: 2 tiles
- Spawn exclusion: 4 tiles from player start

**Artifacts:**
- Valuable: $100 (10 per level)
- Junk: $0-10 random (5 per level)
- Tool requirements: shovel/pickaxe/brush/hammer_chisel

## Module Dependencies

**Load Order (critical):**
1. Utilities: seededRandom.js, poissonDisc.js, pathfinding.js
2. State: gameState.js
3. Rendering: canvasManager.js, camera.js, renderer.js, fog*.js, minimap.js, hudRenderer.js
4. Animation: spriteGenerator.js, animator.js, visualEffects.js
5. Logic: inputManager.js, player.js, toolSystem.js, levelGenerator.js, museum.js, levelProgression.js, tutorial.js
6. Core: game.js

**Cross-module dependencies:**
- All systems access `gameState` (global)
- Renderers accept `camera` instance for transforms
- Level generation requires `SeededRandom` and `poissonDiscSampling`

## Type Patterns

Since this is vanilla JS without TypeScript, document expected shapes in comments:

```javascript
// Player shape
{
  position: { x: number, y: number },
  money: number,
  tools: string[], // Tool IDs: ['stadia_rod', 'magnifying_glass', 'shovel', ...]
  artifacts: string[], // Collected artifact IDs: ['amphora', 'denarius_coin', ...]
  currentTool: string,
  direction: 'up'|'down'|'left'|'right'
}

// POI shape
{
  id: number,
  position: { x: number, y: number },
  type: string,
  discovered: boolean,
  wrongAttempts: number,
  artifact: { id: string, isValuable: boolean }
}

// Tile shape
{
  x: number,
  y: number,
  type: 'stone'|'dirt'|'grass'|'sand',
  isWalkable: boolean,
  obstacle: string|null,
  spriteIndex: number
}
```

## Common Tasks

**Adding a new tool:**
1. Add to TOOL_UNLOCKS in gameState.js
2. Add tool-artifact mapping in TOOL_ARTIFACT_MAP
3. Add artifact entries to ARTIFACT_CATALOG
4. Update toolSystem.js for tool behavior
5. Generate sprite in spriteGenerator.js

**Adding a new level:**
- Levels 1-10 supported; add new island for 11+
- Update TOOL_UNLOCKS for level-specific tools
- Theme controlled via levelGenerator config

**Modifying fog behavior:**
- Reveal radius: FogOfWar constructor (fogOfWar.js:20)
- Gradient smoothing: FogRenderer.renderFog (fogRenderer.js)
- Update frequency: Game.update (game.js:166)

**Debugging generation:**
- Enable validation logs: LevelGenerator.validate
- Visualize Poisson disc: open test_poisson.html
- Check pathfinding: use validateAllPOIsReachable
