/**
 * Character Animation State Machine
 *
 * Manages sprite sheet animation states for the archeology game character.
 * Handles state transitions between idle, walking, and tool use animations.
 * Uses frame-rate independent timing with deltaTime accumulation.
 *
 * Frame durations:
 * - Walking: 100ms per frame (10 FPS for natural walk cycle)
 * - Tool animations: 80ms per frame (faster for responsive feedback)
 *
 * @module animator
 */

/**
 * Animation state types
 * @typedef {'idle' | 'walking' | 'digging' | 'pickaxing' | 'brushing' | 'chiseling'} AnimationState
 */

/**
 * Direction types
 * @typedef {'up' | 'down' | 'left' | 'right'} Direction
 */

/**
 * Sprite sheet animation definition
 * @typedef {Object} AnimationDefinition
 * @property {number} row - Row index in sprite sheet
 * @property {number} startCol - Starting column index
 * @property {number} frameCount - Number of frames in animation
 */

/**
 * Sprite sheet structure (200x240px, 40x40px frames)
 * @typedef {Object} SpriteSheet
 * @property {HTMLCanvasElement} image - Canvas containing sprite sheet
 * @property {number} frameWidth - Width of each frame (40px)
 * @property {number} frameHeight - Height of each frame (40px)
 * @property {Object.<string, AnimationDefinition>} animations - Animation definitions
 */

/**
 * Character animator class with state machine logic
 */
class CharacterAnimator {
  /**
   * @param {SpriteSheet} spriteSheet - Sprite sheet data
   */
  constructor(spriteSheet) {
    this.spriteSheet = spriteSheet;

    // Animation state
    this.currentState = 'idle';
    this.currentDirection = 'down';
    this.currentFrame = 0;
    this.frameTime = 0; // Accumulated time in ms
    this.frameDuration = 100; // Default frame duration (ms)
    this.loop = true; // Whether current animation loops

    // Frame duration constants
    this.WALK_FRAME_DURATION = 100; // ms per frame for walking
    this.TOOL_FRAME_DURATION = 80; // ms per frame for tool animations

    // Animation complete callback
    this.onAnimationComplete = null;
  }

  /**
   * Update animation state based on elapsed time
   * CRITICAL: Uses frameTime -= frameDuration to preserve timing remainder
   * Uses while loop to handle frame skipping on lag spikes
   *
   * @param {number} deltaTime - Time elapsed since last update (ms)
   */
  update(deltaTime) {
    // Accumulate time
    this.frameTime += deltaTime;

    // Use WHILE loop (not IF) to handle lag spikes and frame skipping
    while (this.frameTime >= this.frameDuration) {
      // CRITICAL: Subtract frameDuration, don't reset to 0
      // This preserves timing remainder and prevents 500ms drift over 30 minutes
      this.frameTime -= this.frameDuration;

      this.advanceFrame();
    }
  }

  /**
   * Advance to next frame in current animation
   * @private
   */
  advanceFrame() {
    const anim = this.getCurrentAnimation();
    this.currentFrame++;

    if (this.currentFrame >= anim.frameCount) {
      if (this.loop) {
        // Loop back to start
        this.currentFrame = 0;
      } else {
        // Hold on last frame for non-looping animations
        this.currentFrame = anim.frameCount - 1;

        // Trigger completion callback if set
        if (this.onAnimationComplete) {
          this.onAnimationComplete();
        }
      }
    }
  }

  /**
   * Set animation state and direction
   * Resets frame counter and timing when state changes
   *
   * @param {AnimationState} state - New animation state
   * @param {Direction} [direction] - Optional new direction
   */
  setState(state, direction) {
    // Only reset if state actually changed
    const stateChanged = this.currentState !== state;

    if (stateChanged) {
      this.currentState = state;
      this.currentFrame = 0;
      this.frameTime = 0;

      // Update frame duration based on animation type
      if (state === 'walking') {
        this.frameDuration = this.WALK_FRAME_DURATION;
        this.loop = true;
      } else if (state === 'idle') {
        this.frameDuration = this.WALK_FRAME_DURATION;
        this.loop = true;
      } else {
        // Tool animations (digging, pickaxing, brushing, chiseling)
        this.frameDuration = this.TOOL_FRAME_DURATION;
        this.loop = false; // Tool animations don't loop
      }
    }

    // Update direction if provided (even if state didn't change)
    if (direction !== undefined) {
      this.currentDirection = direction;
    }
  }

