/**
 * Fog Renderer
 *
 * Handles efficient rendering of fog-of-war overlay to a dedicated canvas layer.
 * Only redraws when fog state changes (dirty region optimization).
 *
 * Features:
 * - Renders to fog layer (z-index: 2) below UI layer (z-index: 3)
 * - Dirty rectangle optimization: only redraws changed regions
 * - Viewport culling: only renders tiles within camera view
 * - Batch drawing: groups tiles by fog state to minimize fillStyle changes
 *
 * Fog states:
 * - UNEXPLORED: rgba(0, 0, 0, 0.9) - nearly opaque black
 * - EXPLORED: rgba(0, 0, 0, 0.4) - semi-transparent gray
 * - VISIBLE: no fog drawn (fully transparent)
 */

class FogRenderer {
  /**
   * Creates a new fog renderer
   * @param {HTMLCanvasElement} fogCanvas - The dedicated fog layer canvas (z-index: 2)
   */
  constructor(fogCanvas) {
    this.fogCanvas = fogCanvas;
    this.fogCtx = fogCanvas.getContext('2d');

    if (!this.fogCtx) {
      throw new Error('Failed to get 2D context for fog canvas');
    }

    // Disable image smoothing for pixel-perfect rendering
    this.fogCtx.imageSmoothingEnabled = false;

    // Track whether we need a full redraw (e.g., after level load)
    this.needsFullRedraw = true;
  }

  /**
   * Render fog overlay based on current fog state
   * Uses dirty region optimization if available, otherwise full redraw
   *
   * @param {FogOfWar} fog - Fog-of-war system with state data
   * @param {Camera} camera - Camera for viewport positioning
   */
  renderFog(fog, camera) {
    // Check if fog has dirty region (changed tiles)
    const dirtyRegion = fog.getDirtyRegion();

    if (dirtyRegion && !this.needsFullRedraw) {
      // Optimized: only redraw dirty region
      this._renderDirtyRegion(fog, camera, dirtyRegion);
    } else {
      // Full redraw: initial render or no dirty region tracking
      this._renderFullFog(fog, camera);
      this.needsFullRedraw = false;
    }

    // Clear dirty region after rendering to prevent re-rendering same area
    fog.clearDirtyRegion();
  }

  /**
   * Render only the dirty (changed) region
   * @private
   * @param {FogOfWar} fog - Fog-of-war system
   * @param {Camera} camera - Camera for viewport positioning
   * @param {{minX: number, minY: number, maxX: number, maxY: number}} dirtyRegion - Changed tile region
   */
  _renderDirtyRegion(fog, camera, dirtyRegion) {
    const ctx = this.fogCtx;
    const tileSize = fog.tileSize;

    // Calculate screen coordinates for dirty region (round for performance)
    const startX = Math.round(dirtyRegion.minX * tileSize - camera.worldX);
    const startY = Math.round(dirtyRegion.minY * tileSize - camera.worldY);
    const width = Math.round((dirtyRegion.maxX - dirtyRegion.minX + 1) * tileSize);
    const height = Math.round((dirtyRegion.maxY - dirtyRegion.minY + 1) * tileSize);

    // Clear the dirty region before redrawing
    ctx.clearRect(startX, startY, width, height);

    // Collect tiles by fog state for batched rendering
    const unexploredTiles = [];
    const exploredTiles = [];

    for (let y = dirtyRegion.minY; y <= dirtyRegion.maxY; y++) {
      for (let x = dirtyRegion.minX; x <= dirtyRegion.maxX; x++) {
        // Bounds check: skip tiles outside map
        if (x < 0 || x >= fog.width || y < 0 || y >= fog.height) {
          continue;
        }

        const index = y * fog.width + x;
        const state = fog.fogData[index];

        // Calculate screen position (round for performance)
        const screenX = Math.round(x * tileSize - camera.worldX);
        const screenY = Math.round(y * tileSize - camera.worldY);

        // Viewport culling: skip tiles outside viewport
        if (screenX + tileSize < 0 || screenX > this.fogCanvas.width ||
            screenY + tileSize < 0 || screenY > this.fogCanvas.height) {
          continue;
        }

        // Group tiles by state
        if (state === FogState.UNEXPLORED) {
          unexploredTiles.push({ screenX, screenY });
        } else if (state === FogState.EXPLORED) {
          exploredTiles.push({ screenX, screenY });
        }
        // VISIBLE tiles: no fog drawn
      }
    }

    // Batch draw unexplored tiles (minimize fillStyle changes)
    this._drawTileBatch(ctx, unexploredTiles, 'rgba(0, 0, 0, 0.9)', tileSize);

    // Batch draw explored tiles
    this._drawTileBatch(ctx, exploredTiles, 'rgba(0, 0, 0, 0.4)', tileSize);
  }

  /**
   * Render all fog tiles (full redraw)
   * @private
   * @param {FogOfWar} fog - Fog-of-war system
   * @param {Camera} camera - Camera for viewport positioning
   */
  _renderFullFog(fog, camera) {
    const ctx = this.fogCtx;
    const tileSize = fog.tileSize;

    // Clear entire canvas
    ctx.clearRect(0, 0, this.fogCanvas.width, this.fogCanvas.height);

    // Get visible tile range for viewport culling
    const visibleRange = camera.getVisibleTileRange();

    // Clamp to map bounds
    const startX = Math.max(0, visibleRange.startCol);
    const endX = Math.min(fog.width, visibleRange.endCol);
    const startY = Math.max(0, visibleRange.startRow);
    const endY = Math.min(fog.height, visibleRange.endRow);

    // Collect tiles by fog state for batched rendering
    const unexploredTiles = [];
    const exploredTiles = [];

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const index = y * fog.width + x;
        const state = fog.fogData[index];

        // Calculate screen position (round for performance)
        const screenX = Math.round(x * tileSize - camera.worldX);
        const screenY = Math.round(y * tileSize - camera.worldY);

        // Group tiles by state
        if (state === FogState.UNEXPLORED) {
          unexploredTiles.push({ screenX, screenY });
        } else if (state === FogState.EXPLORED) {
          exploredTiles.push({ screenX, screenY });
        }
        // VISIBLE tiles: no fog drawn
      }
    }

    // Batch draw unexplored tiles (minimize fillStyle changes)
    this._drawTileBatch(ctx, unexploredTiles, 'rgba(0, 0, 0, 0.9)', tileSize);

    // Batch draw explored tiles
    this._drawTileBatch(ctx, exploredTiles, 'rgba(0, 0, 0, 0.4)', tileSize);
  }

  /**
   * Draw a batch of tiles with the same fill style
   * @private
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array<{screenX: number, screenY: number}>} tiles - Tiles to draw
   * @param {string} fillStyle - CSS color for fog
   * @param {number} tileSize - Size of each tile in pixels
   */
  _drawTileBatch(ctx, tiles, fillStyle, tileSize) {
    if (tiles.length === 0) {
      return; // Nothing to draw
    }

    // Set fill style once for entire batch
    ctx.fillStyle = fillStyle;

    // Draw all tiles in batch (coordinates already rounded)
    for (const tile of tiles) {
      ctx.fillRect(tile.screenX, tile.screenY, tileSize, tileSize);
    }
  }

  /**
   * Force a full redraw on next render
   * Call this when loading a new level or resetting fog
   */
  markDirty() {
    this.needsFullRedraw = true;
  }

  /**
   * Clear the entire fog layer
   * Useful for debugging or transitioning between levels
   */
  clear() {
    this.fogCtx.clearRect(0, 0, this.fogCanvas.width, this.fogCanvas.height);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FogRenderer };
}
