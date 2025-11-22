# Minimap Terrain Rendering

## Overview
The minimap provides real-time terrain visualization showing actual tile types (stone, dirt, grass, sand) with fog-of-war integration. Players can see explored areas with terrain colors while unexplored areas remain black, and currently visible areas are fully bright.

## User Perspective
The minimap appears in the bottom-right corner (243x162px) showing a scaled-down view of the entire 72x48 tile map. Terrain is color-coded by tile type, with a fog overlay that darkens explored but not-currently-visible areas by 40%. The player's position is marked with a blue circle, and POIs appear as yellow dots when discovered by fog.

As the player explores, the minimap updates every 500ms, revealing new terrain colors as fog clears. The terrain rendering provides spatial awareness for navigation and artifact hunting strategies.

## Data Flow
1. **Level Generation**: `levelGenerator.js` creates grid with tile types → stored in `gameState.level.grid`
2. **Game Initialization**: Grid passed to minimap via `minimap.update(fog, playerX, playerY, timestamp, levelGrid)`
3. **Minimap Caching**: Level grid cached in `this.levelGrid` for repeated rendering
4. **Terrain Rendering** (every 500ms):
   - Iterate through all 72x48 tiles
   - Check fog state: UNEXPLORED (0), EXPLORED (1), VISIBLE (2)
   - For explored/visible tiles: Read tile type from `levelGrid[y][x].type`
   - Map tile type to RGB color using `terrainColors` dictionary
   - Write pixels to ImageData buffer (1 pixel per tile at map resolution)
   - Scale ImageData from 72x48 to minimap resolution (243x162) using canvas drawImage
5. **Fog Overlay Rendering**:
   - Create second ImageData buffer with black pixels
   - Set alpha channel: VISIBLE=0 (transparent), EXPLORED=100 (40% opacity), UNEXPLORED=0 (transparent)
   - Composite fog overlay on top of terrain layer
6. **POI/Player Rendering**: Draw markers on final composite

## Implementation

### Key Files
- `minimap.js` - Terrain rendering system, fog overlay compositing, ImageData optimization
- `game.js` - Minimap initialization with size (243x162), grid passing in level loading
- `hudRenderer.js` - Minimap positioning, update calls with grid parameter
- `levelGenerator.js` - Tile grid generation with type assignments (stone/dirt/grass/sand)
- `fogOfWar.js` - Fog state tracking (UNEXPLORED=0, EXPLORED=1, VISIBLE=2)

### Terrain Colors
```javascript
terrainColors = {
  'stone': { r: 128, g: 128, b: 128 }, // #808080 gray
  'dirt':  { r: 139, g: 69,  b: 19 },  // #8B4513 brown
  'grass': { r: 34,  g: 139, b: 34 },  // #228B22 green
  'sand':  { r: 244, g: 164, b: 96 }   // #F4A460 tan
}
```

### Rendering Pipeline
1. **Terrain Layer** (`_renderTerrain()`):
   - Creates ImageData at map resolution (72x48)
   - Sets RGB from terrain color, alpha=255 (fully opaque)
   - Unexplored tiles remain black (0,0,0,255)
   - Draws to offscreen `fogCanvas`, then scales to minimap

2. **Fog Overlay** (`_renderFog()`):
   - Creates ImageData at map resolution (72x48)
   - Black pixels (0,0,0) with variable alpha:
     - VISIBLE: alpha=0 (terrain shows fully bright)
     - EXPLORED: alpha=100 (terrain darkened 40%)
     - UNEXPLORED: alpha=0 (black terrain shows through)
   - Composites on top of terrain layer

3. **Performance Optimization**:
   - ImageData API for pixel-level control (faster than rect drawing)
   - Canvas scaling for smooth downsampling (72x48 → 243x162)
   - Throttled updates (500ms interval)
   - Cached level grid reference

### Coordinate Systems
- Map resolution: 72x48 tiles (1 pixel per tile in ImageData)
- Minimap resolution: 243x162 pixels (3.375x scale factor)
- Level grid: `grid[y][x]` row-major indexing
- Fog state: `fog.getFogState(x, y)` returns 0/1/2

## Configuration
- Minimap display size: 243x162 pixels
- Update throttle: 500ms between renders
- Position: Bottom-right corner (20px margins)
- Fog overlay opacity: 40% for explored areas (alpha=100/255)
- Map resolution: 72x48 tiles (matches level grid)

## Usage Example
```javascript
// Initialize minimap in Game constructor
this.minimap = new Minimap(72, 48, 243, 162);

// Set POI positions after level generation
const minimapPOIs = level.pois.map(poi => ({
  x: poi.position.x,
  y: poi.position.y
}));
this.minimap.setPOIs(minimapPOIs);

// Update minimap in HUD renderer (passes level grid)
const playerTileX = Math.floor(gameState.player.position.x / 40);
const playerTileY = Math.floor(gameState.player.position.y / 40);
this.minimap.update(fog, playerTileX, playerTileY, timestamp, gameState.level.grid);

// Render minimap to UI canvas
this.minimap.render(ctx, this.minimapX, this.minimapY);

// Force immediate update (bypasses throttle)
this.minimap.forceUpdate(fog, playerTileX, playerTileY, gameState.level.grid);
```

## Testing
- **Manual Test 1 - Terrain Colors**:
  1. Start new level, observe minimap bottom-right
  2. Expected: Black unexplored areas, terrain colors visible around spawn (200px fog radius)
  3. Verify stone (gray), dirt (brown), grass (green), sand (tan) appear correctly

- **Manual Test 2 - Fog Overlay**:
  1. Move player to explore new area
  2. Return to previously explored area (outside 200px radius)
  3. Expected: Previously explored terrain appears 40% darker than currently visible area

- **Manual Test 3 - POI Markers**:
  1. Explore to reveal POI
  2. Check minimap for yellow dot at POI position
  3. Expected: POI appears on minimap when fog reveals it, matches world position

- **Manual Test 4 - Performance**:
  1. Open browser console, check FPS (should maintain 60fps)
  2. Move continuously while watching minimap updates
  3. Expected: Smooth updates every 500ms, no frame drops

- **Manual Test 5 - Grid Caching**:
  1. Inspect `window.game.minimap.levelGrid` in console
  2. Expected: Contains 48 arrays of 72 tiles each with `type` property

## Related Documentation
- Fog System: `fogOfWar.js` (fog state tracking)
- Level Generation: `levelGenerator.js` (terrain generation with Perlin noise)
- HUD Rendering: `hudRenderer.js` (minimap positioning and update calls)
- Performance: Root `CLAUDE.md` (canvas optimization patterns)
