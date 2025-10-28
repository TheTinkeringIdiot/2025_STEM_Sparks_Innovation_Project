/**
 * Minimap Renderer with Fog Integration
 *
 * Renders a downsampled minimap (150x100px) showing:
 * - Fog-of-war states (unexplored, explored, visible)
 * - Player position (colored dot)
 * - POI markers (if revealed by fog)
 *
 * Uses ImageData API for fast pixel-level rendering and throttles
 * updates to 500ms for performance.
 */

class Minimap {
  /**
   * Creates a minimap renderer
   * @param {number} mapWidthTiles - Full map width in tiles (e.g., 72)
   * @param {number} mapHeightTiles - Full map height in tiles (e.g., 48)
   * @param {number} minimapWidth - Minimap canvas width in pixels (150)
   * @param {number} minimapHeight - Minimap canvas height in pixels (100)
   */
  constructor(mapWidthTiles, mapHeightTiles, minimapWidth = 150, minimapHeight = 100) {
    this.mapWidthTiles = mapWidthTiles;
    this.mapHeightTiles = mapHeightTiles;
    this.minimapWidth = minimapWidth;
    this.minimapHeight = minimapHeight;

    // Calculate scale to fit map into minimap while maintaining aspect ratio
    // Scale is minimap pixels per map tile
    const scaleX = minimapWidth / mapWidthTiles;
    const scaleY = minimapHeight / mapHeightTiles;
    this.scale = Math.min(scaleX, scaleY); // Use smaller scale to fit both dimensions

    // Actual rendered dimensions (may be smaller than minimap canvas to maintain aspect)
    // Round to integers for performance
    this.renderedWidth = Math.round(mapWidthTiles * this.scale);
    this.renderedHeight = Math.round(mapHeightTiles * this.scale);

    // Center the rendered map within the minimap canvas (round for performance)
    this.offsetX = Math.round((minimapWidth - this.renderedWidth) / 2);
    this.offsetY = Math.round((minimapHeight - this.renderedHeight) / 2);

    // Create offscreen canvas for minimap rendering
    this.minimapCanvas = document.createElement('canvas');
    this.minimapCanvas.width = minimapWidth;
    this.minimapCanvas.height = minimapHeight;
    this.minimapCtx = this.minimapCanvas.getContext('2d');

    // Disable image smoothing for crisp pixel art
    this.minimapCtx.imageSmoothingEnabled = false;

    // Create intermediate canvas for fog data at map resolution
    // This will be scaled down to minimap resolution
    this.fogCanvas = document.createElement('canvas');
    this.fogCanvas.width = mapWidthTiles;
    this.fogCanvas.height = mapHeightTiles;
    this.fogCtx = this.fogCanvas.getContext('2d');
    this.fogCtx.imageSmoothingEnabled = false;

    // Throttling: update minimap every 500ms, not every frame
    this.lastUpdateTime = 0;
    this.updateInterval = 500; // milliseconds

    // Cache for POI positions (updated when level changes)
    this.pois = [];

    // Player position cache
    this.playerX = 0;
    this.playerY = 0;
  }

  /**
   * Updates POI positions (call when level changes)
   * @param {Array<{x: number, y: number, revealed: boolean}>} pois - Array of POI positions in tile coordinates
   */
  setPOIs(pois) {
    this.pois = pois || [];
  }

  /**
   * Checks if minimap should update based on throttle interval
   * @param {number} timestamp - Current timestamp in milliseconds
   * @returns {boolean} True if minimap should update
   */
  shouldUpdate(timestamp) {
    if (timestamp - this.lastUpdateTime >= this.updateInterval) {
      this.lastUpdateTime = timestamp;
      return true;
    }
    return false;
  }

  /**
   * Renders the minimap with fog-of-war integration
   * Uses ImageData API for fast pixel-level fog rendering
   * @param {FogOfWar} fog - Fog-of-war instance
   * @param {number} playerTileX - Player X position in tiles
   * @param {number} playerTileY - Player Y position in tiles
   * @param {number} timestamp - Current timestamp for throttling
   */
  update(fog, playerTileX, playerTileY, timestamp) {
    // Throttle updates to 500ms interval
    if (!this.shouldUpdate(timestamp)) {
      return;
    }

    // Cache player position for rendering
    this.playerX = playerTileX;
    this.playerY = playerTileY;

    // Clear minimap canvas
    this.minimapCtx.fillStyle = '#000000';
    this.minimapCtx.fillRect(0, 0, this.minimapWidth, this.minimapHeight);

    // Render fog using ImageData API for performance
    this._renderFog(fog);

    // Render POI markers (only if revealed by fog)
    this._renderPOIs(fog);

    // Render player position
    this._renderPlayer();
  }

