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
  femaleArchaeologist: {
    outline: '#000000',     // Black outline
    skin: '#E8C4A0',        // Warm beige skin
    hair: '#5C3317',        // Dark brown hair/ponytail
    hatCrown: '#8B4513',    // Medium brown hat crown
    hatBrim: '#A0522D',     // Sienna hat brim
    vest: '#D4A574',        // Tan/khaki vest
    vestPocket: '#C9A86C',  // Light tan pocket detail
    shirt: '#E8E8E8',       // Light gray shirt under vest
    pants: '#4A5568',       // Gray-blue pants
    boots: '#2D3748',       // Dark gray boots
    eyes: '#2D3748',        // Dark eyes
  },
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
 * Set a pixel in ImageData
 * @param {Uint8ClampedArray} data - Image data array
 * @param {number} size - Frame size
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {string} hexColor - Hex color string
 */
function setPixel(data, size, x, y, hexColor) {
  if (x < 0 || x >= size || y < 0 || y >= size) return;
  const index = (y * size + x) * 4;
  const rgb = hexToRgb(hexColor);
  data[index] = rgb.r;
  data[index + 1] = rgb.g;
  data[index + 2] = rgb.b;
  data[index + 3] = 255;
}

/**
 * Draw a filled rectangle in ImageData
 * @param {Uint8ClampedArray} data - Image data array
 * @param {number} size - Frame size
 * @param {number} x - Start X
 * @param {number} y - Start Y
 * @param {number} width - Rectangle width
 * @param {number} height - Rectangle height
 * @param {string} hexColor - Hex color string
 */
function fillRect(data, size, x, y, width, height, hexColor) {
  for (let py = y; py < y + height; py++) {
    for (let px = x; px < x + width; px++) {
      setPixel(data, size, px, py, hexColor);
    }
  }
}

/**
 * Generate a female archaeologist sprite frame
 * @param {number} frameSize - Size of the frame (40px)
 * @param {object} colors - Color palette object
 * @param {object} options - Generation options
 * @returns {ImageData} Generated sprite frame
 */
