/**
 * Procedural Sprite Sheet Generator
 *
 * Generates a 200x240px sprite sheet for the archeology game character.
 * Layout: 5 columns × 6 rows, 40x40px per frame
 * Uses symmetry-based generation with color palette and black outline.
 *
 * @returns {HTMLCanvasElement} Canvas containing the complete sprite sheet
 */

/**
 * Simple seeded random number generator (Mulberry32)
 * @param {number} seed - Seed value
 * @returns {function(): number} Random function returning value between 0 and 1
 */
function createSeededRandom(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Color palettes for character sprites
 */
const COLOR_PALETTES = {
  archeologist: [
    '#000000', // Black (outline)
    '#8B4513', // Brown (clothes)
    '#D2691E', // Light brown (skin)
    '#F5DEB3', // Wheat (lighter clothes)
    '#A0522D'  // Sienna (boots/details)
  ],
  default: [
    '#000000', // Black (outline)
    '#4A4A4A', // Dark gray (main body)
    '#6B6B6B', // Medium gray
    '#8C8C8C', // Light gray
    '#A0A0A0'  // Lighter gray
  ]
};

/**
 * Generate a single symmetrical sprite frame
 * @param {number} frameSize - Size of the frame (40px)
 * @param {string[]} palette - Color palette to use
 * @param {function} random - Seeded random function
 * @param {object} options - Generation options
 * @returns {ImageData} Generated sprite frame
 */
function generateSymmetricalFrame(frameSize, palette, random, options = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = frameSize;
  canvas.height = frameSize;

  const imageData = ctx.createImageData(frameSize, frameSize);
  const data = imageData.data;

  // Character body should be 8-10px within 40x40px frame (rest is padding)
  const bodySize = options.bodySize || 10;
  const startX = Math.floor((frameSize - bodySize) / 2);
  const startY = Math.floor((frameSize - bodySize) / 2);
  const halfWidth = Math.floor(bodySize / 2);

  // Generate half of the sprite
  const halfMask = [];
  for (let y = 0; y < bodySize; y++) {
    for (let x = 0; x < halfWidth; x++) {
      // Create a simple humanoid shape
      const normalizedY = y / bodySize;
      const normalizedX = x / halfWidth;

      let shouldDraw = false;

      // Head (top 30%)
      if (normalizedY < 0.3) {
        shouldDraw = normalizedX < 0.8;
      }
      // Body (middle 40%)
      else if (normalizedY < 0.7) {
        shouldDraw = normalizedX < 0.9;
      }
      // Legs (bottom 30%)
      else {
        // Create two legs with animation variation
        const legOffset = options.legOffset || 0;
        const legPos = (y + legOffset) % 3;
        shouldDraw = (normalizedX < 0.6 && legPos < 2) || (normalizedX >= 0.6 && normalizedX < 0.9);
      }

      // Add some randomness
      if (shouldDraw && random() > 0.7) {
        shouldDraw = false;
      }

      halfMask.push(shouldDraw);
    }
  }

  // Mirror and draw the sprite
  for (let y = 0; y < bodySize; y++) {
    for (let x = 0; x < bodySize; x++) {
      const centerX = Math.floor(bodySize / 2);
      const mirrorX = x < centerX ? x : (bodySize - 1 - x);
      const maskIndex = y * halfWidth + mirrorX;

      if (halfMask[maskIndex]) {
        const pixelX = startX + x;
        const pixelY = startY + y;
        const index = (pixelY * frameSize + pixelX) * 4;

        // Choose color from palette (skip black outline color)
        const colorIndex = 1 + Math.floor(random() * (palette.length - 1));
        const color = palette[colorIndex];
        const rgb = hexToRgb(color);

        data[index] = rgb.r;
        data[index + 1] = rgb.g;
        data[index + 2] = rgb.b;
        data[index + 3] = 255;
      }
    }
  }

  // Apply black outline
  const outlined = applyOutline(imageData, frameSize, palette[0]);

  return outlined;
}

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color string
 * @returns {{r: number, g: number, b: number}} RGB values
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

/**
 * Apply black outline to sprite
 * @param {ImageData} imageData - Source image data
 * @param {number} size - Frame size
 * @param {string} outlineColor - Outline color (hex)
 * @returns {ImageData} Image data with outline
 */
function applyOutline(imageData, size, outlineColor) {
  const data = imageData.data;
  const outlined = new Uint8ClampedArray(data);
  const outline = hexToRgb(outlineColor);

  // For each pixel, if it's empty but has a non-empty neighbor, make it outline
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;

      // Skip if already filled
      if (data[index + 3] > 0) continue;

      // Check 4-directional neighbors
      let hasFilledNeighbor = false;
      const neighbors = [
        [x - 1, y], [x + 1, y],
        [x, y - 1], [x, y + 1]
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          const nIndex = (ny * size + nx) * 4;
          if (data[nIndex + 3] > 0) {
            hasFilledNeighbor = true;
            break;
          }
        }
      }

      if (hasFilledNeighbor) {
        outlined[index] = outline.r;
        outlined[index + 1] = outline.g;
        outlined[index + 2] = outline.b;
        outlined[index + 3] = 255;
      }
    }
  }

  return new ImageData(outlined, size, size);
}