  /**
   * Renders fog-of-war states using ImageData API
   * @private
   * @param {FogOfWar} fog - Fog-of-war instance
   */
  _renderFog(fog) {
    const ctx = this.fogCtx;

    // Create ImageData at map resolution (1 pixel per tile)
    const imageData = ctx.createImageData(this.mapWidthTiles, this.mapHeightTiles);
    const data = imageData.data;

    // Iterate through all fog tiles and set pixel colors
    for (let y = 0; y < this.mapHeightTiles; y++) {
      for (let x = 0; x < this.mapWidthTiles; x++) {
        const fogState = fog.getFogState(x, y);
        const pixelIndex = (y * this.mapWidthTiles + x) * 4;

        // Set pixel color based on fog state
        // RGB channels are always black (0, 0, 0)
        // Only alpha channel varies
        data[pixelIndex] = 0;     // R
        data[pixelIndex + 1] = 0; // G
        data[pixelIndex + 2] = 0; // B

        // Alpha channel based on fog state
        if (fogState === 2) { // VISIBLE
          data[pixelIndex + 3] = 0; // Fully transparent
        } else if (fogState === 1) { // EXPLORED
          data[pixelIndex + 3] = 77; // 30% opacity (77/255 ≈ 0.30)
        } else { // UNEXPLORED (0)
          data[pixelIndex + 3] = 230; // 90% opacity (230/255 ≈ 0.90)
        }
      }
    }

    // Put ImageData onto fog canvas at map resolution
    ctx.putImageData(imageData, 0, 0);

    // Scale fog canvas down to minimap resolution
    this.minimapCtx.drawImage(
      this.fogCanvas,
      0, 0, this.mapWidthTiles, this.mapHeightTiles,
      this.offsetX, this.offsetY, this.renderedWidth, this.renderedHeight
    );
  }

  /**
   * Renders POI markers on minimap (only if revealed by fog)
   * @private
   * @param {FogOfWar} fog - Fog-of-war instance
   */
  _renderPOIs(fog) {
    const ctx = this.minimapCtx;

    for (const poi of this.pois) {
      // Only render POI if it has been explored
      const fogState = fog.getFogState(poi.x, poi.y);
      if (fogState === 0) { // UNEXPLORED
        continue;
      }

      // Convert tile coordinates to minimap pixel coordinates (round for performance)
      const minimapX = Math.round(poi.x * this.scale) + this.offsetX;
      const minimapY = Math.round(poi.y * this.scale) + this.offsetY;

      // Draw POI marker as small colored dot (2x2 pixels)
      ctx.fillStyle = '#FFD700'; // Gold color for POIs
      ctx.fillRect(minimapX, minimapY, 2, 2);
    }
  }

  /**
   * Renders player position on minimap
   * @private
   */
  _renderPlayer() {
    const ctx = this.minimapCtx;

    // Convert tile coordinates to minimap pixel coordinates (round for performance)
    const minimapX = Math.round(this.playerX * this.scale) + this.offsetX;
    const minimapY = Math.round(this.playerY * this.scale) + this.offsetY;

    // Draw player as colored dot (3x3 pixels for visibility)
    ctx.fillStyle = '#00FF00'; // Green color for player
    ctx.fillRect(minimapX - 1, minimapY - 1, 3, 3);
  }

  /**
   * Renders the minimap onto the target canvas
   * @param {CanvasRenderingContext2D} targetCtx - Target canvas context (UI layer)
   * @param {number} x - X position on target canvas
   * @param {number} y - Y position on target canvas
   */
  render(targetCtx, x, y) {
    // Draw cached minimap canvas onto target
    targetCtx.drawImage(this.minimapCanvas, x, y);
  }

  /**
   * Gets the minimap canvas element
   * @returns {HTMLCanvasElement} Minimap canvas
   */
  getCanvas() {
    return this.minimapCanvas;
  }

  /**
   * Forces an immediate update (bypasses throttling)
   * Useful for level changes
   * @param {FogOfWar} fog - Fog-of-war instance
   * @param {number} playerTileX - Player X position in tiles
   * @param {number} playerTileY - Player Y position in tiles
   */
  forceUpdate(fog, playerTileX, playerTileY) {
    this.lastUpdateTime = 0; // Reset throttle
    this.update(fog, playerTileX, playerTileY, Date.now());
  }

  /**
   * Resets minimap for new level
   */
  reset() {
    this.pois = [];
    this.playerX = 0;
    this.playerY = 0;
    this.lastUpdateTime = 0;

    // Clear both canvases
    this.minimapCtx.fillStyle = '#000000';
    this.minimapCtx.fillRect(0, 0, this.minimapWidth, this.minimapHeight);
    this.fogCtx.clearRect(0, 0, this.mapWidthTiles, this.mapHeightTiles);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Minimap };
}
