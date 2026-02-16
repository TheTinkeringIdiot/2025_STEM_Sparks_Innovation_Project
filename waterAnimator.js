/**
 * Water Animator
 * Renders animated water tiles on the entities layer each frame,
 * covering the static pre-rendered water tiles on the background layer.
 * Uses sine waves with per-tile phase offsets for natural flowing appearance.
 */

class WaterAnimator {
  constructor(tileSize) {
    this.tileSize = tileSize;
    this.waterTiles = []; // [{x, y}] in tile coordinates
    this.time = 0;

    // Base water color (matches renderer.js default)
    this.baseColor = [60, 120, 190];
  }

  /**
   * Scan grid and store all water tile positions
   * @param {Array<Array<Object>>} grid - Tile grid from level generator
   */
  setWaterTiles(grid) {
    this.waterTiles = [];
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x].type === 'water') {
          this.waterTiles.push({ x, y });
        }
      }
    }
  }

  /**
   * Set base water color (for themed levels)
   * @param {number[]} rgb - [r, g, b] array
   */
  setBaseColor(rgb) {
    this.baseColor = rgb;
  }

  /**
   * Advance animation time
   * @param {number} deltaTime - Milliseconds since last update
   */
  update(deltaTime) {
    this.time += deltaTime;
  }

  /**
   * Render all visible water tiles with animation
   * Call BEFORE rendering player/POIs on the entities layer
   * @param {CanvasRenderingContext2D} ctx - Entities layer context
   * @param {Camera} camera - Camera for world-to-screen conversion
   */
  render(ctx, camera) {
    if (this.waterTiles.length === 0) return;

    const cameraPos = camera.getPosition();
    const viewW = camera.viewportWidth;
    const viewH = camera.viewportHeight;
    const size = this.tileSize;

    for (const tile of this.waterTiles) {
      const screenX = tile.x * size - cameraPos.x;
      const screenY = tile.y * size - cameraPos.y;

      // Viewport culling
      if (screenX + size < 0 || screenX > viewW ||
          screenY + size < 0 || screenY > viewH) {
        continue;
      }

      this.renderWaterTile(ctx, screenX, screenY, tile.x, tile.y);
    }
  }

  /**
   * Render a single animated water tile
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - Screen X
   * @param {number} y - Screen Y
   * @param {number} tileX - Grid X (for per-tile phase variation)
   * @param {number} tileY - Grid Y (for per-tile phase variation)
   */
  renderWaterTile(ctx, x, y, tileX, tileY) {
    const size = this.tileSize;
    const t = this.time / 1000; // seconds
    const [br, bg, bb] = this.baseColor;

    // Fill with base water color (opaque to cover static background)
    ctx.fillStyle = `rgb(${br}, ${bg}, ${bb})`;
    ctx.fillRect(x, y, size, size);

    // Per-tile phase offset for variation between tiles
    const tilePhase = tileX * 0.7 + tileY * 1.3;

    // Light wave highlights (scroll right)
    const lr = Math.min(255, br + 40);
    const lg = Math.min(255, bg + 50);
    const lb = Math.min(255, bb + 40);
    ctx.strokeStyle = `rgba(${lr}, ${lg}, ${lb}, 0.35)`;
    ctx.lineWidth = 1;

    for (let i = 0; i < 3; i++) {
      const baseY = y + 6 + i * 11;
      ctx.beginPath();
      for (let px = 0; px <= size; px += 2) {
        const wave = Math.sin((px + tilePhase * 10) * 0.15 + t * 2.0 + i * 2.0) * 2;
        if (px === 0) {
          ctx.moveTo(x + px, baseY + wave);
        } else {
          ctx.lineTo(x + px, baseY + wave);
        }
      }
      ctx.stroke();
    }

    // Dark ripple lines (scroll left, slower)
    const dr = Math.max(0, br - 20);
    const dg = Math.max(0, bg - 30);
    const db = Math.max(0, bb - 20);
    ctx.strokeStyle = `rgba(${dr}, ${dg}, ${db}, 0.25)`;

    for (let i = 0; i < 2; i++) {
      const baseY = y + 12 + i * 14;
      ctx.beginPath();
      for (let px = 0; px <= size; px += 2) {
        const wave = Math.sin((px + tilePhase * 8) * 0.12 - t * 1.3 + i * 3.0) * 1.5;
        if (px === 0) {
          ctx.moveTo(x + px, baseY + wave);
        } else {
          ctx.lineTo(x + px, baseY + wave);
        }
      }
      ctx.stroke();
    }

    // Sparkle glints that fade in and out
    const sparkle = Math.sin(t * 3.0 + tilePhase * 2.7);
    if (sparkle > 0.6) {
      const alpha = (sparkle - 0.6) / 0.4 * 0.5;
      const sx = x + ((Math.sin(tilePhase * 3.1) * 0.5 + 0.5) * (size - 4)) + 2;
      const sy = y + ((Math.cos(tilePhase * 5.7) * 0.5 + 0.5) * (size - 4)) + 2;
      ctx.fillStyle = `rgba(200, 230, 255, ${alpha})`;
      ctx.fillRect(sx - 1, sy - 1, 2, 2);
    }
  }
}
