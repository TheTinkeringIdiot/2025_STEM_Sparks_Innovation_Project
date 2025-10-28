/**
 * Player Class
 * Handles player movement, collision detection, and camera/fog-of-war integration
 *
 * Movement is frame-rate independent using deltaTime
 * Collision detection uses tile-based system with separate X/Y tests for wall sliding
 * Integrates with Camera and FogOfWar systems
 */

const TILE_SIZE = 40;
const PLAYER_SPEED = 200; // pixels per second

class Player {
  /**
   * Creates a new player instance
   * @param {number} startX - Starting X position in pixels
   * @param {number} startY - Starting Y position in pixels
   */
  constructor(startX, startY) {
    // Position in pixel coordinates
    this.x = startX;
    this.y = startY;

    // Velocity components (direction vector, -1 to 1)
    this.velocityX = 0;
    this.velocityY = 0;

    // Movement speed in pixels per second
    this.speed = PLAYER_SPEED;

    // Current facing direction ('up', 'down', 'left', 'right')
    this.direction = 'down';
  }

  /**
   * Updates player position based on input and handles collision detection
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   * @param {Object} input - Input state from InputManager
   * @param {Array<Array<Object>>} levelGrid - 2D tile grid with isWalkable property
   * @param {Camera} camera - Camera instance to center on player
   * @param {FogOfWar} fogOfWar - Fog-of-war instance to update visibility
   */
  update(deltaTime, input, levelGrid, camera, fogOfWar) {
    // Reset velocity
    this.velocityX = 0;
    this.velocityY = 0;

    // Calculate velocity based on input (WASD and arrow keys)
    if (input.keys.up || input.keys.w) {
      this.velocityY = -1;
      this.direction = 'up';
    }
    if (input.keys.down || input.keys.s) {
      this.velocityY = 1;
      this.direction = 'down';
    }
    if (input.keys.left || input.keys.a) {
      this.velocityX = -1;
      this.direction = 'left';
    }
    if (input.keys.right || input.keys.d) {
      this.velocityX = 1;
      this.direction = 'right';
    }

    // Normalize diagonal movement to prevent faster diagonal speed
    if (this.velocityX !== 0 && this.velocityY !== 0) {
      const magnitude = Math.sqrt(
        this.velocityX * this.velocityX +
        this.velocityY * this.velocityY
      );
      this.velocityX /= magnitude;
      this.velocityY /= magnitude;
    }

    // Calculate desired movement for this frame
    const desiredDeltaX = this.velocityX * this.speed * deltaTime;
    const desiredDeltaY = this.velocityY * this.speed * deltaTime;

    // Test X movement separately (allows sliding along walls)
    if (desiredDeltaX !== 0) {
      const newX = this.x + desiredDeltaX;
      if (this.canMoveTo(newX, this.y, levelGrid)) {
        this.x = newX;
      }
    }

    // Test Y movement separately (allows sliding along walls)
    if (desiredDeltaY !== 0) {
      const newY = this.y + desiredDeltaY;
      if (this.canMoveTo(this.x, newY, levelGrid)) {
        this.y = newY;
      }
    }

    // Center camera on player
    if (camera) {
      camera.centerOn(this.x, this.y);
    }

    // Update fog-of-war based on new position
    if (fogOfWar) {
      fogOfWar.updateFog(this.x, this.y);
    }
  }

  /**
   * Checks if player can move to a given position using tile-based collision
   * @param {number} x - Desired X position in pixels
   * @param {number} y - Desired Y position in pixels
   * @param {Array<Array<Object>>} levelGrid - 2D tile grid with isWalkable property
   * @returns {boolean} True if position is walkable, false otherwise
   */
  canMoveTo(x, y, levelGrid) {
    // Convert pixel coordinates to tile coordinates
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);

    // Bounds check - ensure we're within the grid
    if (tileY < 0 || tileY >= levelGrid.length ||
        tileX < 0 || tileX >= levelGrid[0].length) {
      return false;
    }

    // Check if tile is walkable
    return levelGrid[tileY][tileX].isWalkable;
  }

  /**
   * Gets current player position
   * @returns {{x: number, y: number}} Position in pixels
   */
  getPosition() {
    return {
      x: this.x,
      y: this.y
    };
  }

  /**
   * Gets current tile coordinates
   * @returns {{tileX: number, tileY: number}} Tile coordinates
   */
  getTilePosition() {
    return {
      tileX: Math.floor(this.x / TILE_SIZE),
      tileY: Math.floor(this.y / TILE_SIZE)
    };
  }

  /**
   * Gets current facing direction
   * @returns {string} Direction ('up', 'down', 'left', 'right')
   */
  getDirection() {
    return this.direction;
  }

  /**
   * Checks if player is currently moving
   * @returns {boolean} True if player has velocity
   */
  isMoving() {
    return this.velocityX !== 0 || this.velocityY !== 0;
  }

  /**
   * Sets player position (useful for spawning or teleporting)
   * @param {number} x - New X position in pixels
   * @param {number} y - New Y position in pixels
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Serializes player state for save/load
   * @returns {Object} Serializable player state
   */
  serialize() {
    return {
      x: this.x,
      y: this.y,
      direction: this.direction,
      speed: this.speed
    };
  }

  /**
   * Restores player state from serialized data
   * @param {Object} data - Serialized player state
   */
  deserialize(data) {
    this.x = data.x;
    this.y = data.y;
    this.direction = data.direction;
    this.speed = data.speed || PLAYER_SPEED;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Player };
}