  /**
   * Get current animation definition based on state and direction
   * @returns {AnimationDefinition} Current animation definition
   * @private
   */
  getCurrentAnimation() {
    // Map state + direction to animation key
    let animKey;

    if (this.currentState === 'idle') {
      animKey = `idle${this.capitalize(this.currentDirection)}`;
    } else if (this.currentState === 'walking') {
      animKey = `walk${this.capitalize(this.currentDirection)}`;
    } else {
      // Tool animations (direction-independent)
      const toolMap = {
        'digging': 'dig',
        'pickaxing': 'pickaxe',
        'brushing': 'brush',
        'chiseling': 'chisel'
      };
      animKey = toolMap[this.currentState];
    }

    return this.spriteSheet.animations[animKey];
  }

  /**
   * Capitalize first letter of string
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   * @private
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Render current animation frame to canvas
   * IMPORTANT: Rounds x, y coordinates to integers for performance
   *
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {number} x - X position to render sprite (will be rounded)
   * @param {number} y - Y position to render sprite (will be rounded)
   */
  render(ctx, x, y) {
    const anim = this.getCurrentAnimation();

    // Calculate source position in sprite sheet
    const sx = anim.startCol * this.spriteSheet.frameWidth +
               (this.currentFrame * this.spriteSheet.frameWidth);
    const sy = anim.row * this.spriteSheet.frameHeight;

    // Draw sprite from sheet
    // CRITICAL: Round coordinates to whole numbers for performance
    // Sub-pixel rendering causes severe slowdown on macOS and some browsers
    ctx.drawImage(
      this.spriteSheet.image,
      sx, sy,
      this.spriteSheet.frameWidth,
      this.spriteSheet.frameHeight,
      Math.round(x),
      Math.round(y),
      this.spriteSheet.frameWidth,
      this.spriteSheet.frameHeight
    );
  }

  /**
   * Check if current animation is complete (for non-looping animations)
   * @returns {boolean} True if animation is on last frame and not looping
   */
  isAnimationComplete() {
    if (this.loop) {
      return false;
    }

    const anim = this.getCurrentAnimation();
    return this.currentFrame >= anim.frameCount - 1;
  }

  /**
   * Check if current animation is a tool animation (blocks movement)
   * @returns {boolean} True if currently playing a tool animation
   */
  isPlayingToolAnimation() {
    return this.currentState === 'digging' ||
           this.currentState === 'pickaxing' ||
           this.currentState === 'brushing' ||
           this.currentState === 'chiseling';
  }
}

/**
 * Create sprite sheet structure from generated canvas
 * @param {HTMLCanvasElement} spriteSheetCanvas - Generated sprite sheet canvas
 * @returns {SpriteSheet} Sprite sheet data structure
 */
function createSpriteSheetData(spriteSheetCanvas) {
  return {
    image: spriteSheetCanvas,
    frameWidth: 40,
    frameHeight: 40,
    animations: {
      // Row 0: Up direction
      idleUp: { row: 0, startCol: 0, frameCount: 1 },
      walkUp: { row: 0, startCol: 1, frameCount: 4 },

      // Row 1: Down direction
      idleDown: { row: 1, startCol: 0, frameCount: 1 },
      walkDown: { row: 1, startCol: 1, frameCount: 4 },

      // Row 2: Left direction
      idleLeft: { row: 2, startCol: 0, frameCount: 1 },
      walkLeft: { row: 2, startCol: 1, frameCount: 4 },

      // Row 3: Right direction
      idleRight: { row: 3, startCol: 0, frameCount: 1 },
      walkRight: { row: 3, startCol: 1, frameCount: 4 },

      // Row 4: Tool animations (shovel, pickaxe)
      dig: { row: 4, startCol: 0, frameCount: 3 },
      pickaxe: { row: 4, startCol: 3, frameCount: 2 },

      // Row 5: Tool animations (brush, chisel)
      brush: { row: 5, startCol: 0, frameCount: 2 },
      chisel: { row: 5, startCol: 2, frameCount: 2 }
    }
  };
}
