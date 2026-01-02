# Enhanced Terrain Rendering

## Overview
The tile rendering system now generates procedurally enhanced terrain with 4 variants per terrain type, organic edge blending between different terrain types, and decorative overlays, creating visually rich and natural-looking environments without external sprite assets.

## User Perspective
When exploring the game world, players see:
- **Terrain variety**: Each terrain type (grass, stone, dirt, sand, ground) appears in 4 color-shifted variants to avoid repetitive patterns
- **Natural transitions**: Smooth, organic blending where different terrain types meet using scattered pixel edges and corner blending
- **Terrain details**: Type-specific features like grass blades on grass tiles, stone cracks in stone, sand ripples, and dirt pebbles
- **Decorative elements**: Scattered details like grass tufts, flowers, clovers, pebbles, twigs, leaves, shells, pottery shards, and mosaic chips (15% spawn chance per tile)
- **Reproducible worlds**: All terrain features are generated using seeded random, ensuring the same level seed produces identical visual appearance

## Data Flow
1. **Level Generation**: LevelGenerator creates 72x48 tile grid with terrain types and assigns random variant indices (0-3) to each tile
2. **Sprite Generation**: TileRenderer.generateTileSprites() creates 4 canvas variants per terrain type (20 total sprites):
   - Applies color shift based on variant (-12 to +12 RGB offset)
   - Adds texture using 25-50 random dots with varying size and brightness
   - Calls addTerrainDetails() for terrain-specific visual features
3. **Decoration Generation**: TileRenderer.generateDecorationSprites() creates 13 decoration types with terrain-specific associations
4. **Map Pre-rendering**: TileRenderer.prerenderMap() renders entire 2880x1920px world to offscreen canvas:
   - Draws base tile variant for each grid position
   - Applies edge blending with 4 cardinal neighbors (top/bottom/left/right)
   - Applies corner blending with 4 diagonal neighbors (only when adjacent edges match)
   - Randomly places decorations on 15% of tiles (excluding obstacles)
   - Draws obstacles on top
5. **Viewport Rendering**: TileRenderer.renderVisible() composites visible portion from prerendered offscreen canvas to background layer each frame

## Implementation

### Key Files
- `renderer.js` - Complete tile rendering system with blending and decoration
  - Lines 45-107: `generateTileSprites()` - Creates 4 variants per terrain type with color shifts and texture
  - Lines 109-164: `addTerrainDetails()` - Adds terrain-specific details (grass blades, stone cracks, sand ripples, dirt pebbles)
  - Lines 237-276: `generateDecorationSprites()` - Creates 13 decoration types with terrain associations
  - Lines 278-434: Decoration drawing methods (drawGrassTuft, drawFlower, drawClover, drawPebbles, drawTwig, drawLeaf, drawStoneCrack, drawRubble, drawShell, drawSandRipple, drawPotteryShard, drawMosaicChip)
  - Lines 441-449: `getDecorationsForTerrain()` - Filters decorations valid for a terrain type
  - Lines 456-462: `createSeededRandom()` - Seeded random generator for reproducibility
  - Lines 469-478: `getTerrainColor()` - Returns RGB array for terrain base colors
  - Lines 480-538: `drawEdgeBlend()` - Scattered pixel blending for cardinal direction edges
  - Lines 540-589: `drawCornerBlend()` - Circular scattered pixel blending for diagonal corners
  - Lines 591-660: `applyTerrainBlending()` - Orchestrates edge and corner blending based on neighbor analysis
  - Lines 662-689: `drawDecoration()` - Randomly selects and places terrain-appropriate decoration
  - Lines 696-768: `prerenderMap()` - Main rendering pipeline integrating all systems

- `levelGenerator.js` - Assigns tile variants during generation
  - Each tile receives random `spriteIndex` (0-3) for variant selection

- `game.js` - Initializes renderer and triggers prerendering
  - Calls `tileRenderer.prerenderMap(level.grid)` on level load

### Terrain Variant System
Each terrain type generates 4 variants with procedural differences:

```javascript
// Color shift per variant
const colorShift = (variant - 1.5) * 8; // Range: -12 to +12
// variant 0: -12 (darker)
// variant 1: -4
// variant 2: +4
// variant 3: +12 (brighter)

// Seeded random ensures reproducibility
const seed = type.name.charCodeAt(0) * 1000 + variant;
const seededRand = () => {
  const x = Math.sin(seed + seededRand.i++) * 10000;
  return x - Math.floor(x);
};

// Texture dots vary by terrain
const dotCount = type.name === 'stone' ? 50 : type.name === 'sand' ? 25 : 35;
```

### Edge Blending Algorithm
Organic transitions use scattered pixels with density falloff:

```javascript
// For each edge direction (top/bottom/left/right):
// 1. Calculate pixel count based on blend depth (50% of tile size)
const blendDepth = Math.floor(size * 0.5); // 20px for 40px tiles
const pixelCount = Math.floor(size * blendDepth * 0.3); // ~240 pixels

// 2. Scatter pixels with squared distribution (more near edge)
distFromEdge = rand() * rand() * blendDepth; // 0-20px

// 3. Alpha decreases with distance from edge
const alpha = 0.7 * (1 - distFromEdge / blendDepth); // 0.7 to 0.0

// 4. Vary pixel size for texture (1-3px)
const pixelSize = 1 + Math.floor(rand() * 2);
```

### Corner Blending Logic
Corners only blend when diagonal neighbor differs but both adjacent edges match:

```javascript
// Example: Top-left corner
// Only blend if:
//   - Diagonal neighbor (top-left) is different terrain
//   - Top neighbor is same terrain as current tile
//   - Left neighbor is same terrain as current tile
// This creates isolated corner blending without bleeding along edges

// Circular scatter pattern
const angle = rand() * Math.PI * 2;
const dist = rand() * rand() * radius; // Squared for density near corner
const px = cornerX + Math.cos(angle) * dist;
const py = cornerY + Math.sin(angle) * dist;
```

### Decoration System
Decorations are terrain-specific and probabilistically placed:

**Grass decorations:**
- grass_tuft: 5 curved strokes radiating from center
- flower_yellow/flower_purple: 5 petals + center
- clover: 3-leaf clover with stem

**Dirt/ground decorations:**
- pebbles: 4 elliptical stones with varied colors
- twig: Brown line with small branch
- leaf: Brown ellipse with center vein

**Stone decorations:**
- stone_crack: Branching crack lines
- rubble: 4 small irregular polygons

**Sand decorations:**
- shell: Semi-circular shell with arc details
- sand_ripple: 3 wavy curved lines

**Roman-themed decorations:**
- pottery_shard: Terracotta irregular polygon
- mosaic_chip: Colored 6x6px square (blue/red/gold/green)

### Terrain Base Colors
Defined as RGB arrays for programmatic manipulation:

```javascript
ground: [139, 115, 85]   // Brown
grass:  [127, 170, 101]  // Green
dirt:   [155, 118, 83]   // Tan
stone:  [128, 128, 128]  // Gray
sand:   [237, 201, 175]  // Sandy beige
```

### Performance Optimizations
- **Pre-rendering**: Entire map rendered once to offscreen canvas (2880x1920px), not per-frame
- **Viewport compositing**: Only visible portion (1440x960px) copied from offscreen canvas each frame
- **Seeded randomness**: Reproducible generation avoids storing decoration data
- **ImageSmoothingEnabled = false**: Prevents blurry upscaling of pixel art
- **Canvas reuse**: Decoration sprites cached in Map, drawn via drawImage

## Configuration

### Terrain Variant Count
- **Variants per terrain type**: 4 (hardcoded in generateTileSprites)
- **Total tile sprites**: 20 (5 terrain types × 4 variants)

### Blending Parameters
- **Edge blend depth**: 50% of tile size (20px for 40px tiles)
- **Edge pixel count**: ~240 pixels per edge
- **Edge alpha range**: 0.7 (at edge) to 0.0 (at blend depth)
- **Corner blend radius**: 40% of tile size (16px for 40px tiles)
- **Corner pixel count**: ~100 pixels per corner
- **Corner alpha range**: 0.6 (at corner) to 0.0 (at radius)

