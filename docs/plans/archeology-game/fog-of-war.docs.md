# Fog-of-War Implementation Research

## Summary
Fog-of-war in 2D tile-based Canvas games requires efficient tracking of revealed tiles, circular radius calculations for visibility, and performant rendering of semi-transparent overlays. The key challenges are minimizing redundant calculations during player movement, optimizing Canvas drawing operations, and maintaining smooth performance even with large maps. The most effective approach uses a bit-array for revealed state, pre-calculated circle offsets for visibility checks, and layered Canvas rendering with compositing modes.

## Key Implementation Patterns

### 1. Fog-of-War Data Structure

**Revealed Tiles Tracking**
- **Bit Array / Typed Array**: Use `Uint8Array` or `BitArray` to track revealed state per tile
  - Each element represents a tile's fog state (0 = unexplored, 1 = explored, 2 = visible)
  - Memory efficient: 1 byte per tile vs objects
  - Fast lookup: `fogData[y * mapWidth + x]`

- **Three-State System**:
  ```typescript
  enum FogState {
    UNEXPLORED = 0,  // Black/fully opaque fog
    EXPLORED = 1,     // Gray/semi-transparent (was visible, not currently)
    VISIBLE = 2       // Fully visible (currently in vision radius)
  }
  ```

- **Coordinate Indexing**:
  - 1D array indexed by `index = y * mapWidth + x` for cache efficiency
  - Faster than 2D arrays or Map structures
  - Compact memory layout benefits CPU cache

**Example Structure**:
```typescript
interface FogOfWar {
  width: number;
  height: number;
  tileSize: number;
  revealRadius: number; // in pixels (200)

  // Core data
  fogData: Uint8Array; // length = width * height

  // Cached visibility circle (optimization)
  visibilityOffsets: Array<{dx: number, dy: number}>;

  // Dirty region tracking (optimization)
  dirtyRegion: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } | null;
}
```

### 2. Circular Reveal Algorithm

**Pre-calculated Circle Offsets** (Performance Critical)
- Calculate tile offsets within reveal radius once at initialization
- Store as array of `{dx, dy}` relative coordinates
- Reuse on every player movement

```typescript
function calculateVisibilityOffsets(
  radiusInPixels: number,
  tileSize: number
): Array<{dx: number, dy: number}> {
  const offsets: Array<{dx: number, dy: number}> = [];
  const radiusInTiles = Math.ceil(radiusInPixels / tileSize);
  const radiusSquared = radiusInPixels * radiusInPixels;

  for (let dy = -radiusInTiles; dy <= radiusInTiles; dy++) {
    for (let dx = -radiusInTiles; dx <= radiusInTiles; dx++) {
      // Calculate center-to-center distance in pixels
      const pixelDistSq =
        (dx * tileSize) ** 2 + (dy * tileSize) ** 2;

      if (pixelDistSq <= radiusSquared) {
        offsets.push({dx, dy});
      }
    }
  }

  return offsets;
}
```

**Revealing Tiles on Player Movement**:
```typescript
function updateFogOfWar(
  fog: FogOfWar,
  playerX: number,
  playerY: number
): void {
  const centerTileX = Math.floor(playerX / fog.tileSize);
  const centerTileY = Math.floor(playerY / fog.tileSize);

  // First pass: mark all tiles as not currently visible
  for (let i = 0; i < fog.fogData.length; i++) {
    if (fog.fogData[i] === FogState.VISIBLE) {
      fog.fogData[i] = FogState.EXPLORED;
    }
  }

  // Second pass: reveal tiles within radius
  let minDirtyX = fog.width;
  let minDirtyY = fog.height;
  let maxDirtyX = 0;
  let maxDirtyY = 0;

  for (const offset of fog.visibilityOffsets) {
    const tileX = centerTileX + offset.dx;
    const tileY = centerTileY + offset.dy;

    // Bounds check
    if (tileX < 0 || tileX >= fog.width ||
        tileY < 0 || tileY >= fog.height) {
      continue;
    }

    const index = tileY * fog.width + tileX;
    fog.fogData[index] = FogState.VISIBLE;

    // Track dirty region
    minDirtyX = Math.min(minDirtyX, tileX);
    minDirtyY = Math.min(minDirtyY, tileY);
    maxDirtyX = Math.max(maxDirtyX, tileX);
    maxDirtyY = Math.max(maxDirtyY, tileY);
  }

  // Store dirty region for optimized rendering
  fog.dirtyRegion = {
    minX: minDirtyX,
    minY: minDirtyY,
    maxX: maxDirtyX,
    maxY: maxDirtyY
  };
}
```

