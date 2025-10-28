/**
 * Camera system for archeology game
 * Handles viewport transformation and coordinate conversion
 *
 * Viewport: 1440x960px (36x24 tiles at 40px/tile)
 * World: 2880x1920px (72x48 tiles at 40px/tile)
 */
class Camera {
  constructor() {
    // Viewport dimensions (what player sees on screen)
    this.viewportWidth = 1440;
    this.viewportHeight = 960;

    // World dimensions in pixels
    this.worldWidth = 2880;  // 72 tiles * 40px
    this.worldHeight = 1920; // 48 tiles * 40px

    // Tile size constant
    this.tileSize = 40;

    // Camera position in world coordinates (top-left corner of viewport)
    this.worldX = 0;
    this.worldY = 0;
  }

  /**
   * Center camera on a world position
   * @param {number} worldX - X coordinate in world space
   * @param {number} worldY - Y coordinate in world space
   */
  centerOn(worldX, worldY) {
    // Calculate top-left corner position to center viewport on target
    this.worldX = worldX - this.viewportWidth / 2;
    this.worldY = worldY - this.viewportHeight / 2;

    // Ensure camera stays within world bounds
    this.clampToWorld();
  }

  /**
   * Clamp camera position to world bounds
   * Prevents camera from showing out-of-bounds areas
   * @private
   */
  clampToWorld() {
    // Clamp X axis
    this.worldX = Math.max(0, Math.min(
      this.worldWidth - this.viewportWidth,
      this.worldX
    ));

    // Clamp Y axis
    this.worldY = Math.max(0, Math.min(
      this.worldHeight - this.viewportHeight,
      this.worldY
    ));

    // Round to whole pixels to avoid sub-pixel rendering artifacts
    this.worldX = Math.round(this.worldX);
    this.worldY = Math.round(this.worldY);
  }

  /**
   * Convert world coordinates to screen coordinates
   * @param {number} worldX - X coordinate in world space
   * @param {number} worldY - Y coordinate in world space
   * @returns {{x: number, y: number}} Screen coordinates
   */
  worldToScreen(worldX, worldY) {
    return {
      x: Math.round(worldX - this.worldX),
      y: Math.round(worldY - this.worldY)
    };
  }

  /**
   * Convert screen coordinates to world coordinates
   * @param {number} screenX - X coordinate in screen space
   * @param {number} screenY - Y coordinate in screen space
   * @returns {{x: number, y: number}} World coordinates
   */
  screenToWorld(screenX, screenY) {
    return {
      x: Math.round(screenX + this.worldX),
      y: Math.round(screenY + this.worldY)
    };
  }

  /**
   * Get visible tile range for viewport culling
   * @returns {{startCol: number, endCol: number, startRow: number, endRow: number}}
   */
  getVisibleTileRange() {
    return {
      startCol: Math.floor(this.worldX / this.tileSize),
      endCol: Math.ceil((this.worldX + this.viewportWidth) / this.tileSize),
      startRow: Math.floor(this.worldY / this.tileSize),
      endRow: Math.ceil((this.worldY + this.viewportHeight) / this.tileSize)
    };
  }

  /**
   * Get current camera position in world coordinates
   * @returns {{x: number, y: number}} Camera position (top-left corner)
   */
  getPosition() {
    return {
      x: this.worldX,
      y: this.worldY
    };
  }
}
