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

    // Decoration image storage
    this.decorationImages = new Map();

    // Track if map has been pre-rendered
    this.isPrerendered = false;

    // Terrain color overrides (optional, per-level theming)
    this.terrainColorOverrides = null;
  }

  /**
   * Set terrain color overrides for per-level theming
   * Must be called BEFORE prerenderMap()
   * @param {Object|null} overrides - Object keyed by terrain type with RGB arrays, or null for defaults
   */
  setTerrainColorOverrides(overrides) {
    this.terrainColorOverrides = overrides;
    // Clear cached tile images so they regenerate with new colors
    this.tileImages.clear();
    this.isPrerendered = false;
  }

  /**
   * Generate procedural tile sprites
   * Creates 4 variants per tile type for visual variety
   */
  generateTileSprites() {
    const defaultColors = {
      ground: [139, 115, 85],
      grass: [127, 170, 101],
      dirt: [155, 118, 83],
      stone: [128, 128, 128],
      sand: [237, 201, 175]
    };

    const tileTypes = ['ground', 'grass', 'dirt', 'stone', 'sand'].map(name => ({
      name,
      baseColor: (this.terrainColorOverrides && this.terrainColorOverrides[name])
        ? this.terrainColorOverrides[name]
        : defaultColors[name]
    }));

    const VARIANT_COUNT = 4;

    tileTypes.forEach(type => {
      for (let variant = 0; variant < VARIANT_COUNT; variant++) {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error(`Failed to create canvas for tile type ${type.name}`);
        }

        // Vary base color slightly per variant
        const colorShift = (variant - 1.5) * 8; // Range: -12 to +12
        const r = Math.min(255, Math.max(0, type.baseColor[0] + colorShift));
        const g = Math.min(255, Math.max(0, type.baseColor[1] + colorShift));
        const b = Math.min(255, Math.max(0, type.baseColor[2] + colorShift));

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);

        // Seeded random for reproducible variants
        const seed = type.name.charCodeAt(0) * 1000 + variant;
        const seededRand = () => {
          const x = Math.sin(seed + seededRand.i++) * 10000;
          return x - Math.floor(x);
        };
        seededRand.i = 0;

        // Add texture - more dots for rougher terrain
        const dotCount = type.name === 'stone' ? 50 : type.name === 'sand' ? 25 : 35;
        for (let i = 0; i < dotCount; i++) {
          const x = Math.floor(seededRand() * this.tileSize);
          const y = Math.floor(seededRand() * this.tileSize);
          const bright = seededRand() > 0.5;
          const alpha = 0.08 + seededRand() * 0.08; // 0.08-0.16

          ctx.fillStyle = bright
            ? `rgba(255, 255, 255, ${alpha})`
            : `rgba(0, 0, 0, ${alpha})`;

          // Vary dot size by terrain
          const dotSize = type.name === 'stone' ? 1 + Math.floor(seededRand() * 3) : 2;
          ctx.fillRect(x, y, dotSize, dotSize);
        }

        // Add terrain-specific details (pass base color for theme-aware detail rendering)
        this.addTerrainDetails(ctx, type.name, seededRand, [r, g, b]);

        this.tileImages.set(`${type.name}_${variant}`, canvas);
      }
    });
  }

  /**
   * Add terrain-specific visual details
   * Colors are derived from the tile's base color so themed terrains look natural
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} terrainType - Type of terrain
   * @param {function} rand - Seeded random function
   * @param {number[]} baseColor - RGB base color of this tile variant
   */
  addTerrainDetails(ctx, terrainType, rand, baseColor) {
    // Derive detail colors from base: darker shade for accents
    const dr = Math.max(0, baseColor[0] - 40);
    const dg = Math.max(0, baseColor[1] - 40);
    const db = Math.max(0, baseColor[2] - 40);
    // Lighter shade for ripple/highlight effects
    const lr = Math.min(255, baseColor[0] + 20);
    const lg = Math.min(255, baseColor[1] + 20);
    const lb = Math.min(255, baseColor[2] + 20);

    switch (terrainType) {
      case 'grass':
        // Small blade/scrub hints in a darker shade of the base
        ctx.fillStyle = `rgba(${dr}, ${dg}, ${db}, 0.3)`;
        for (let i = 0; i < 6; i++) {
          const x = Math.floor(rand() * this.tileSize);
          const y = Math.floor(rand() * this.tileSize);
          ctx.fillRect(x, y, 1, 3);
        }
        break;

      case 'stone':
        // Subtle crack lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 1;
        if (rand() > 0.5) {
          ctx.beginPath();
          ctx.moveTo(rand() * this.tileSize, 0);
          ctx.lineTo(rand() * this.tileSize, this.tileSize);
          ctx.stroke();
        }
        break;

      case 'sand':
        // Wind ripple hints in a lighter shade of the base
        ctx.strokeStyle = `rgba(${lr}, ${lg}, ${lb}, 0.25)`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 2; i++) {
          const y = 10 + rand() * 20;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.quadraticCurveTo(20, y + 3, 40, y);
          ctx.stroke();
        }
        break;

      case 'dirt':
        // Small pebbles in a darker shade of the base
        ctx.fillStyle = `rgba(${dr}, ${dg}, ${db}, 0.25)`;
        for (let i = 0; i < 3; i++) {
          const x = Math.floor(rand() * this.tileSize);
          const y = Math.floor(rand() * this.tileSize);
          ctx.beginPath();
          ctx.arc(x, y, 1 + rand(), 0, Math.PI * 2);
          ctx.fill();
        }
        break;
    }
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
   * Generate decorative overlay sprites
   * Small details scattered on tiles for visual richness
   */
  generateDecorationSprites() {
    const decorations = [
      // Grass decorations
      { name: 'grass_tuft', terrain: ['grass'], draw: this.drawGrassTuft.bind(this) },
      { name: 'flower_yellow', terrain: ['grass'], draw: this.drawFlower.bind(this, '#FFD700', '#FFA500') },
      { name: 'flower_purple', terrain: ['grass'], draw: this.drawFlower.bind(this, '#9370DB', '#6B4E8B') },
      { name: 'clover', terrain: ['grass'], draw: this.drawClover.bind(this) },

      // Dirt/ground decorations
      { name: 'pebbles', terrain: ['dirt', 'ground'], draw: this.drawPebbles.bind(this) },
      { name: 'twig', terrain: ['dirt', 'ground', 'grass'], draw: this.drawTwig.bind(this) },
      { name: 'leaf', terrain: ['dirt', 'ground', 'grass'], draw: this.drawLeaf.bind(this) },

      // Stone decorations
      { name: 'stone_crack', terrain: ['stone'], draw: this.drawStoneCrack.bind(this) },
      { name: 'rubble', terrain: ['stone'], draw: this.drawRubble.bind(this) },

      // Sand decorations
      { name: 'shell', terrain: ['sand'], draw: this.drawShell.bind(this) },
      { name: 'sand_ripple', terrain: ['sand'], draw: this.drawSandRipple.bind(this) },

      // Roman-themed decorations (any terrain)
      { name: 'pottery_shard', terrain: ['dirt', 'ground', 'stone'], draw: this.drawPotteryShard.bind(this) },
      { name: 'mosaic_chip', terrain: ['stone', 'dirt'], draw: this.drawMosaicChip.bind(this) }
    ];

    decorations.forEach(dec => {
      const canvas = document.createElement('canvas');
      canvas.width = this.tileSize;
      canvas.height = this.tileSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error(`Failed to create canvas for decoration ${dec.name}`);
      }

      dec.draw(ctx);
      this.decorationImages.set(dec.name, { canvas, terrain: dec.terrain });
    });
  }

  // Decoration drawing methods
  drawGrassTuft(ctx) {
    ctx.strokeStyle = '#4A7C3F';
    ctx.lineWidth = 1;
    const cx = 20, cy = 25;
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI/2 + (i - 2) * 0.3;
      const len = 8 + Math.random() * 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
      ctx.stroke();
    }
  }

  drawFlower(petalColor, centerColor, ctx) {
    const cx = 20, cy = 20;
    ctx.fillStyle = petalColor;
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle) * 3, cy + Math.sin(angle) * 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = centerColor;
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawClover(ctx) {
    ctx.fillStyle = '#3D6B35';
    const cx = 20, cy = 20;
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 - Math.PI/2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle) * 3, cy + Math.sin(angle) * 3, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#2D5025';
    ctx.fillRect(cx - 1, cy + 2, 2, 5);
  }

  drawPebbles(ctx) {
    const colors = ['#8B8682', '#6B6662', '#9B9692'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = colors[i % colors.length];
      const x = 10 + Math.random() * 20;
      const y = 10 + Math.random() * 20;
      ctx.beginPath();
      ctx.ellipse(x, y, 2 + Math.random() * 2, 1.5 + Math.random(), Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawTwig(ctx) {
    ctx.strokeStyle = '#5D4E37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(12, 25);
    ctx.lineTo(28, 18);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 21);
    ctx.lineTo(23, 16);
    ctx.stroke();
  }

  drawLeaf(ctx) {
    ctx.fillStyle = '#8B6914';
    ctx.beginPath();
    ctx.ellipse(20, 20, 5, 3, Math.PI/6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6B5010';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(15, 20);
    ctx.lineTo(25, 20);
    ctx.stroke();
  }

  drawStoneCrack(ctx) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, 15);
    ctx.lineTo(18, 22);
    ctx.lineTo(15, 28);
    ctx.moveTo(18, 22);
    ctx.lineTo(28, 25);
    ctx.stroke();
  }

  drawRubble(ctx) {
    ctx.fillStyle = '#707070';
    const positions = [[15, 18], [22, 24], [18, 28], [26, 20]];
    positions.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 4, y + 1);
      ctx.lineTo(x + 3, y + 4);
      ctx.lineTo(x - 1, y + 3);
      ctx.closePath();
      ctx.fill();
    });
  }

  drawShell(ctx) {
    ctx.fillStyle = '#E8DCC8';
    ctx.beginPath();
    ctx.arc(20, 20, 4, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#C8B8A0';
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(20, 20, i * 1.2, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
    }
  }

  drawSandRipple(ctx) {
    ctx.strokeStyle = 'rgba(200, 180, 150, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const y = 12 + i * 8;
      ctx.beginPath();
      ctx.moveTo(5, y);
      ctx.quadraticCurveTo(20, y + 2, 35, y);
      ctx.stroke();
    }
  }

  drawPotteryShard(ctx) {
    ctx.fillStyle = '#B85C38';
    ctx.beginPath();
    ctx.moveTo(18, 16);
    ctx.lineTo(26, 18);
    ctx.lineTo(24, 26);
    ctx.lineTo(16, 24);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8B4025';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  drawMosaicChip(ctx) {
    const colors = ['#1E5B8B', '#8B1E1E', '#D4AF37', '#2E5B1E'];
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillRect(17, 17, 6, 6);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(17, 17, 6, 6);
  }

  /**
   * Get decorations appropriate for a terrain type
   * @param {string} terrainType - Type of terrain
   * @returns {Array} Array of decoration names valid for this terrain
   */
  getDecorationsForTerrain(terrainType, excludeList) {
    const valid = [];
    this.decorationImages.forEach((data, name) => {
      if (data.terrain.includes(terrainType) && !(excludeList && excludeList.includes(name))) {
        valid.push(name);
      }
    });
    return valid;
  }

  /**
   * Create a seeded random number generator
   * @param {number} seed - Seed value
   * @returns {function} Random function returning 0-1
   */
  createSeededRandom(seed) {
    let state = seed;
    return () => {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return state / 0x7fffffff;
    };
  }

  /**
   * Get base color for a terrain type
   * @param {string} terrainType - Terrain type name
   * @returns {number[]} RGB array
   */
  getTerrainColor(terrainType) {
    // Check overrides first
    if (this.terrainColorOverrides && this.terrainColorOverrides[terrainType]) {
      return this.terrainColorOverrides[terrainType];
    }

    const colors = {
      ground: [139, 115, 85],
      grass: [127, 170, 101],
      dirt: [155, 118, 83],
      stone: [128, 128, 128],
      sand: [237, 201, 175]
    };
    return colors[terrainType] || colors.grass;
  }

  /**
   * Draw edge blend using scattered pixels for organic transition
   * @param {number} x - Tile pixel X
   * @param {number} y - Tile pixel Y
   * @param {string} direction - Edge direction: 'top', 'bottom', 'left', 'right'
   * @param {number[]} neighborColor - RGB of neighboring terrain
   */
  drawEdgeBlend(x, y, direction, neighborColor) {
    const ctx = this.offscreenContext;
    const size = this.tileSize;
    const blendDepth = Math.floor(size * 0.5);
    const [r, g, b] = neighborColor;

    // Seeded random based on position for consistency
    const seed = x * 1000 + y + direction.charCodeAt(0);
    let randState = seed;
    const rand = () => {
      randState = (randState * 1103515245 + 12345) & 0x7fffffff;
      return randState / 0x7fffffff;
    };

    // Scatter pixels with density decreasing by distance from edge
    const pixelCount = Math.floor(size * blendDepth * 0.3);

    for (let i = 0; i < pixelCount; i++) {
      let px, py, distFromEdge;

      switch (direction) {
        case 'top':
          px = x + rand() * size;
          distFromEdge = rand() * rand() * blendDepth; // Squared distribution = more near edge
          py = y + distFromEdge;
          break;
        case 'bottom':
          px = x + rand() * size;
          distFromEdge = rand() * rand() * blendDepth;
          py = y + size - distFromEdge;
          break;
        case 'left':
          distFromEdge = rand() * rand() * blendDepth;
          px = x + distFromEdge;
          py = y + rand() * size;
          break;
        case 'right':
          distFromEdge = rand() * rand() * blendDepth;
          px = x + size - distFromEdge;
          py = y + rand() * size;
          break;
      }

      // Alpha decreases with distance from edge
      const alpha = 0.7 * (1 - distFromEdge / blendDepth);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;

      // Vary pixel size for texture
      const pixelSize = 1 + Math.floor(rand() * 2);
      ctx.fillRect(Math.floor(px), Math.floor(py), pixelSize, pixelSize);
    }
  }

  /**
   * Draw corner blend using scattered pixels
   * @param {number} x - Tile pixel X
   * @param {number} y - Tile pixel Y
   * @param {string} corner - Corner: 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'
   * @param {number[]} neighborColor - RGB of neighboring terrain
   */
  drawCornerBlend(x, y, corner, neighborColor) {
    const ctx = this.offscreenContext;
    const size = this.tileSize;
    const radius = Math.floor(size * 0.4);
    const [r, g, b] = neighborColor;

    let cx, cy;
    switch (corner) {
      case 'topLeft': cx = x; cy = y; break;
      case 'topRight': cx = x + size; cy = y; break;
      case 'bottomLeft': cx = x; cy = y + size; break;
      case 'bottomRight': cx = x + size; cy = y + size; break;
    }

    // Seeded random based on position
    const seed = cx * 1000 + cy + corner.charCodeAt(0);
    let randState = seed;
    const rand = () => {
      randState = (randState * 1103515245 + 12345) & 0x7fffffff;
      return randState / 0x7fffffff;
    };

    // Scatter pixels in circular pattern
    const pixelCount = Math.floor(radius * radius * 0.4);

    for (let i = 0; i < pixelCount; i++) {
      // Random angle and distance (squared for density near center)
      const angle = rand() * Math.PI * 2;
      const dist = rand() * rand() * radius;

      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;

      // Only draw if within tile bounds
      if (px >= x && px < x + size && py >= y && py < y + size) {
        const alpha = 0.6 * (1 - dist / radius);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;

        const pixelSize = 1 + Math.floor(rand() * 2);
        ctx.fillRect(Math.floor(px), Math.floor(py), pixelSize, pixelSize);
      }
    }
  }

  /**
   * Apply terrain blending for a tile based on its neighbors
   * @param {Array<Array<Object>>} tileMap - Full tile map
   * @param {number} row - Current tile row
   * @param {number} col - Current tile column
   * @param {number} x - Pixel X position
   * @param {number} y - Pixel Y position
   */
  applyTerrainBlending(tileMap, row, col, x, y) {
    const currentType = tileMap[row][col].type;
    const height = tileMap.length;
    const width = tileMap[0].length;

    // Check 4 cardinal neighbors for edge blending
    const neighbors = [
      { dr: -1, dc: 0, dir: 'top' },
      { dr: 1, dc: 0, dir: 'bottom' },
      { dr: 0, dc: -1, dir: 'left' },
      { dr: 0, dc: 1, dir: 'right' }
    ];

    for (const { dr, dc, dir } of neighbors) {
      const nr = row + dr;
      const nc = col + dc;

      if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
        const neighborType = tileMap[nr][nc].type;
        if (neighborType !== currentType) {
          const neighborColor = this.getTerrainColor(neighborType);
          this.drawEdgeBlend(x, y, dir, neighborColor);
        }
      }
    }

    // Check 4 diagonal neighbors for corner blending (only if both adjacent edges are same type)
    const corners = [
      { dr: -1, dc: -1, corner: 'topLeft', adj1: [-1, 0], adj2: [0, -1] },
      { dr: -1, dc: 1, corner: 'topRight', adj1: [-1, 0], adj2: [0, 1] },
      { dr: 1, dc: -1, corner: 'bottomLeft', adj1: [1, 0], adj2: [0, -1] },
      { dr: 1, dc: 1, corner: 'bottomRight', adj1: [1, 0], adj2: [0, 1] }
    ];

    for (const { dr, dc, corner, adj1, adj2 } of corners) {
      const nr = row + dr;
      const nc = col + dc;

      if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
        const neighborType = tileMap[nr][nc].type;

        // Only blend corner if diagonal is different but both adjacent edges are same as current
        if (neighborType !== currentType) {
          const adj1Row = row + adj1[0];
          const adj1Col = col + adj1[1];
          const adj2Row = row + adj2[0];
          const adj2Col = col + adj2[1];

          const adj1Same = adj1Row >= 0 && adj1Row < height && adj1Col >= 0 && adj1Col < width &&
                          tileMap[adj1Row][adj1Col].type === currentType;
          const adj2Same = adj2Row >= 0 && adj2Row < height && adj2Col >= 0 && adj2Col < width &&
                          tileMap[adj2Row][adj2Col].type === currentType;

          // Only draw corner blend if both adjacent tiles are same type (isolated corner case)
          if (adj1Same && adj2Same) {
            const neighborColor = this.getTerrainColor(neighborType);
            this.drawCornerBlend(x, y, corner, neighborColor);
          }
        }
      }
    }
  }

  /**
   * Draw a random decoration appropriate for the terrain
   * @param {string} terrainType - Type of terrain
   * @param {number} x - Pixel X position
   * @param {number} y - Pixel Y position
   * @param {function} rand - Seeded random function
   */
  drawDecoration(terrainType, x, y, rand, excludeDecorations) {
    const validDecorations = this.getDecorationsForTerrain(terrainType, excludeDecorations);
    if (validDecorations.length === 0) return;

    const decorationName = validDecorations[Math.floor(rand() * validDecorations.length)];
    const decorationData = this.decorationImages.get(decorationName);

    if (!decorationData) return;

    // Random offset within tile for natural placement
    const offsetX = Math.floor(rand() * 10) - 5;
    const offsetY = Math.floor(rand() * 10) - 5;

    this.offscreenContext.drawImage(
      decorationData.canvas,
      x + offsetX,
      y + offsetY,
      this.tileSize,
      this.tileSize
    );
  }

  /**
   * Pre-render entire map to offscreen canvas
   * Called once per level load - tiles don't redraw every frame
   * @param {Array<Array<Object>>} tileMap - 2D array of tile data
   */
  prerenderMap(tileMap, options) {
    // Generate sprites if not already created
    if (this.tileImages.size === 0) {
      this.generateTileSprites();
    }
    if (this.obstacleImages.size === 0) {
      this.generateObstacleSprites();
    }
    if (this.decorationImages.size === 0) {
      this.generateDecorationSprites();
    }

    const decorationChance = (options && options.decorationChance !== undefined)
      ? options.decorationChance
      : 0.15;
    const excludeDecorations = (options && options.excludeDecorations) || null;

    // Create seeded random for reproducible decoration placement
    const seed = tileMap.length * tileMap[0].length;
    const seededRand = this.createSeededRandom(seed);

    // Clear offscreen canvas
    this.offscreenContext.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);

    // Render all tiles to offscreen canvas
    for (let row = 0; row < tileMap.length; row++) {
      for (let col = 0; col < tileMap[row].length; col++) {
        const tile = tileMap[row][col];

        // Get tile image based on type and variant
        const variantIndex = tile.spriteIndex || 0;
        const tileKey = `${tile.type}_${variantIndex}`;
        const tileImage = this.tileImages.get(tileKey);
        if (!tileImage) {
          throw new Error(`Tile image for key ${tileKey} not found`);
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

        // Apply edge/corner blending with neighboring terrain types
        this.applyTerrainBlending(tileMap, row, col, x, y);

        // Scatter decorations on some tiles (theme-configurable chance, skip tiles with obstacles)
        if (!tile.obstacle && seededRand() < decorationChance) {
          this.drawDecoration(tile.type, x, y, seededRand, excludeDecorations);
        }

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

        // Get and draw tile image with variant
        const variantIndex = tile.spriteIndex || 0;
        const tileKey = `${tile.type}_${variantIndex}`;
        const tileImage = this.tileImages.get(tileKey);
        if (!tileImage) {
          throw new Error(`Tile image for key ${tileKey} not found`);
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
