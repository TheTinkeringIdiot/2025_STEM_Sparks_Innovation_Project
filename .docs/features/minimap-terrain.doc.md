# Minimap Terrain Rendering

## Overview
The minimap now displays colored terrain tiles based on the level grid (stone, dirt, grass, sand) instead of solid fog colors, with fog acting as a darkening overlay. This provides better spatial awareness and visual context for navigation.

## User Perspective
When exploring the game world, players see a minimap (243x162px) in the bottom-right corner that shows:
- Terrain colors: stone (gray), dirt (brown), grass (green), sand (sandy)
- Fog overlay: unexplored areas remain black, explored areas show terrain but slightly darkened (40% opacity), visible areas show full terrain color
- POI markers: golden question marks for undiscovered artifacts, green for discovered
- Player position: blue dot showing current location

The minimap updates every 500ms (throttled) and provides real-time visual feedback as the player explores the procedurally-generated Roman archeological site.

## Data Flow
1. **Level Generation**: LevelGenerator creates 72x48 tile grid with terrain types, stored in `gameState.level.grid`
2. **Grid Caching**: Minimap receives grid reference during update calls and caches it in `this.levelGrid`
3. **Terrain Rendering**:
   - Creates ImageData at map resolution (72x48 pixels, 1 pixel per tile)
   - Iterates through all tiles, checking fog state via `fog.getFogState(x, y)`
   - For explored/visible tiles: looks up tile type from grid and sets RGB color
   - For unexplored tiles: leaves black (RGB 0,0,0)
   - Renders ImageData to offscreen canvas, then scales to minimap display size (243x162px)
4. **Fog Overlay**:
   - Creates second ImageData pass with black pixels (RGB 0,0,0)
   - Sets alpha channel based on fog state: visible=0 (transparent), explored=100 (40% dim), unexplored=0 (terrain already black)
   - Composites overlay on top of terrain using canvas drawImage
5. **POI/Player Rendering**: Draws markers on top of terrain+fog composite
6. **Display**: HUD renderer blits final minimap to UI layer at position (1177, 778)

## Implementation

### Key Files
- `minimap.js` - Core minimap rendering system with terrain and fog integration
  - Lines 72-78: Terrain color definitions (stone/dirt/grass/sand RGB values)
  - Lines 71: Level grid cache for terrain lookups
  - Lines 112: Update method signature includes `levelGrid` parameter
  - Lines 142-190: `_renderTerrain()` - ImageData-based terrain rendering
  - Lines 197-235: `_renderFog()` - Fog overlay with darkening effect instead of solid colors
  - Lines 23-24: Minimap size increased to 243x162px (72x48 tiles × 3.375 scale)

- `game.js` - Minimap initialization and level grid integration
  - Line 76: Minimap constructor with new size (243x162px)
  - Line 458: Level grid stored in gameState (`gameState.level.grid = level.grid`)
  - Line 461-465: POI positions passed to minimap via `setPOIs()`
  - Line 338: Minimap render called every frame (UI layer always redraws)

- `hudRenderer.js` - HUD positioning and grid parameter passing
  - Lines 47-48: Minimap position adjusted for new 243x162px size (1177, 778)
  - Line 114: Passes `gameState.level.grid` to minimap update call
  - Line 348: Passes grid to `forceUpdate()` method

- `levelGenerator.js` - Grid structure remains unchanged
  - Grid is 72x48 2D array accessed as `grid[y][x]`
  - Each tile has `type` property: 'stone', 'dirt', 'grass', or 'sand'
  - Grid passed to minimap via gameState reference

### Rendering Pipeline
The minimap uses a two-pass ImageData rendering approach for performance:

**Pass 1: Terrain Rendering**
```javascript
// Create ImageData at map resolution (1 pixel per tile)
const imageData = ctx.createImageData(72, 48);
const data = imageData.data; // RGBA byte array

// For each tile (y, x):
if (fogState === 0) { // UNEXPLORED
  data[pixelIndex] = 0; // Black RGB
} else { // EXPLORED or VISIBLE
  const tileType = levelGrid[y][x].type;
  const color = terrainColors[tileType];
  data[pixelIndex] = color.r;
  data[pixelIndex + 1] = color.g;
  data[pixelIndex + 2] = color.b;
}

// Scale 72x48 terrain to 243x162 display size
ctx.drawImage(fogCanvas, 0, 0, 72, 48, offsetX, offsetY, 243, 162);
```

