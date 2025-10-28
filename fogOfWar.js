/**
 * Fog-of-War System
 *
 * Implements a three-state visibility system for tile-based maps:
 * - UNEXPLORED (0): Never seen, fully opaque fog
 * - EXPLORED (1): Previously visible, semi-transparent fog
 * - VISIBLE (2): Currently in vision range, no fog
 *
 * Uses Uint8Array for memory-efficient storage and pre-calculated
 * visibility offsets for performance.
 */

// Fog state constants
const FogState = {
  UNEXPLORED: 0,  // Black/fully opaque fog
  EXPLORED: 1,    // Gray/semi-transparent (was visible, not currently)
  VISIBLE: 2      // Fully visible (currently in vision radius)
};

class FogOfWar {
  /**
   * Creates a new fog-of-war system
   * @param {number} width - Map width in tiles
   * @param {number} height - Map height in tiles
   * @param {number} tileSize - Tile size in pixels (default: 40)
   * @param {number} revealRadius - Vision radius in pixels (default: 200)
   */
  constructor(width, height, tileSize = 40, revealRadius = 200) {
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.revealRadius = revealRadius;

    // Core data: Uint8Array for memory efficiency (1 byte per tile)
    // Length = width * height, indexed by y * width + x
    this.fogData = new Uint8Array(width * height);

    // Initialize all tiles as UNEXPLORED
    this.fogData.fill(FogState.UNEXPLORED);

    // Pre-calculate visibility circle offsets for performance
    // This is done once at initialization to avoid per-frame calculations
    this.visibilityOffsets = this._calculateVisibilityOffsets();

    // Dirty region tracking for optimized rendering
    // Tracks the minimal rectangular region that changed since last update
    this.dirtyRegion = null;

    // Throttling: track last update position to avoid excessive updates
    this.lastUpdateX = -1;
    this.lastUpdateY = -1;
    this.updateThreshold = 16; // pixels - only update if player moved >16px
  }

  /**
   * Pre-calculates tile offsets within the reveal radius
   * This optimization avoids recalculating which tiles are visible every frame
   * @private
   * @returns {Array<{dx: number, dy: number}>} Array of relative tile offsets
   */
  _calculateVisibilityOffsets() {
    const offsets = [];
    const radiusInTiles = Math.ceil(this.revealRadius / this.tileSize);
    const radiusSquared = this.revealRadius * this.revealRadius;

    // Iterate over all tiles in the square bounding box around the player
    for (let dy = -radiusInTiles; dy <= radiusInTiles; dy++) {
      for (let dx = -radiusInTiles; dx <= radiusInTiles; dx++) {
        // Calculate center-to-center distance in pixels
        const pixelDistSq = (dx * this.tileSize) ** 2 + (dy * this.tileSize) ** 2;

        // Only include tiles within the circular radius
        if (pixelDistSq <= radiusSquared) {
          offsets.push({ dx, dy });
        }
      }
    }

    return offsets;
  }

