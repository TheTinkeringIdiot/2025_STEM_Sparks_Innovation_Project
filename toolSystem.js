/**
 * Tool System and POI Interaction
 *
 * Implements the tool interaction system for the archeology game:
 * - Stadia rod: Always active for exploration (no-op)
 * - Magnifying glass: Shows hint text for correct tool at POI
 * - Excavation tools: Play animation, check if correct tool, update POI state
 * - Wrong tool (1st attempt): Red flash effect, increment wrongAttempts
 * - Wrong tool (2nd attempt): Remove POI, no artifact
 * - Correct tool: Play confetti, add artifact to inventory, remove POI
 *
 * Tool unlocks: L1=shovel, L2=pickaxe, L3=brush, L4=hammer&chisel
 * Block movement during tool animations (500ms)
 *
 * @module toolSystem
 */

/**
 * Tool System Manager
 * Handles all tool interactions, POI validation, and state management
 */
class ToolSystem {
  /**
   * @param {Object} gameState - Reference to game state
   * @param {CharacterAnimator} animator - Character animator for tool animations
   * @param {FlashEffect} flashEffect - Red flash effect for wrong tool
   * @param {ConfettiSystem} confettiSystem - Confetti system for celebration
   */
  constructor(gameState, animator, flashEffect, confettiSystem) {
    this.gameState = gameState;
    this.animator = animator;
    this.flashEffect = flashEffect;
    this.confettiSystem = confettiSystem;

    // Tool animation constants
    this.TOOL_ANIMATION_DURATION = 500; // ms - blocks movement
    this.isAnimating = false;
    this.animationStartTime = 0;

    // Current hint text (for magnifying glass)
    this.hintText = null;
    this.hintDuration = 3000; // ms - how long hint stays visible
    this.hintStartTime = 0;

    // Tool name mapping for display
    this.toolNames = {
      'shovel': 'Shovel',
      'pickaxe': 'Pickaxe',
      'brush': 'Brush',
      'hammer_chisel': 'Hammer & Chisel'
    };

    // Map tool IDs to animation states
    this.toolAnimationMap = {
      'shovel': 'digging',
      'pickaxe': 'pickaxing',
      'brush': 'brushing',
      'hammer_chisel': 'chiseling'
    };
  }

  /**
   * Update tool system state
   * Handles animation timing and hint text duration
   * @param {number} deltaTime - Time elapsed since last frame (ms)
   */
  update(deltaTime) {
    // Update animation state
    if (this.isAnimating) {
      const elapsed = performance.now() - this.animationStartTime;
      if (elapsed >= this.TOOL_ANIMATION_DURATION) {
        this.isAnimating = false;
        // Return to idle state after animation
        this.animator.setState('idle', this.gameState.player.direction);
      }
    }

    // Update hint text visibility
    if (this.hintText !== null) {
      const elapsed = performance.now() - this.hintStartTime;
      if (elapsed >= this.hintDuration) {
        this.hintText = null;
      }
    }
  }

  /**
   * Use the currently equipped tool
   * Handles all tool interactions including validation and state updates
   * @returns {boolean} True if tool was used successfully, false otherwise
   */
  useTool() {
    // Can't use tool while animation is playing
    if (this.isAnimating) {
      return false;
    }

    const currentTool = this.gameState.player.currentTool;

    // Handle stadia rod (no-op, always active)
    if (currentTool === 'stadia_rod') {
      return true;
    }

    // Handle magnifying glass (show hint)
    if (currentTool === 'magnifying_glass') {
      return this.useMagnifyingGlass();
    }

    // Handle excavation tools (shovel, pickaxe, brush, hammer_chisel)
    if (this.isExcavationTool(currentTool)) {
      return this.useExcavationTool(currentTool);
    }

    return false;
  }

  /**
   * Use magnifying glass to show hint about correct tool
   * @returns {boolean} True if hint was shown, false if no POI nearby
   */
  useMagnifyingGlass() {
    const nearbyPOI = this.findNearbyPOI();

    if (!nearbyPOI) {
      this.hintText = 'No site of interest nearby';
      this.hintStartTime = performance.now();
      return false;
    }

    // Get artifact and its required tool
    const artifact = getArtifact(nearbyPOI.artifact);
    if (!artifact) {
      this.hintText = 'Unknown artifact type';
      this.hintStartTime = performance.now();
      return false;
    }

    // Show hint about correct tool
    const toolName = this.toolNames[artifact.toolRequired];
    this.hintText = `Use ${toolName} to excavate this site`;
    this.hintStartTime = performance.now();
    return true;
  }

  /**
   * Use excavation tool on nearby POI
   * Handles animation, validation, and state updates
   * @param {string} toolId - ID of the excavation tool being used
   * @returns {boolean} True if tool was used, false if no POI nearby
   */
  useExcavationTool(toolId) {
    const nearbyPOI = this.findNearbyPOI();

    if (!nearbyPOI) {
      return false;
    }

    // Start tool animation
    this.startToolAnimation(toolId);

    // Get artifact and check if tool is correct
    const artifact = getArtifact(nearbyPOI.artifact);
    if (!artifact) {
      console.error('Invalid artifact ID:', nearbyPOI.artifact);
      return true;
    }

    const isCorrectTool = artifact.toolRequired === toolId;

    // Schedule outcome after animation completes
    setTimeout(() => {
      this.handleExcavationOutcome(nearbyPOI, artifact, isCorrectTool);
    }, this.TOOL_ANIMATION_DURATION);

    return true;
  }