function generateFemaleArchaeologistFrame(frameSize, colors, options = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = frameSize;
  canvas.height = frameSize;

  const imageData = ctx.createImageData(frameSize, frameSize);
  const data = imageData.data;

  const direction = options.direction || 'down';
  const isWalking = options.isWalking || false;
  const walkFrame = options.walkFrame || 0;

  // Character centered in 40x40 frame
  // Body is approximately 18px wide, 27px tall (50% larger than original)
  const centerX = 20;
  const startY = 5; // Top of hat (moved up to fit larger sprite)

  // Walk animation offsets (scaled up)
  const legOffsets = [0, 2, 0, -2]; // Walk cycle leg positions
  const bodyBob = isWalking ? [0, -1, 0, -1][walkFrame] : 0;
  const ponytailSwing = isWalking ? [-2, 0, 2, 0][walkFrame] : 0;

  // Drawing based on direction
  if (direction === 'down') {
    // === FACING DOWN (toward camera) === (50% larger)

    // Hat brim (wide, 15px)
    fillRect(data, frameSize, centerX - 7, startY + bodyBob, 15, 3, colors.hatBrim);

    // Hat crown (narrower, 9px)
    fillRect(data, frameSize, centerX - 4, startY + 3 + bodyBob, 9, 4, colors.hatCrown);

    // Face (skin)
    fillRect(data, frameSize, centerX - 3, startY + 7 + bodyBob, 6, 6, colors.skin);

    // Eyes (2 pixels each, dark)
    fillRect(data, frameSize, centerX - 2, startY + 9 + bodyBob, 2, 1, colors.eyes);
    fillRect(data, frameSize, centerX + 1, startY + 9 + bodyBob, 2, 1, colors.eyes);

    // Hair sides (framing face)
    fillRect(data, frameSize, centerX - 5, startY + 7 + bodyBob, 2, 3, colors.hair);
    fillRect(data, frameSize, centerX + 4, startY + 7 + bodyBob, 2, 3, colors.hair);

    // Neck
    fillRect(data, frameSize, centerX - 2, startY + 13 + bodyBob, 4, 2, colors.skin);

    // Vest (torso)
    fillRect(data, frameSize, centerX - 5, startY + 15 + bodyBob, 10, 7, colors.vest);

    // Shirt visible at center
    fillRect(data, frameSize, centerX - 2, startY + 15 + bodyBob, 4, 6, colors.shirt);

    // Vest pockets
    fillRect(data, frameSize, centerX - 4, startY + 18 + bodyBob, 2, 2, colors.vestPocket);
    fillRect(data, frameSize, centerX + 3, startY + 18 + bodyBob, 2, 2, colors.vestPocket);

    // Arms (skin)
    fillRect(data, frameSize, centerX - 7, startY + 16 + bodyBob, 2, 4, colors.skin);
    fillRect(data, frameSize, centerX + 6, startY + 16 + bodyBob, 2, 4, colors.skin);

    // Pants
    fillRect(data, frameSize, centerX - 5, startY + 22 + bodyBob, 10, 6, colors.pants);

    // Leg separation
    fillRect(data, frameSize, centerX - 1, startY + 24 + bodyBob, 2, 3, colors.outline);

    // Walking leg animation
    if (isWalking) {
      const leftLegOffset = legOffsets[walkFrame];
      const rightLegOffset = legOffsets[(walkFrame + 2) % 4];

      // Left leg
      fillRect(data, frameSize, centerX - 5, startY + 22 + bodyBob + leftLegOffset, 4, 6, colors.pants);
      // Right leg
      fillRect(data, frameSize, centerX + 1, startY + 22 + bodyBob + rightLegOffset, 4, 6, colors.pants);
    }

    // Boots
    fillRect(data, frameSize, centerX - 5, startY + 28 + bodyBob, 4, 3, colors.boots);
    fillRect(data, frameSize, centerX + 1, startY + 28 + bodyBob, 4, 3, colors.boots);

  } else if (direction === 'up') {
    // === FACING UP (away from camera) === (50% larger)

    // Hat crown (back view)
    fillRect(data, frameSize, centerX - 4, startY + bodyBob, 9, 6, colors.hatCrown);

    // Hat brim (narrower from back)
    fillRect(data, frameSize, centerX - 6, startY + 6 + bodyBob, 12, 2, colors.hatBrim);

    // Back of head (hair)
    fillRect(data, frameSize, centerX - 3, startY + 8 + bodyBob, 6, 4, colors.hair);

    // Ponytail (hanging down back)
    fillRect(data, frameSize, centerX - 2 + ponytailSwing, startY + 12 + bodyBob, 3, 8, colors.hair);
    fillRect(data, frameSize, centerX - 1 + ponytailSwing, startY + 20 + bodyBob, 2, 2, colors.hair);

    // Neck
    fillRect(data, frameSize, centerX - 2, startY + 12 + bodyBob, 4, 3, colors.skin);

    // Vest (back)
    fillRect(data, frameSize, centerX - 5, startY + 15 + bodyBob, 10, 7, colors.vest);

    // Arms
    fillRect(data, frameSize, centerX - 7, startY + 16 + bodyBob, 2, 4, colors.skin);
    fillRect(data, frameSize, centerX + 6, startY + 16 + bodyBob, 2, 4, colors.skin);

    // Pants
    fillRect(data, frameSize, centerX - 5, startY + 22 + bodyBob, 10, 6, colors.pants);

    // Leg separation
    fillRect(data, frameSize, centerX - 1, startY + 24 + bodyBob, 2, 3, colors.outline);

    // Walking animation
    if (isWalking) {
      const leftLegOffset = legOffsets[walkFrame];
      const rightLegOffset = legOffsets[(walkFrame + 2) % 4];
      fillRect(data, frameSize, centerX - 5, startY + 22 + bodyBob + leftLegOffset, 4, 6, colors.pants);
      fillRect(data, frameSize, centerX + 1, startY + 22 + bodyBob + rightLegOffset, 4, 6, colors.pants);
    }

    // Boots
    fillRect(data, frameSize, centerX - 5, startY + 28 + bodyBob, 4, 3, colors.boots);
    fillRect(data, frameSize, centerX + 1, startY + 28 + bodyBob, 4, 3, colors.boots);

  } else if (direction === 'left') {
    // === FACING LEFT (profile) === (50% larger)

    // Hat (profile)
    fillRect(data, frameSize, centerX - 5, startY + bodyBob, 8, 3, colors.hatBrim);
    fillRect(data, frameSize, centerX - 3, startY + 3 + bodyBob, 6, 4, colors.hatCrown);

    // Hair under hat
    fillRect(data, frameSize, centerX - 3, startY + 7 + bodyBob, 5, 3, colors.hair);

    // Face (profile)
    fillRect(data, frameSize, centerX - 5, startY + 7 + bodyBob, 3, 6, colors.skin);

    // Eye
    fillRect(data, frameSize, centerX - 5, startY + 9 + bodyBob, 2, 1, colors.eyes);

    // Ponytail extending to the right
    fillRect(data, frameSize, centerX + 2 + ponytailSwing, startY + 8 + bodyBob, 5, 3, colors.hair);
    fillRect(data, frameSize, centerX + 4 + ponytailSwing, startY + 11 + bodyBob, 3, 3, colors.hair);
    fillRect(data, frameSize, centerX + 5 + ponytailSwing, startY + 14 + bodyBob, 2, 2, colors.hair);

    // Neck
    fillRect(data, frameSize, centerX - 3, startY + 13 + bodyBob, 3, 2, colors.skin);

    // Vest (side view)
    fillRect(data, frameSize, centerX - 5, startY + 15 + bodyBob, 8, 7, colors.vest);

    // Shirt peek
    fillRect(data, frameSize, centerX - 5, startY + 15 + bodyBob, 2, 6, colors.shirt);

    // Pocket
    fillRect(data, frameSize, centerX, startY + 18 + bodyBob, 2, 2, colors.vestPocket);

    // Arm (front)
    fillRect(data, frameSize, centerX - 7, startY + 16 + bodyBob, 2, 4, colors.skin);

    // Pants (side)
    fillRect(data, frameSize, centerX - 4, startY + 22 + bodyBob, 7, 6, colors.pants);

    // Walking animation (legs front/back)
    if (isWalking) {
      const frontOffset = legOffsets[walkFrame];
      const backOffset = legOffsets[(walkFrame + 2) % 4];
      // Front leg
      fillRect(data, frameSize, centerX - 5 + frontOffset, startY + 22 + bodyBob, 3, 6, colors.pants);
      // Back leg
      fillRect(data, frameSize, centerX + backOffset, startY + 22 + bodyBob, 3, 6, colors.pants);
    }

    // Boots
    fillRect(data, frameSize, centerX - 4, startY + 28 + bodyBob, 5, 3, colors.boots);

  } else if (direction === 'right') {
    // === FACING RIGHT (profile, mirrored) === (50% larger)

    // Hat (profile)
    fillRect(data, frameSize, centerX - 3, startY + bodyBob, 8, 3, colors.hatBrim);
    fillRect(data, frameSize, centerX - 3, startY + 3 + bodyBob, 6, 4, colors.hatCrown);

    // Hair under hat
    fillRect(data, frameSize, centerX - 2, startY + 7 + bodyBob, 5, 3, colors.hair);

    // Face (profile)
    fillRect(data, frameSize, centerX + 2, startY + 7 + bodyBob, 3, 6, colors.skin);

    // Eye
    fillRect(data, frameSize, centerX + 4, startY + 9 + bodyBob, 2, 1, colors.eyes);

    // Ponytail extending to the left
    fillRect(data, frameSize, centerX - 7 + ponytailSwing, startY + 8 + bodyBob, 5, 3, colors.hair);
    fillRect(data, frameSize, centerX - 7 + ponytailSwing, startY + 11 + bodyBob, 3, 3, colors.hair);
    fillRect(data, frameSize, centerX - 7 + ponytailSwing, startY + 14 + bodyBob, 2, 2, colors.hair);

    // Neck
    fillRect(data, frameSize, centerX, startY + 13 + bodyBob, 3, 2, colors.skin);

    // Vest (side view)
    fillRect(data, frameSize, centerX - 3, startY + 15 + bodyBob, 8, 7, colors.vest);

    // Shirt peek
    fillRect(data, frameSize, centerX + 3, startY + 15 + bodyBob, 2, 6, colors.shirt);

    // Pocket
    fillRect(data, frameSize, centerX - 2, startY + 18 + bodyBob, 2, 2, colors.vestPocket);

    // Arm (front)
    fillRect(data, frameSize, centerX + 5, startY + 16 + bodyBob, 2, 4, colors.skin);

    // Pants (side)
    fillRect(data, frameSize, centerX - 3, startY + 22 + bodyBob, 7, 6, colors.pants);

    // Walking animation
    if (isWalking) {
      const frontOffset = legOffsets[walkFrame];
      const backOffset = legOffsets[(walkFrame + 2) % 4];
      // Front leg
      fillRect(data, frameSize, centerX + 2 - frontOffset, startY + 22 + bodyBob, 3, 6, colors.pants);
      // Back leg
      fillRect(data, frameSize, centerX - 3 - backOffset, startY + 22 + bodyBob, 3, 6, colors.pants);
    }

    // Boots
    fillRect(data, frameSize, centerX - 1, startY + 28 + bodyBob, 5, 3, colors.boots);
  }

  // Apply black outline
  const outlined = applyOutline(imageData, frameSize, colors.outline);

  return outlined;
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

  const colors = COLOR_PALETTES.femaleArchaeologist;

  // Generate sprite sheet by row
  const directions = ['up', 'down', 'left', 'right'];

  // Rows 0-3: Direction animations (idle + 4 walk frames)
  for (let row = 0; row < 4; row++) {
    const direction = directions[row];

    // Column 0: Idle frame
    const idleFrame = generateFemaleArchaeologistFrame(FRAME_SIZE, colors, {
      direction: direction,
      isWalking: false,
      walkFrame: 0
    });
    ctx.putImageData(idleFrame, 0, row * FRAME_SIZE);

    // Columns 1-4: Walk frames
    for (let col = 1; col < 5; col++) {
      const walkFrame = generateFemaleArchaeologistFrame(FRAME_SIZE, colors, {
        direction: direction,
        isWalking: true,
        walkFrame: col - 1
      });
      ctx.putImageData(walkFrame, col * FRAME_SIZE, row * FRAME_SIZE);
    }
  }

  // Row 4: Tool animations (dig 3 frames, pickaxe 2 frames)
  // Use facing down for tool animations
  // Dig: columns 0-2
  for (let col = 0; col < 3; col++) {
    const digFrame = generateFemaleArchaeologistFrame(FRAME_SIZE, colors, {
      direction: 'down',
      isWalking: false,
      walkFrame: 0
    });
    ctx.putImageData(digFrame, col * FRAME_SIZE, 4 * FRAME_SIZE);
  }

  // Pickaxe: columns 3-4
  for (let col = 3; col < 5; col++) {
    const pickFrame = generateFemaleArchaeologistFrame(FRAME_SIZE, colors, {
      direction: 'down',
      isWalking: false,
      walkFrame: 0
    });
    ctx.putImageData(pickFrame, col * FRAME_SIZE, 4 * FRAME_SIZE);
  }

  // Row 5: Tool animations (brush 2 frames, chisel 2 frames)
  // Brush: columns 0-1
  for (let col = 0; col < 2; col++) {
    const brushFrame = generateFemaleArchaeologistFrame(FRAME_SIZE, colors, {
      direction: 'down',
      isWalking: false,
      walkFrame: 0
    });
    ctx.putImageData(brushFrame, col * FRAME_SIZE, 5 * FRAME_SIZE);
  }

  // Chisel: columns 2-3
  for (let col = 2; col < 4; col++) {
    const chiselFrame = generateFemaleArchaeologistFrame(FRAME_SIZE, colors, {
      direction: 'down',
      isWalking: false,
      walkFrame: 0
    });
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