  /**
   * Updates fog-of-war based on player position
   * Marks tiles within vision radius as VISIBLE, others as EXPLORED if previously seen
   * @param {number} playerX - Player X position in pixels
   * @param {number} playerY - Player Y position in pixels
   * @returns {boolean} True if fog was updated, false if throttled
   */
  updateFog(playerX, playerY) {
    // Throttle updates: only update if player moved >16 pixels since last update
    const dx = playerX - this.lastUpdateX;
    const dy = playerY - this.lastUpdateY;
    const distSq = dx * dx + dy * dy;
    const thresholdSq = this.updateThreshold * this.updateThreshold;

    if (this.lastUpdateX !== -1 && distSq < thresholdSq) {
      // Player hasn't moved far enough - skip update
      return false;
    }

    // Update last position
    this.lastUpdateX = playerX;
    this.lastUpdateY = playerY;

    // Convert player pixel position to tile coordinates
    const centerTileX = Math.floor(playerX / this.tileSize);
    const centerTileY = Math.floor(playerY / this.tileSize);

    // First pass: mark all currently visible tiles as explored
    // This handles tiles that were visible but are no longer in range
    for (let i = 0; i < this.fogData.length; i++) {
      if (this.fogData[i] === FogState.VISIBLE) {
        this.fogData[i] = FogState.EXPLORED;
      }
    }

    // Initialize dirty region bounds
    let minDirtyX = this.width;
    let minDirtyY = this.height;
    let maxDirtyX = 0;
    let maxDirtyY = 0;

    // Second pass: reveal tiles within vision radius using pre-calculated offsets
    for (const offset of this.visibilityOffsets) {
      const tileX = centerTileX + offset.dx;
      const tileY = centerTileY + offset.dy;

      // Bounds check: skip tiles outside map boundaries
      if (tileX < 0 || tileX >= this.width ||
          tileY < 0 || tileY >= this.height) {
        continue;
      }

      // Mark tile as visible using 1D array indexing
      const index = tileY * this.width + tileX;
      this.fogData[index] = FogState.VISIBLE;

      // Track dirty region for optimized rendering
      minDirtyX = Math.min(minDirtyX, tileX);
      minDirtyY = Math.min(minDirtyY, tileY);
      maxDirtyX = Math.max(maxDirtyX, tileX);
      maxDirtyY = Math.max(maxDirtyY, tileY);
    }

    // Store dirty region for renderer to use
    // Null if no tiles were updated
    if (minDirtyX <= maxDirtyX && minDirtyY <= maxDirtyY) {
      this.dirtyRegion = {
        minX: minDirtyX,
        minY: minDirtyY,
        maxX: maxDirtyX,
        maxY: maxDirtyY
      };
    } else {
      this.dirtyRegion = null;
    }

    return true;
  }

  /**
   * Gets the fog state for a specific tile
   * @param {number} tileX - Tile X coordinate
   * @param {number} tileY - Tile Y coordinate
   * @returns {number} Fog state (0=UNEXPLORED, 1=EXPLORED, 2=VISIBLE)
   */
  getFogState(tileX, tileY) {
    // Bounds check
    if (tileX < 0 || tileX >= this.width ||
        tileY < 0 || tileY >= this.height) {
      return FogState.UNEXPLORED;
    }

    const index = tileY * this.width + tileX;
    return this.fogData[index];
  }

  /**
   * Checks if a tile is currently visible
   * @param {number} tileX - Tile X coordinate
   * @param {number} tileY - Tile Y coordinate
   * @returns {boolean} True if tile is visible
   */
  isVisible(tileX, tileY) {
    return this.getFogState(tileX, tileY) === FogState.VISIBLE;
  }

  /**
   * Checks if a tile has been explored (visible or previously visible)
   * @param {number} tileX - Tile X coordinate
   * @param {number} tileY - Tile Y coordinate
   * @returns {boolean} True if tile has been explored
   */
  isExplored(tileX, tileY) {
    const state = this.getFogState(tileX, tileY);
    return state === FogState.EXPLORED || state === FogState.VISIBLE;
  }

  /**
   * Clears all fog data, resetting to UNEXPLORED state
   * Useful for starting a new level
   */
  reset() {
    this.fogData.fill(FogState.UNEXPLORED);
    this.dirtyRegion = null;
    this.lastUpdateX = -1;
    this.lastUpdateY = -1;
  }

  /**
   * Gets the dirty region that needs re-rendering
   * @returns {{minX: number, minY: number, maxX: number, maxY: number}|null}
   */
  getDirtyRegion() {
    return this.dirtyRegion;
  }

  /**
   * Clears the dirty region after rendering
   */
  clearDirtyRegion() {
    this.dirtyRegion = null;
  }

  /**
   * Serializes fog data for save/load
   * @returns {Object} Serializable fog state
   */
  serialize() {
    return {
      width: this.width,
      height: this.height,
      tileSize: this.tileSize,
      revealRadius: this.revealRadius,
      fogData: Array.from(this.fogData) // Convert Uint8Array to regular array
    };
  }

  /**
   * Restores fog data from serialized state
   * @param {Object} data - Serialized fog state
   */
  deserialize(data) {
    if (data.width !== this.width || data.height !== this.height) {
      console.warn('Fog data dimensions mismatch during deserialization');
      return;
    }

    this.fogData = new Uint8Array(data.fogData);
    this.tileSize = data.tileSize;
    this.revealRadius = data.revealRadius;

    // Recalculate visibility offsets if radius changed
    this.visibilityOffsets = this._calculateVisibilityOffsets();
    this.dirtyRegion = null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FogOfWar, FogState };
}