  /**
   * Start tool animation
   * Blocks movement during animation
   * @param {string} toolId - ID of the tool to animate
   */
  startToolAnimation(toolId) {
    const animationState = this.toolAnimationMap[toolId];
    if (!animationState) {
      console.error('Unknown tool animation:', toolId);
      return;
    }

    this.isAnimating = true;
    this.animationStartTime = performance.now();
    this.animator.setState(animationState, this.gameState.player.direction);
  }

  /**
   * Handle the outcome of excavation tool use
   * @param {Object} poi - POI being excavated
   * @param {Object} artifact - Artifact at the POI
   * @param {boolean} isCorrectTool - Whether correct tool was used
   */
  handleExcavationOutcome(poi, artifact, isCorrectTool) {
    if (isCorrectTool) {
      // Correct tool: Success!
      this.handleCorrectTool(poi, artifact);
    } else {
      // Wrong tool: Increment attempts and handle failure
      this.handleWrongTool(poi);
    }
  }

  /**
   * Handle correct tool usage
   * - Play confetti effect
   * - Add artifact to inventory
   * - Remove POI from level
   * - Update hint text
   * @param {Object} poi - POI being excavated
   * @param {Object} artifact - Artifact extracted
   */
  handleCorrectTool(poi, artifact) {
    // Play confetti at POI location
    this.confettiSystem.emit(poi.x, poi.y, 40);

    // Add artifact to player inventory
    if (!this.gameState.player.inventory) {
      this.gameState.player.inventory = [];
    }
    this.gameState.player.inventory.push(artifact.id);

    // Remove POI from level
    this.removePOI(poi);

    // Show success message
    this.hintText = `Found: ${artifact.name}`;
    this.hintStartTime = performance.now();

    console.log('Artifact extracted:', artifact.name);
  }

  /**
   * Handle wrong tool usage
   * - First attempt: Red flash, increment wrongAttempts
   * - Second attempt: Remove POI permanently, no artifact
   * @param {Object} poi - POI being excavated
   */
  handleWrongTool(poi) {
    // Trigger red flash effect
    this.flashEffect.trigger();

    // Increment wrong attempts (initialize if needed)
    if (!poi.wrongAttempts) {
      poi.wrongAttempts = 0;
    }
    poi.wrongAttempts++;

    if (poi.wrongAttempts >= 2) {
      // Second wrong attempt: Remove POI permanently
      this.removePOI(poi);
      this.hintText = 'Site damaged beyond recovery';
      this.hintStartTime = performance.now();
      console.log('POI removed due to 2 wrong attempts');
    } else {
      // First wrong attempt: Warning
      this.hintText = 'Wrong tool! Try a different approach';
      this.hintStartTime = performance.now();
      console.log('Wrong tool used, attempts:', poi.wrongAttempts);
    }
  }

  /**
   * Find POI within 1 tile of player position
   * @returns {Object|null} Nearby POI or null if none found
   */
  findNearbyPOI() {
    const playerTileX = Math.floor(this.gameState.player.position.x / 40);
    const playerTileY = Math.floor(this.gameState.player.position.y / 40);

    // Check all POIs in level
    for (const poi of this.gameState.level.pois) {
      const poiTileX = Math.floor(poi.x / 40);
      const poiTileY = Math.floor(poi.y / 40);

      // Check if within 1 tile distance (Manhattan distance)
      const dx = Math.abs(playerTileX - poiTileX);
      const dy = Math.abs(playerTileY - poiTileY);

      if (dx <= 1 && dy <= 1) {
        return poi;
      }
    }

    return null;
  }

  /**
   * Remove POI from level
   * @param {Object} poi - POI to remove
   */
  removePOI(poi) {
    const index = this.gameState.level.pois.indexOf(poi);
    if (index !== -1) {
      this.gameState.level.pois.splice(index, 1);
    }
  }

  /**
   * Check if tool is an excavation tool
   * @param {string} toolId - Tool ID to check
   * @returns {boolean} True if excavation tool
   */
  isExcavationTool(toolId) {
    return toolId === 'shovel' ||
           toolId === 'pickaxe' ||
           toolId === 'brush' ||
           toolId === 'hammer_chisel';
  }

  /**
   * Check if tool system is currently animating
   * Used to block player movement during animations
   * @returns {boolean} True if animation is playing
   */
  isToolAnimating() {
    return this.isAnimating;
  }

  /**
   * Get current hint text (for UI rendering)
   * @returns {string|null} Current hint text or null if none
   */
  getHintText() {
    return this.hintText;
  }

  /**
   * Clear current hint text
   */
  clearHint() {
    this.hintText = null;
  }

  /**
   * Render hint text overlay
   * Should be called from the UI rendering layer
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {number} canvasWidth - Width of canvas
   * @param {number} canvasHeight - Height of canvas
   */
  renderHint(ctx, canvasWidth, canvasHeight) {
    if (!this.hintText) return;

    // Calculate fade based on remaining time
    const elapsed = performance.now() - this.hintStartTime;
    const remaining = this.hintDuration - elapsed;
    let alpha = 1;

    // Fade out in last 500ms
    if (remaining < 500) {
      alpha = remaining / 500;
    }

    // Render hint text at bottom center
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '20px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    const x = canvasWidth / 2;
    const y = canvasHeight - 40;

    // Draw text with outline for visibility
    ctx.strokeText(this.hintText, x, y);
    ctx.fillText(this.hintText, x, y);
    ctx.restore();
  }
}