/**
 * Generate a walk animation frame with leg variation
 * @param {number} frameSize - Size of the frame
 * @param {string[]} palette - Color palette
 * @param {function} random - Seeded random function
 * @param {number} walkFrame - Walk frame number (0-3)
 * @param {string} direction - Direction (up, down, left, right)
 * @returns {ImageData} Generated frame
 */
function generateWalkFrame(frameSize, palette, random, walkFrame, direction) {
  // Vary leg offset based on walk frame
  const legOffset = walkFrame;
  return generateSymmetricalFrame(frameSize, palette, random, {
    bodySize: 10,
    legOffset: legOffset
  });
}

/**
 * Generate a tool animation frame
 * @param {number} frameSize - Size of the frame
 * @param {string[]} palette - Color palette
 * @param {function} random - Seeded random function
 * @param {string} tool - Tool name
 * @param {number} frame - Animation frame number
 * @returns {ImageData} Generated frame
 */
function generateToolFrame(frameSize, palette, random, tool, frame) {
  // Base character sprite
  const baseFrame = generateSymmetricalFrame(frameSize, palette, random, { bodySize: 10 });

  // Add tool overlay (simplified - just add some pixels to represent tool)
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = frameSize;
  canvas.height = frameSize;

  ctx.putImageData(baseFrame, 0, 0);

  // Draw a simple tool representation
  ctx.fillStyle = '#8B4513'; // Brown for tool
  const centerX = frameSize / 2;
  const centerY = frameSize / 2;

  // Tool position varies by animation frame
  const offset = frame * 2;

  switch (tool) {
    case 'dig':
      // Shovel motion
      ctx.fillRect(centerX + 3 + offset, centerY + 5, 2, 6);
      break;
    case 'pickaxe':
      // Pickaxe swing
      ctx.fillRect(centerX + 4, centerY + 3 + offset, 5, 2);
      break;
    case 'brush':
      // Brush motion
      ctx.fillRect(centerX + 2, centerY + 4 + offset, 3, 2);
      break;
    case 'chisel':
      // Chisel tap
      ctx.fillRect(centerX + 3, centerY + 4, 2, 4 + offset);
      break;
  }

  return ctx.getImageData(0, 0, frameSize, frameSize);
}

/**
 * Generate complete sprite sheet
 * @param {number} seed - Random seed for reproducibility
 * @returns {HTMLCanvasElement} Complete sprite sheet canvas
 */
function generateSpriteSheet(seed = 12345) {
  const FRAME_SIZE = 40;
  const COLS = 5;
  const ROWS = 6;
  const SHEET_WIDTH = COLS * FRAME_SIZE; // 200px
  const SHEET_HEIGHT = ROWS * FRAME_SIZE; // 240px

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = SHEET_WIDTH;
  canvas.height = SHEET_HEIGHT;

  // Disable image smoothing for crisp pixel art
  ctx.imageSmoothingEnabled = false;

  const random = createSeededRandom(seed);
  const palette = COLOR_PALETTES.archeologist;

  // Generate sprite sheet by row
  const directions = ['up', 'down', 'left', 'right'];

  // Rows 0-3: Direction animations (idle + 4 walk frames)
  for (let row = 0; row < 4; row++) {
    const direction = directions[row];

    // Column 0: Idle frame
    const idleFrame = generateSymmetricalFrame(FRAME_SIZE, palette, random, { bodySize: 10 });
    ctx.putImageData(idleFrame, 0, row * FRAME_SIZE);

    // Columns 1-4: Walk frames
    for (let col = 1; col < 5; col++) {
      const walkFrame = generateWalkFrame(FRAME_SIZE, palette, random, col - 1, direction);
      ctx.putImageData(walkFrame, col * FRAME_SIZE, row * FRAME_SIZE);
    }
  }

  // Row 4: Tool animations (dig 3 frames, pickaxe 2 frames)
  // Dig: columns 0-2
  for (let col = 0; col < 3; col++) {
    const digFrame = generateToolFrame(FRAME_SIZE, palette, random, 'dig', col);
    ctx.putImageData(digFrame, col * FRAME_SIZE, 4 * FRAME_SIZE);
  }

  // Pickaxe: columns 3-4
  for (let col = 3; col < 5; col++) {
    const pickFrame = generateToolFrame(FRAME_SIZE, palette, random, 'pickaxe', col - 3);
    ctx.putImageData(pickFrame, col * FRAME_SIZE, 4 * FRAME_SIZE);
  }

  // Row 5: Tool animations (brush 2 frames, chisel 2 frames)
  // Brush: columns 0-1
  for (let col = 0; col < 2; col++) {
    const brushFrame = generateToolFrame(FRAME_SIZE, palette, random, 'brush', col);
    ctx.putImageData(brushFrame, col * FRAME_SIZE, 5 * FRAME_SIZE);
  }

  // Chisel: columns 2-3
  for (let col = 2; col < 4; col++) {
    const chiselFrame = generateToolFrame(FRAME_SIZE, palette, random, 'chisel', col - 2);
    ctx.putImageData(chiselFrame, col * FRAME_SIZE, 5 * FRAME_SIZE);
  }

  return canvas;
}

/**
 * Get sprite sheet as ImageData for caching
 * @param {number} seed - Random seed
 * @returns {ImageData} Sprite sheet as ImageData
 */
function getSpriteSheetImageData(seed = 12345) {
  const canvas = generateSpriteSheet(seed);
  const ctx = canvas.getContext('2d');
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateSpriteSheet,
    getSpriteSheetImageData,
    COLOR_PALETTES
  };
}