### 3. Canvas Rendering Pattern for Fog Overlay

**Layered Rendering Approach**:
- Render fog on separate offscreen Canvas for composition flexibility
- Use `globalCompositeOperation` for efficient blending
- Only redraw changed regions (dirty rectangle optimization)

**Fog Canvas Layer**:
```typescript
class FogRenderer {
  private fogCanvas: HTMLCanvasElement;
  private fogCtx: CanvasRenderingContext2D;

  constructor(width: number, height: number) {
    this.fogCanvas = document.createElement('canvas');
    this.fogCanvas.width = width;
    this.fogCanvas.height = height;
    this.fogCtx = this.fogCanvas.getContext('2d')!;
  }

  renderFog(fog: FogOfWar, camera: {x: number, y: number}): void {
    const ctx = this.fogCtx;

    // Optimization: only redraw dirty region if available
    if (fog.dirtyRegion) {
      const region = fog.dirtyRegion;
      const startX = region.minX * fog.tileSize - camera.x;
      const startY = region.minY * fog.tileSize - camera.y;
      const width = (region.maxX - region.minX + 1) * fog.tileSize;
      const height = (region.maxY - region.minY + 1) * fog.tileSize;

      ctx.clearRect(startX, startY, width, height);

      for (let y = region.minY; y <= region.maxY; y++) {
        for (let x = region.minX; x <= region.maxX; x++) {
          this.drawFogTile(fog, x, y, camera);
        }
      }
    } else {
      // Full redraw
      ctx.clearRect(0, 0, this.fogCanvas.width, this.fogCanvas.height);

      for (let y = 0; y < fog.height; y++) {
        for (let x = 0; x < fog.width; x++) {
          this.drawFogTile(fog, x, y, camera);
        }
      }
    }
  }

  private drawFogTile(
    fog: FogOfWar,
    tileX: number,
    tileY: number,
    camera: {x: number, y: number}
  ): void {
    const index = tileY * fog.width + tileX;
    const state = fog.fogData[index];

    if (state === FogState.VISIBLE) {
      return; // No fog to draw
    }

    const ctx = this.fogCtx;
    const screenX = tileX * fog.tileSize - camera.x;
    const screenY = tileY * fog.tileSize - camera.y;

    if (state === FogState.UNEXPLORED) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; // Nearly opaque black
    } else { // EXPLORED
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // Semi-transparent gray
    }

    ctx.fillRect(screenX, screenY, fog.tileSize, fog.tileSize);
  }

  // Composite fog onto main canvas
  composite(mainCtx: CanvasRenderingContext2D): void {
    mainCtx.drawImage(this.fogCanvas, 0, 0);
  }
}
```

**Alternative: Single-Pass with Compositing**:
```typescript
function renderFogComposite(
  ctx: CanvasRenderingContext2D,
  fog: FogOfWar,
  camera: {x: number, y: number}
): void {
  // Save state
  ctx.save();

  // Option 1: Draw fog with multiply blend mode
  ctx.globalCompositeOperation = 'multiply';

  // Option 2: Draw fog with source-over (default)
  // ctx.globalCompositeOperation = 'source-over';

  for (let y = 0; y < fog.height; y++) {
    for (let x = 0; x < fog.width; x++) {
      const index = y * fog.width + x;
      const state = fog.fogData[index];

      if (state === FogState.VISIBLE) continue;

      const screenX = x * fog.tileSize - camera.x;
      const screenY = y * fog.tileSize - camera.y;

      // Viewport culling
      if (screenX + fog.tileSize < 0 || screenX > ctx.canvas.width ||
          screenY + fog.tileSize < 0 || screenY > ctx.canvas.height) {
        continue;
      }

      ctx.fillStyle = state === FogState.UNEXPLORED
        ? 'rgba(0, 0, 0, 0.9)'
        : 'rgba(0, 0, 0, 0.4)';

      ctx.fillRect(screenX, screenY, fog.tileSize, fog.tileSize);
    }
  }

  ctx.restore();
}
```