### Decoration Spawn Rate
- **Decoration chance**: 15% per tile (line 745: `seededRand() < 0.15`)
- **Excluded tiles**: Tiles with obstacles never spawn decorations
- **Randomization**: Seeded based on map dimensions for reproducibility

### Terrain Detail Counts
- **Grass blades**: 6 per tile
- **Stone crack lines**: 0-1 per tile (50% chance)
- **Sand ripples**: 2 per tile
- **Dirt pebbles**: 3 per tile

## Usage Example

```javascript
// Initialize renderer
const tileRenderer = new TileRenderer(72, 48, 40);

// Generate all sprites (called automatically by prerenderMap)
tileRenderer.generateTileSprites();      // 20 tile variants
tileRenderer.generateObstacleSprites();  // 6 obstacle types
tileRenderer.generateDecorationSprites(); // 13 decoration types

// Pre-render entire map with blending and decorations
tileRenderer.prerenderMap(level.grid);
// level.grid structure:
// grid[y][x] = {
//   type: 'grass'|'stone'|'dirt'|'sand'|'ground',
//   spriteIndex: 0-3,  // Variant to use
//   obstacle: 'ruin_column'|'tree_cypress'|null,
//   ...
// }

// Render visible viewport each frame
tileRenderer.renderVisible(backgroundContext, camera);

// Alternative: render with per-tile culling (fallback method)
tileRenderer.renderWithCulling(backgroundContext, level.grid, camera);
```

## Testing

**Manual test:**
1. Start game server: `python3 -m http.server 8000`, navigate to http://localhost:8000
2. Start new level to trigger map generation
3. **Verify tile variants**: Observe that terrain tiles of same type have subtle color variations (4 shades per type)
4. **Verify texture details**:
   - Grass tiles show small vertical grass blade marks
   - Stone tiles show occasional vertical crack lines
   - Sand tiles show subtle curved ripple patterns
   - Dirt tiles show small circular pebbles
5. **Verify edge blending**: Zoom browser to 200%+ and check terrain boundaries:
   - Grass-to-stone transitions show scattered gray pixels bleeding into grass
   - Transitions appear organic and soft, not hard grid lines
   - No visible artifacts or incorrect blending directions
6. **Verify corner blending**: Find isolated diagonal terrain changes (e.g., single stone tile diagonally adjacent to grass):
   - Corner shows subtle circular blend pattern
   - Blend only appears when both adjacent edges are same terrain
7. **Verify decorations**: Scan map for scattered details:
   - Grass areas: tufts, yellow/purple flowers, clovers
   - Dirt areas: pebbles, twigs, leaves
   - Stone areas: cracks, rubble, mosaic chips
   - Sand areas: shells, ripples
   - Decorations appear on ~15% of tiles
   - No decorations on obstacle tiles
8. **Verify reproducibility**: Note level seed, reload game with same seed:
   - Tile variants appear in identical positions
   - Decorations spawn in same locations
   - Edge blending patterns match exactly
9. **Performance test**: Monitor FPS (browser DevTools > Performance):
   - Map pre-rendering completes in <500ms on level load
   - Viewport rendering maintains 60fps during movement
   - No stuttering when revealing new areas

**Expected behavior:**
- Terrain appears varied and natural, not grid-like or repetitive
- Transitions between terrain types are smooth and organic
- Decorations add visual richness without cluttering the map
- Same level seed produces identical visual appearance
- No visual artifacts (floating pixels, incorrect blends, z-order issues)
- Performance remains smooth (60fps) even with full blending system active

## Related Documentation
- Architecture: CLAUDE.md (canvas layer system, rendering pipeline, coordinate systems)
- Core Systems: `levelGenerator.js` (grid structure, tile assignment), `canvasManager.js` (layer orchestration)
- Rendering: `camera.js` (viewport culling), `fogOfWar.js` (fog overlay system)