**Pass 2: Fog Overlay**
```javascript
// Create second ImageData for darkening overlay
const imageData = ctx.createImageData(72, 48);

// For each tile:
data[pixelIndex] = 0;     // Black RGB
data[pixelIndex + 1] = 0;
data[pixelIndex + 2] = 0;

// Alpha channel for darkening
if (fogState === 2) {       // VISIBLE
  data[pixelIndex + 3] = 0;    // Transparent - full color
} else if (fogState === 1) {  // EXPLORED
  data[pixelIndex + 3] = 100;  // 40% opacity - dim terrain
} else {                      // UNEXPLORED
  data[pixelIndex + 3] = 0;    // Transparent - already black
}

// Composite overlay on top of terrain
ctx.drawImage(fogCanvas, 0, 0, 72, 48, offsetX, offsetY, 243, 162);
```

### Performance Optimizations
- **ImageData API**: Direct pixel manipulation faster than drawing 3,456 individual rectangles (72×48 tiles)
- **Throttling**: Updates limited to 500ms intervals via `shouldUpdate()` check
- **Grid Caching**: Level grid reference cached in minimap instance, no per-frame lookups
- **Scale-after-render**: Renders at map resolution (72x48px) then scales to display size (243x162px) in single drawImage call
- **Offscreen Canvas**: Terrain/fog rendered to `this.fogCanvas` offscreen, then composited to visible minimap

### Coordinate Systems
- **Map coordinates**: 72 tiles × 48 tiles (world grid)
- **ImageData resolution**: 72 pixels × 48 pixels (1 pixel per tile)
- **Display resolution**: 243 pixels × 162 pixels (3.375px per tile, scaled)
- **Screen position**: (1177, 778) in 1440×960 viewport (bottom-right, 20px margins)

## Configuration
- **Terrain Colors** (minimap.js:74-78):
  - Stone: #808080 (128, 128, 128)
  - Dirt: #8B4513 (139, 69, 19)
  - Grass: #228B22 (34, 139, 34)
  - Sand: #F4A460 (244, 164, 96)

- **Fog Overlay Opacity** (minimap.js:220):
  - Visible: 0% (fully transparent)
  - Explored: 40% (100/255 alpha)
  - Unexplored: 0% (terrain already black)

- **Minimap Dimensions** (game.js:76):
  - Display size: 243×162 pixels
  - Map coverage: 72×48 tiles (full world)
  - Scale factor: 3.375 pixels per tile

- **Update Throttle** (minimap.js:88-92):
  - Update interval: 500ms
  - Checked via timestamp delta in `shouldUpdate()`

## Usage Example
```javascript
// Initialize minimap with new dimensions
this.minimap = new Minimap(72, 48, 243, 162);

// Update minimap each frame (throttled internally)
const playerTileX = Math.floor(gameState.player.position.x / 40);
const playerTileY = Math.floor(gameState.player.position.y / 40);
this.minimap.update(
  fog,              // FogOfWar instance
  playerTileX,      // Player tile X
  playerTileY,      // Player tile Y
  timestamp,        // Current timestamp for throttling
  level.grid        // Level grid for terrain rendering
);

// Render to UI layer
this.minimap.render(ctx, minimapX, minimapY);
```

## Testing
**Manual test:**
1. Start new game (python3 -m http.server 8000, navigate to http://localhost:8000)
2. Observe minimap in bottom-right corner shows black unexplored areas
3. Move player using WASD/arrows to explore map
4. Verify minimap reveals terrain colors (gray stone, brown dirt, green grass, sandy sand) as fog clears
5. Check that explored areas (outside visible radius) show terrain but slightly dimmed
6. Verify visible areas (within fog radius) show full terrain color
7. Confirm POI markers appear as golden question marks when in explored/visible fog
8. Test performance: no frame drops during exploration (throttled 500ms updates)

**Expected behavior:**
- Minimap starts entirely black (unexplored)
- As player moves, terrain colors reveal in circular pattern around player
- Explored terrain remains visible but darker than currently-visible terrain
- POIs only appear when fog reveals them
- Smooth performance with no visual artifacts or flickering
- Terrain colors match tile types on main game canvas

## Related Documentation
- Architecture: CLAUDE.md (canvas layer system, coordinate transforms)
- Core Systems: `fogOfWar.js` (fog state management), `levelGenerator.js` (terrain generation)
- Rendering: `canvasManager.js` (layer orchestration), `hudRenderer.js` (HUD positioning)