**Gradient Fog Effects** (Advanced):
```typescript
function renderSmoothFog(
  ctx: CanvasRenderingContext2D,
  playerX: number,
  playerY: number,
  radius: number
): void {
  const gradient = ctx.createRadialGradient(
    playerX, playerY, 0,
    playerX, playerY, radius
  );

  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');     // Transparent center
  gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.2)'); // Gradual fade
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');   // Opaque edge

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
```

### 4. Performance Optimization Techniques

**Dirty Rectangle Tracking**:
- Only redraw regions that changed (area around player movement)
- Track min/max bounds of affected tiles
- Reduces draw calls from 10,000+ to ~100-400 per frame

**Viewport Culling**:
```typescript
function getVisibleTileRange(
  camera: {x: number, y: number},
  viewportWidth: number,
  viewportHeight: number,
  tileSize: number
): {startX: number, startY: number, endX: number, endY: number} {
  return {
    startX: Math.max(0, Math.floor(camera.x / tileSize)),
    startY: Math.max(0, Math.floor(camera.y / tileSize)),
    endX: Math.ceil((camera.x + viewportWidth) / tileSize),
    endY: Math.ceil((camera.y + viewportHeight) / tileSize)
  };
}
```

**Offscreen Canvas Caching**:
- Pre-render fog layer to offscreen canvas
- Only update offscreen canvas when fog changes
- Composite cached fog onto main canvas each frame
- Trades memory for reduced CPU usage

**RequestAnimationFrame Optimization**:
```typescript
class FogUpdateScheduler {
  private pendingUpdate: boolean = false;

  scheduleFogUpdate(fog: FogOfWar, playerX: number, playerY: number): void {
    if (this.pendingUpdate) return;

    this.pendingUpdate = true;
    requestAnimationFrame(() => {
      updateFogOfWar(fog, playerX, playerY);
      this.pendingUpdate = false;
    });
  }
}
```

**Throttling Player Movement Updates**:
```typescript
class FogUpdateThrottler {
  private lastUpdateX: number = -1;
  private lastUpdateY: number = -1;
  private updateThreshold: number = 16; // pixels

  shouldUpdate(playerX: number, playerY: number): boolean {
    const dx = playerX - this.lastUpdateX;
    const dy = playerY - this.lastUpdateY;
    const distSq = dx * dx + dy * dy;

    if (distSq >= this.updateThreshold * this.updateThreshold) {
      this.lastUpdateX = playerX;
      this.lastUpdateY = playerY;
      return true;
    }

    return false;
  }
}
```

**Batch Drawing Operations**:
```typescript
function renderFogBatched(
  ctx: CanvasRenderingContext2D,
  fog: FogOfWar,
  camera: {x: number, y: number}
): void {
  // Group tiles by fog state to minimize fillStyle changes
  const unexploredTiles: Array<{x: number, y: number}> = [];
  const exploredTiles: Array<{x: number, y: number}> = [];

  for (let y = 0; y < fog.height; y++) {
    for (let x = 0; x < fog.width; x++) {
      const index = y * fog.width + x;
      const state = fog.fogData[index];

      if (state === FogState.UNEXPLORED) {
        unexploredTiles.push({x, y});
      } else if (state === FogState.EXPLORED) {
        exploredTiles.push({x, y});
      }
    }
  }

  // Batch draw unexplored
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  for (const tile of unexploredTiles) {
    ctx.fillRect(
      tile.x * fog.tileSize - camera.x,
      tile.y * fog.tileSize - camera.y,
      fog.tileSize,
      fog.tileSize
    );
  }

  // Batch draw explored
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  for (const tile of exploredTiles) {
    ctx.fillRect(
      tile.x * fog.tileSize - camera.x,
      tile.y * fog.tileSize - camera.y,
      fog.tileSize,
      fog.tileSize
    );
  }
}
```

