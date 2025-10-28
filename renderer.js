/**
 * Tile Renderer with Viewport Culling
 * Pre-renders entire map to offscreen canvas on level load,
 * then composites visible viewport from cached canvas for optimal performance.
 *
 * Tile Types: ground, grass, dirt, stone, sand
 * Obstacles: ruin_column, ruin_wall, tree_cypress, tree_olive, rock_small, rock_large
 */

class TileRenderer {
  constructor(mapWidth, mapHeight, tileSize) {
    this.mapWidth = mapWidth;    // Map width in tiles (72)
    this.mapHeight = mapHeight;  // Map height in tiles (48)
    this.tileSize = tileSize;    // Tile size in pixels (40)

    // Create offscreen canvas for full map pre-rendering
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = mapWidth * tileSize;  // 2880px
    this.offscreenCanvas.height = mapHeight * tileSize; // 1920px

    const context = this.offscreenCanvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to create offscreen canvas context');
    }
    context.imageSmoothingEnabled = false;
    this.offscreenContext = context;

    // Tile image storage (will be populated with generated sprites)
    this.tileImages = new Map();

    // Obstacle image storage
    this.obstacleImages = new Map();

    // Track if map has been pre-rendered
    this.isPrerendered = false;
  }

  /**
   * Generate procedural tile sprites
   * Creates simple colored squares with subtle variations for each tile type
   */
  generateTileSprites() {
    const tileTypes = [
      { name: 'ground', color: '#8B7355' },  // Brown
      { name: 'grass', color: '#7FAA65' },   // Green
      { name: 'dirt', color: '#9B7653' },    // Tan
      { name: 'stone', color: '#808080' },   // Gray
      { name: 'sand', color: '#EDC9AF' }     // Sandy beige
    ];

    tileTypes.forEach(type => {
      const canvas = document.createElement('canvas');
      canvas.width = this.tileSize;
      canvas.height = this.tileSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error(`Failed to create canvas for tile type ${type.name}`);
      }

      // Fill with base color
      ctx.fillStyle = type.color;
      ctx.fillRect(0, 0, this.tileSize, this.tileSize);

      // Add subtle texture variation (noise)
      for (let i = 0; i < 30; i++) {
        const x = Math.floor(Math.random() * this.tileSize);
        const y = Math.floor(Math.random() * this.tileSize);
        const brightness = Math.random() > 0.5 ? 20 : -20;

        ctx.fillStyle = `rgba(${brightness > 0 ? 255 : 0}, ${brightness > 0 ? 255 : 0}, ${brightness > 0 ? 255 : 0}, 0.1)`;
        ctx.fillRect(x, y, 2, 2);
      }

      this.tileImages.set(type.name, canvas);
    });
  }

  /**
   * Generate procedural obstacle sprites
   * Creates simple geometric shapes representing ruins, trees, and rocks
   */
  generateObstacleSprites() {
    const obstacleTypes = [
      { name: 'ruin_column', color: '#D3D3D3', shape: 'column' },
      { name: 'ruin_wall', color: '#C0C0C0', shape: 'wall' },
      { name: 'tree_cypress', color: '#2D5016', shape: 'tree' },
      { name: 'tree_olive', color: '#556B2F', shape: 'tree' },
      { name: 'rock_small', color: '#696969', shape: 'small_rock' },
      { name: 'rock_large', color: '#505050', shape: 'large_rock' }
    ];

    obstacleTypes.forEach(type => {
      const canvas = document.createElement('canvas');
      canvas.width = this.tileSize;
      canvas.height = this.tileSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error(`Failed to create canvas for obstacle type ${type.name}`);
      }

      ctx.fillStyle = type.color;

      // Draw different shapes based on obstacle type
      switch (type.shape) {
        case 'column':
          // Vertical rectangle (column)
          ctx.fillRect(12, 4, 16, 32);
          break;

        case 'wall':
          // Horizontal rectangle (wall section)
          ctx.fillRect(4, 14, 32, 12);
          break;

        case 'tree':
          // Simple tree: trunk + circular foliage
          ctx.fillStyle = '#4A2511'; // Brown trunk
          ctx.fillRect(16, 24, 8, 12);
          ctx.fillStyle = type.color; // Green foliage
          ctx.beginPath();
          ctx.arc(20, 16, 12, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'small_rock':
          // Small circular rock
          ctx.beginPath();
          ctx.arc(20, 20, 8, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'large_rock':
          // Large irregular rock (oval)
          ctx.beginPath();
          ctx.ellipse(20, 20, 14, 10, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
      }

      this.obstacleImages.set(type.name, canvas);
    });
  }

  /**
   * Pre-render entire map to offscreen canvas
   * Called once per level load - tiles don't redraw every frame
   * @param {Array<Array<Object>>} tileMap - 2D array of tile data
   */
  prerenderMap(tileMap) {
    // Generate sprites if not already created
    if (this.tileImages.size === 0) {
      this.generateTileSprites();
    }
    if (this.obstacleImages.size === 0) {
      this.generateObstacleSprites();
    }

    // Clear offscreen canvas
    this.offscreenContext.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);

    // Render all tiles to offscreen canvas
    for (let row = 0; row < tileMap.length; row++) {
      for (let col = 0; col < tileMap[row].length; col++) {
        const tile = tileMap[row][col];

        // Get tile image based on type
        const tileImage = this.tileImages.get(tile.type);
        if (!tileImage) {
          throw new Error(`Tile image for type ${tile.type} not found`);
        }

        // Calculate pixel position
        const x = col * this.tileSize;
        const y = row * this.tileSize;

        // Draw base tile
        this.offscreenContext.drawImage(
          tileImage,
          x,
          y,
          this.tileSize,
          this.tileSize
        );

        // Draw obstacle if present
        if (tile.obstacle) {
          const obstacleImage = this.obstacleImages.get(tile.obstacle);
          if (!obstacleImage) {
            throw new Error(`Obstacle image for type ${tile.obstacle} not found`);
          }

          this.offscreenContext.drawImage(
            obstacleImage,
            x,
            y,
            this.tileSize,
            this.tileSize
          );
        }
      }
    }

    this.isPrerendered = true;
  }

  /**
   * Render visible viewport to background layer
   * Uses viewport culling - only composites visible portion from offscreen canvas
   * @param {CanvasRenderingContext2D} targetContext - Background layer context
   * @param {Camera} camera - Camera instance for viewport positioning
   */
  renderVisible(targetContext, camera) {
    if (!this.isPrerendered) {
      throw new Error('Map must be pre-rendered before calling renderVisible');
    }

    const cameraPos = camera.getPosition();

    // Composite visible portion from offscreen canvas to target
    // Source: offscreen canvas region (camera viewport)
    // Destination: (0, 0) on target canvas (fills viewport)
    targetContext.drawImage(
      this.offscreenCanvas,
      cameraPos.x,                    // Source X (world coordinates)
      cameraPos.y,                    // Source Y (world coordinates)
      camera.viewportWidth,           // Source width
      camera.viewportHeight,          // Source height
      0,                              // Destination X (screen coordinates)
      0,                              // Destination Y (screen coordinates)
      camera.viewportWidth,           // Destination width
      camera.viewportHeight           // Destination height
    );
  }

  /**
   * Alternative rendering method using viewport culling
   * Iterates only through visible tiles - useful if offscreen canvas approach has issues
   * @param {CanvasRenderingContext2D} targetContext - Background layer context
   * @param {Array<Array<Object>>} tileMap - 2D array of tile data
   * @param {Camera} camera - Camera instance for viewport positioning
   */
  renderWithCulling(targetContext, tileMap, camera) {
    const visibleRange = camera.getVisibleTileRange();
    const cameraPos = camera.getPosition();

    // Only iterate through visible tiles
    for (let row = visibleRange.startRow; row < visibleRange.endRow; row++) {
      // Bounds check
      if (row < 0 || row >= this.mapHeight) continue;

      for (let col = visibleRange.startCol; col < visibleRange.endCol; col++) {
        // Bounds check
        if (col < 0 || col >= this.mapWidth) continue;

        const tile = tileMap[row][col];

        // Calculate world position
        const worldX = col * this.tileSize;
        const worldY = row * this.tileSize;

        // Convert to screen coordinates (round to integers for performance)
        const screenX = Math.round(worldX - cameraPos.x);
        const screenY = Math.round(worldY - cameraPos.y);

        // Get and draw tile image
        const tileImage = this.tileImages.get(tile.type);
        if (!tileImage) {
          throw new Error(`Tile image for type ${tile.type} not found`);
        }

        targetContext.drawImage(
          tileImage,
          screenX,
          screenY,
          this.tileSize,
          this.tileSize
        );

        // Draw obstacle if present
        if (tile.obstacle) {
          const obstacleImage = this.obstacleImages.get(tile.obstacle);
          if (!obstacleImage) {
            throw new Error(`Obstacle image for type ${tile.obstacle} not found`);
          }

          targetContext.drawImage(
            obstacleImage,
            screenX,
            screenY,
            this.tileSize,
            this.tileSize
          );
        }
      }
    }
  }

  /**
   * Get offscreen canvas (useful for debugging)
   * @returns {HTMLCanvasElement}
   */
  getOffscreenCanvas() {
    return this.offscreenCanvas;
  }
}
