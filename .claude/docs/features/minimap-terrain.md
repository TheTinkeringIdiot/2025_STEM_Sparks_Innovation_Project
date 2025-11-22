# Minimap Terrain Rendering

## Overview
The minimap displays colored terrain tiles based on the level grid (stone, dirt, grass, sand) with fog acting as a darkening overlay, providing better spatial awareness during exploration.

## User Perspective
Players see a 243×162px minimap in the bottom-right corner showing:
- **Terrain colors**: Stone (gray), dirt (brown), grass (green), sand (sandy)
- **Fog states**: Unexplored (black), explored (dimmed terrain at 40% opacity), visible (full color)
- **POI markers**: Golden question marks for undiscovered artifacts, green for discovered
- **Player position**: Blue dot showing current location

The minimap updates every 500ms (throttled) and provides real-time visual feedback as players explore the procedurally-generated Roman archeological site.

## Data Flow
1. **Level Generation**: `LevelGenerator` creates 72×48 tile grid with terrain types stored in `gameState.level.grid`
2. **Grid Caching**: Minimap receives grid reference during `update()` calls and caches in `this.levelGrid`
3. **Terrain Rendering** (Pass 1):
   - Creates ImageData at map resolution (72×48 pixels, 1 pixel per tile)
   - For each tile, checks fog state via `fog.getFogState(x, y)`
   - Explored/visible tiles: looks up tile type from grid, sets RGB color
   - Unexplored tiles: remains black (RGB 0,0,0)
   - Renders ImageData to offscreen canvas, scales to 243×162px display
4. **Fog Overlay** (Pass 2):
   - Creates second ImageData with black pixels (RGB 0,0,0)
   - Sets alpha based on fog state: visible=0 (transparent), explored=100 (40% dim), unexplored=0
   - Composites overlay on top of terrain
5. **POI/Player Rendering**: Draws markers on top of terrain+fog composite
6. **Display**: HUD renderer blits final minimap to UI layer at (1177, 778)

## Implementation

### Key Files
- **/home/quigley/dev/2025_STEM_Sparks_Innovation_Project/minimap.js**
  - Lines 72-78: Terrain color definitions (stone/dirt/grass/sand RGB values)
  - Line 71: Level grid cache (`this.levelGrid`)
  - Line 112: `update()` method signature includes `levelGrid` parameter
  - Lines 142-190: `_renderTerrain()` - ImageData-based terrain rendering
  - Lines 197-235: `_renderFog()` - Fog overlay with darkening effect
  - Lines 23-24: Minimap dimensions 243×162px (72×48 tiles × 3.375 scale)

- **/home/quigley/dev/2025_STEM_Sparks_Innovation_Project/game.js**
  - Line 76: Minimap constructor with new size
  - Line 458: Level grid stored in gameState
  - Lines 461-465: POI positions passed to minimap
  - Line 338: Minimap render called every frame

- **/home/quigley/dev/2025_STEM_Sparks_Innovation_Project/hudRenderer.js**
  - Lines 47-48: Minimap position for 243×162px size (1177, 778)
  - Line 114: Passes `gameState.level.grid` to minimap update
  - Line 348: Passes grid to `forceUpdate()` method

### Rendering Pipeline
Two-pass ImageData approach for performance:

**Pass 1: Terrain Rendering**
- Creates 72×48 ImageData (1 pixel per tile)
- For unexplored tiles: sets black RGB (0,0,0)
- For explored/visible tiles: looks up tile type from grid, sets terrain color RGB
- Scales from 72×48px to 243×162px display size

**Pass 2: Fog Overlay**
- Creates second 72×48 ImageData with black RGB
- Sets alpha channel: visible=0% (transparent), explored=40%, unexplored=0%
- Composites overlay on top of terrain layer

### Performance Optimizations
- **ImageData API**: Direct pixel manipulation faster than 3,456 individual rectangle draws
- **Throttling**: 500ms update intervals via `shouldUpdate()`
- **Grid Caching**: Level grid reference cached, no per-frame lookups
- **Scale-after-render**: Renders at 72×48px, scales to 243×162px in single `drawImage()`
- **Offscreen Canvas**: Terrain/fog rendered offscreen, composited to visible minimap

## Configuration
**Terrain Colors** (minimap.js:74-78):
- Stone: #808080 (128, 128, 128)
- Dirt: #8B4513 (139, 69, 19)
- Grass: #228B22 (34, 139, 34)
- Sand: #F4A460 (244, 164, 96)

**Fog Overlay Opacity** (minimap.js:220):
- Visible: 0% (fully transparent)
- Explored: 40% (100/255 alpha)
- Unexplored: 0% (terrain already black)

**Dimensions** (game.js:76):
- Display: 243×162 pixels
- Coverage: 72×48 tiles (full world)
- Scale: 3.375 pixels per tile

**Update Throttle**: 500ms (minimap.js:88-92)

## Usage Example
```javascript
// Initialize minimap
this.minimap = new Minimap(72, 48, 243, 162);

// Update each frame (throttled internally)
const playerTileX = Math.floor(gameState.player.position.x / 40);
const playerTileY = Math.floor(gameState.player.position.y / 40);
this.minimap.update(fog, playerTileX, playerTileY, timestamp, level.grid);

// Render to UI layer
this.minimap.render(ctx, minimapX, minimapY);
```

## Testing
**Manual test:**
1. Start game: `python3 -m http.server 8000`, navigate to http://localhost:8000
2. Observe minimap shows black unexplored areas
3. Move player (WASD/arrows) to explore
4. Verify terrain colors reveal (gray stone, brown dirt, green grass, sandy sand)
5. Check explored areas show dimmed terrain outside visible radius
6. Confirm visible areas show full terrain color
7. Verify POI markers appear when fog reveals them
8. Test performance: no frame drops during exploration

**Expected behavior:**
- Minimap starts entirely black
- Terrain reveals in circular pattern around player
- Explored terrain remains visible but darker
- POIs appear when fog-revealed
- Smooth 60fps with no flickering or artifacts

## Related Documentation
- CLAUDE.md: Canvas layer system, coordinate transforms
- fogOfWar.js: Fog state management
- levelGenerator.js: Terrain generation
- canvasManager.js: Layer orchestration