**Web Worker for Fog Calculations** (Advanced):
- Offload fog state updates to Web Worker
- Main thread only handles rendering
- Transfer fog data via `Transferable` objects
- Useful for very large maps (1000x1000+)

### 5. Minimap Integration Approach

**Minimap Fog Rendering**:
```typescript
class MinimapRenderer {
  private minimapCanvas: HTMLCanvasElement;
  private minimapCtx: CanvasRenderingContext2D;
  private scale: number; // e.g., 0.1 for 10x zoom out

  constructor(
    minimapWidth: number,
    minimapHeight: number,
    scale: number
  ) {
    this.minimapCanvas = document.createElement('canvas');
    this.minimapCanvas.width = minimapWidth;
    this.minimapCanvas.height = minimapHeight;
    this.minimapCtx = this.minimapCanvas.getContext('2d')!;
    this.scale = scale;
  }

  renderMinimapFog(fog: FogOfWar): void {
    const ctx = this.minimapCtx;

    // Option 1: Downsample fog data (faster)
    const pixelSize = Math.max(1, fog.tileSize * this.scale);

    for (let y = 0; y < fog.height; y++) {
      for (let x = 0; x < fog.width; x++) {
        const index = y * fog.width + x;
        const state = fog.fogData[index];

        if (state === FogState.VISIBLE) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0)'; // Transparent
        } else if (state === FogState.EXPLORED) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; // Light fog
        } else {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; // Dark fog
        }

        ctx.fillRect(
          x * pixelSize,
          y * pixelSize,
          Math.ceil(pixelSize),
          Math.ceil(pixelSize)
        );
      }
    }

    // Option 2: Use ImageData for ultra-fast pixel manipulation
    this.renderMinimapFogImageData(fog);
  }

  private renderMinimapFogImageData(fog: FogOfWar): void {
    const ctx = this.minimapCtx;
    const imageData = ctx.createImageData(fog.width, fog.height);
    const data = imageData.data;

    for (let i = 0; i < fog.fogData.length; i++) {
      const state = fog.fogData[i];
      const pixelIndex = i * 4;

      if (state === FogState.VISIBLE) {
        data[pixelIndex + 3] = 0; // Fully transparent
      } else if (state === FogState.EXPLORED) {
        data[pixelIndex] = 0;     // R
        data[pixelIndex + 1] = 0; // G
        data[pixelIndex + 2] = 0; // B
        data[pixelIndex + 3] = 77; // A (30% opacity)
      } else { // UNEXPLORED
        data[pixelIndex] = 0;
        data[pixelIndex + 1] = 0;
        data[pixelIndex + 2] = 0;
        data[pixelIndex + 3] = 230; // A (90% opacity)
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Scale to minimap size if needed
    if (this.scale !== 1) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = fog.width;
      tempCanvas.height = fog.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.putImageData(imageData, 0, 0);

      ctx.clearRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);
      ctx.drawImage(
        tempCanvas,
        0, 0, fog.width, fog.height,
        0, 0,
        fog.width * this.scale,
        fog.height * this.scale
      );
    }
  }

  // Composite minimap onto main UI
  render(
    targetCtx: CanvasRenderingContext2D,
    x: number,
    y: number
  ): void {
    targetCtx.drawImage(this.minimapCanvas, x, y);
  }
}
```

**Minimap Update Strategy**:
- Update minimap fog less frequently than main view (e.g., every 500ms)
- Use lower resolution representation
- Cache minimap rendering between updates

```typescript
class MinimapFogCache {
  private lastUpdate: number = 0;
  private updateInterval: number = 500; // ms
  private cachedCanvas: HTMLCanvasElement;

  shouldUpdate(timestamp: number): boolean {
    if (timestamp - this.lastUpdate >= this.updateInterval) {
      this.lastUpdate = timestamp;
      return true;
    }
    return false;
  }
}
```

## Considerations

### Performance Gotchas

- **Avoid fillRect per tile on large maps**: For maps larger than 100x100, use ImageData API or offscreen canvas caching
- **Cache visibility circle offsets**: Calculating circle tiles every frame kills performance. Pre-calculate once.
- **Viewport culling is mandatory**: Never iterate all tiles if they're not visible on screen
- **Watch for fillStyle churn**: Changing fillStyle is expensive. Batch tiles by color/opacity.
- **Memory vs CPU trade-off**: Offscreen canvas caching uses more memory but dramatically reduces CPU for static fog

### Edge Cases

- **Player at map boundaries**: Visibility circle must handle out-of-bounds tiles gracefully
- **Tile size changes**: If supporting dynamic zoom, recalculate visibility offsets
- **Fog persistence**: Consider serializing fogData to localStorage for save/load
- **Multiplayer**: Fog state is per-player, not global
- **Fast movement**: Large jumps (teleport) may need full fog recalculation instead of dirty regions

### Browser Compatibility

- `Uint8Array` supported in all modern browsers
- `OffscreenCanvas` not available in Safari (use regular Canvas instead)
- `globalCompositeOperation` performance varies by browser
- Hardware acceleration helps significantly (ensure Canvas isn't too large)

### Memory Usage

- Fog data: `mapWidth * mapHeight * 1 byte` (e.g., 10KB for 100x100 map)
- Offscreen fog canvas: `canvasWidth * canvasHeight * 4 bytes` (RGBA)
- For 800x600 canvas: ~1.9MB per cached fog layer
- Use multiple small canvases instead of one huge canvas for better GPU usage

### Rendering Order

Typical frame rendering order:
1. Clear main canvas
2. Render base map tiles (only visible viewport)
3. Render entities (player, objects)
4. Render fog overlay (this darkens unseen areas)
5. Render UI elements (minimap, HUD)

### Alternative Approach: Lightmask

Instead of drawing dark fog, draw light:
```typescript
function renderLightmask(
  ctx: CanvasRenderingContext2D,
  playerX: number,
  playerY: number,
  radius: number
): void {
  // Fill entire canvas with black
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Cut out light circle using destination-out
  ctx.globalCompositeOperation = 'destination-out';

  const gradient = ctx.createRadialGradient(
    playerX, playerY, 0,
    playerX, playerY, radius
  );
  gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(
    playerX - radius,
    playerY - radius,
    radius * 2,
    radius * 2
  );

  ctx.globalCompositeOperation = 'source-over';
}
```

## Next Steps

### Recommended Implementation Order

1. **Start simple**: Implement basic three-state fog system with Uint8Array
2. **Add circular reveal**: Pre-calculate visibility offsets for 200px radius
3. **Implement rendering**: Start with simple fillRect approach, optimize later
4. **Add viewport culling**: Only render fog tiles visible on screen
5. **Optimize with dirty rectangles**: Track changed regions to minimize redraws
6. **Implement minimap**: Use ImageData API for fast pixel-level fog rendering
7. **Advanced optimizations**: Offscreen canvas caching, Web Workers if needed

### Suggested Architecture

```typescript
// Core fog system
class FogOfWarSystem {
  private fog: FogOfWar;
  private renderer: FogRenderer;
  private minimapRenderer: MinimapRenderer;
  private throttler: FogUpdateThrottler;

  update(playerX: number, playerY: number): void {
    if (this.throttler.shouldUpdate(playerX, playerY)) {
      updateFogOfWar(this.fog, playerX, playerY);
    }
  }

  render(ctx: CanvasRenderingContext2D, camera: {x: number, y: number}): void {
    this.renderer.renderFog(this.fog, camera);
    this.renderer.composite(ctx);
  }

  renderMinimap(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    this.minimapRenderer.renderMinimapFog(this.fog);
    this.minimapRenderer.render(ctx, x, y);
  }
}
```

### Testing Strategy

- Test with various map sizes: 50x50, 100x100, 500x500
- Measure FPS with/without optimizations
- Test edge cases: player at corners, fast movement
- Verify memory usage doesn't grow over time
- Test minimap updates at different scales

### Performance Targets

- 60 FPS on maps up to 200x200 tiles
- Fog update in <5ms per frame
- Minimap update in <10ms (can be throttled)
- Memory usage under 10MB for fog system

### References

- Canvas performance: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- ImageData API: https://developer.mozilla.org/en-US/docs/Web/API/ImageData
- Composite operations: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
- Typed arrays: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays
